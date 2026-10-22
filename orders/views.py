"""JSON API used by both the guest menu and the kitchen board.

Both pages are served by this same Django project, so every device talking to
the same server sees the same orders.
"""

import json
import random
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Order, OrderItem

# Keep in sync with RESTAURANT.serviceChargeRate in static/shared.js.
SERVICE_CHARGE_RATE = Decimal("0.10")

MAX_ORDER_LINES = 40
MAX_LINE_QTY = 20
RECENT_ORDER_LIMIT = 100


def serialize(order):
    return {
        "id": order.id,
        "number": order.number,
        "customer": order.customer,
        "table": order.table,
        "phone": order.phone,
        "notes": order.notes,
        "status": order.status,
        "subtotal": float(order.subtotal),
        "service": float(order.service),
        "total": float(order.total),
        "placedAt": order.placed_at.isoformat(),
        "updatedAt": order.updated_at.isoformat(),
        "items": [
            {
                "dishId": item.dish_id,
                "name": item.name,
                "price": float(item.price),
                "qty": item.qty,
            }
            for item in order.items.all()
        ],
    }


def bad_request(message):
    return JsonResponse({"error": message}, status=400)


def parse_body(request):
    try:
        return json.loads(request.body or b"{}")
    except json.JSONDecodeError:
        return None


def new_order_number():
    """A short number staff can read off a ticket."""
    return str(random.randint(1000, 9999))


@csrf_exempt
@require_http_methods(["GET", "POST"])
def orders_collection(request):
    if request.method == "GET":
        orders = (
            Order.objects.prefetch_related("items")
            .order_by("-placed_at")[:RECENT_ORDER_LIMIT]
        )
        return JsonResponse({"orders": [serialize(order) for order in orders]})

    return create_order(request)


def create_order(request):
    payload = parse_body(request)
    if payload is None:
        return bad_request("Invalid JSON body")

    lines = payload.get("items")
    if not isinstance(lines, list) or not lines:
        return bad_request("An order needs at least one item")
    if len(lines) > MAX_ORDER_LINES:
        return bad_request("Too many items in one order")

    customer = str(payload.get("customer", "")).strip()
    if not customer:
        return bad_request("A name is required")

    cleaned_items = []
    subtotal = Decimal("0")

    for line in lines:
        if not isinstance(line, dict):
            return bad_request("Each item must be an object")

        name = str(line.get("name", "")).strip()
        if not name:
            return bad_request("Every item needs a name")

        try:
            price = Decimal(str(line.get("price")))
            qty = int(line.get("qty"))
        except (InvalidOperation, TypeError, ValueError):
            return bad_request(f"Invalid price or quantity for {name}")

        if price < 0:
            return bad_request(f"Negative price for {name}")
        if not 1 <= qty <= MAX_LINE_QTY:
            return bad_request(f"Quantity must be between 1 and {MAX_LINE_QTY}")

        subtotal += price * qty
        cleaned_items.append(
            {
                "dish_id": str(line.get("id", ""))[:60],
                "name": name[:120],
                "price": price,
                "qty": qty,
            }
        )

    service = (subtotal * SERVICE_CHARGE_RATE).quantize(Decimal("0.01"))

    with transaction.atomic():
        order = Order.objects.create(
            number=new_order_number(),
            customer=customer[:120],
            table=str(payload.get("table", "")).strip()[:20],
            phone=str(payload.get("phone", "")).strip()[:30],
            notes=str(payload.get("notes", "")).strip()[:500],
            subtotal=subtotal,
            service=service,
            total=subtotal + service,
        )
        OrderItem.objects.bulk_create(
            [OrderItem(order=order, **item) for item in cleaned_items]
        )

    return JsonResponse(serialize(order), status=201)


@csrf_exempt
@require_http_methods(["GET", "PATCH"])
def order_detail(request, order_id):
    order = get_object_or_404(
        Order.objects.prefetch_related("items"), pk=order_id
    )

    if request.method == "GET":
        return JsonResponse(serialize(order))

    payload = parse_body(request)
    if payload is None:
        return bad_request("Invalid JSON body")

    status = payload.get("status")
    valid_statuses = [value for value, _ in Order.STATUS_CHOICES]
    if status not in valid_statuses:
        return bad_request(f"Status must be one of {', '.join(valid_statuses)}")

    order.status = status
    order.save(update_fields=["status", "updated_at"])
    return JsonResponse(serialize(order))


@csrf_exempt
@require_http_methods(["POST"])
def clear_finished(request):
    deleted, _ = Order.objects.filter(status=Order.STATUS_DONE).delete()
    return JsonResponse({"deleted": deleted})
