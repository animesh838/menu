from django.db import models


class Order(models.Model):
    STATUS_NEW = "new"
    STATUS_PREPARING = "preparing"
    STATUS_READY = "ready"
    STATUS_DONE = "done"

    STATUS_CHOICES = [
        (STATUS_NEW, "New"),
        (STATUS_PREPARING, "Preparing"),
        (STATUS_READY, "Ready"),
        (STATUS_DONE, "Served"),
    ]

    number = models.CharField(max_length=8)
    customer = models.CharField(max_length=120)
    table = models.CharField(max_length=20, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=STATUS_NEW)
    subtotal = models.DecimalField(max_digits=9, decimal_places=2)
    service = models.DecimalField(max_digits=9, decimal_places=2)
    total = models.DecimalField(max_digits=9, decimal_places=2)
    placed_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-placed_at"]

    def __str__(self):
        return f"#{self.number} ({self.get_status_display()})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    dish_id = models.CharField(max_length=60, blank=True)
    name = models.CharField(max_length=120)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    qty = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.qty}x {self.name}"
