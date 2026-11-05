import secrets
import string
from datetime import datetime, time

from django.conf import settings
from django.db import models
from django.utils import timezone


def make_code():
    alphabet = string.ascii_uppercase + string.digits
    return "TB" + "".join(secrets.choice(alphabet) for _ in range(8))


class Booking(models.Model):
    class Status(models.TextChoices):
        CONFIRMED = "confirmed", "Confirmed"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentStatus(models.TextChoices):
        PAID = "paid", "Paid"
        PENDING = "pending", "Pay at venue"
        REFUNDED = "refunded", "Refunded"

    class PaymentMethod(models.TextChoices):
        UPI = "upi", "UPI"
        CARD = "card", "Card"
        VENUE = "venue", "Pay at venue"

    code = models.CharField(max_length=12, unique=True, default=make_code, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings")
    turf = models.ForeignKey("turfs.Turf", on_delete=models.CASCADE, related_name="bookings")
    date = models.DateField()
    start_hour = models.PositiveSmallIntegerField()
    end_hour = models.PositiveSmallIntegerField(help_text="Exclusive end hour (24 = midnight)")
    amount = models.PositiveIntegerField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.CONFIRMED)
    payment_method = models.CharField(max_length=6, choices=PaymentMethod.choices, default=PaymentMethod.UPI)
    payment_status = models.CharField(max_length=10, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    player_name = models.CharField(max_length=80)
    player_phone = models.CharField(max_length=15)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-start_hour"]
        indexes = [models.Index(fields=["turf", "date", "status"])]

    def __str__(self):
        return f"{self.code} · {self.turf.name} · {self.date}"

    @property
    def hours(self):
        return self.end_hour - self.start_hour

    @property
    def start_datetime(self):
        return timezone.make_aware(datetime.combine(self.date, time(hour=self.start_hour)))
