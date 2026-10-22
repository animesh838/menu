from django.urls import path

from . import views

urlpatterns = [
    path("orders/", views.orders_collection, name="orders-collection"),
    path("orders/clear-finished/", views.clear_finished, name="orders-clear-finished"),
    path("orders/<int:order_id>/", views.order_detail, name="order-detail"),
]
