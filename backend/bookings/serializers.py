from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from turfs.models import Turf

from .models import Booking
from .services import get_availability, hour_label

CANCEL_WINDOW_HOURS = 2


class BookingSerializer(serializers.ModelSerializer):
    turf_name = serializers.CharField(source="turf.name", read_only=True)
    turf_slug = serializers.CharField(source="turf.slug", read_only=True)
    turf_image = serializers.SerializerMethodField()
    district = serializers.CharField(source="turf.district", read_only=True)
    address = serializers.CharField(source="turf.address", read_only=True)
    latitude = serializers.DecimalField(source="turf.latitude", max_digits=9, decimal_places=6, read_only=True)
    longitude = serializers.DecimalField(source="turf.longitude", max_digits=9, decimal_places=6, read_only=True)
    sport = serializers.CharField(source="turf.sport", read_only=True)
    time_label = serializers.SerializerMethodField()
    hours = serializers.IntegerField(read_only=True)
    can_cancel = serializers.SerializerMethodField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    payment_label = serializers.CharField(source="get_payment_status_display", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "code", "turf_name", "turf_slug", "turf_image", "district", "address", "latitude", "longitude",
            "sport", "date", "start_hour", "end_hour", "time_label", "hours", "amount",
            "status", "status_label", "payment_method", "payment_status", "payment_label",
            "player_name", "player_phone", "can_cancel", "created_at",
        ]

    def get_turf_image(self, obj):
        return obj.turf.images[0] if obj.turf.images else None

    def get_time_label(self, obj):
        return f"{hour_label(obj.start_hour)} – {hour_label(obj.end_hour)}"

    def get_can_cancel(self, obj):
        if obj.status != Booking.Status.CONFIRMED:
            return False
        delta = obj.start_datetime - timezone.now()
        return delta.total_seconds() >= CANCEL_WINDOW_HOURS * 3600


class BookingCreateSerializer(serializers.Serializer):
    turf = serializers.SlugField()
    date = serializers.DateField()
    hours = serializers.ListField(child=serializers.IntegerField(min_value=0, max_value=23),
                                  min_length=1, max_length=6)
    player_name = serializers.CharField(max_length=80)
    player_phone = serializers.RegexField(r"^[0-9]{10}$",
                                          error_messages={"invalid": "Enter a 10-digit mobile number."})
    payment_method = serializers.ChoiceField(choices=Booking.PaymentMethod.values)

    def validate_date(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError("You can't book a date in the past.")
        if (value - timezone.localdate()).days > 60:
            raise serializers.ValidationError("Bookings open up to 60 days ahead.")
        return value

    def validate(self, attrs):
        try:
            attrs["turf_obj"] = Turf.objects.get(slug=attrs["turf"], is_active=True)
        except Turf.DoesNotExist:
            raise serializers.ValidationError({"turf": "Turf not found."})
        hours = sorted(set(attrs["hours"]))
        if hours != list(range(hours[0], hours[-1] + 1)):
            raise serializers.ValidationError({"hours": "Pick consecutive hours for a single booking."})
        attrs["hours"] = hours
        return attrs

    def create(self, data):
        turf, day, hours = data["turf_obj"], data["date"], data["hours"]
        with transaction.atomic():
            # Lock the turf row so two players can't grab the same slot at once
            # (a no-op on SQLite, effective on PostgreSQL/MySQL).
            Turf.objects.select_for_update().get(pk=turf.pk)
            slots = {s["hour"]: s for s in get_availability(turf, day)}
            for h in hours:
                slot = slots.get(h)
                if slot is None or not slot["available"]:
                    raise serializers.ValidationError(
                        {"hours": f"{hour_label(h)} is no longer available. Please pick another slot."}
                    )
            method = data["payment_method"]
            return Booking.objects.create(
                user=self.context["request"].user,
                turf=turf,
                date=day,
                start_hour=hours[0],
                end_hour=hours[-1] + 1,
                amount=sum(slots[h]["price"] for h in hours),
                payment_method=method,
                # Demo checkout: UPI/card are marked paid immediately. Swap in a real
                # gateway (e.g. Razorpay) and confirm via webhook before going live.
                payment_status=(Booking.PaymentStatus.PENDING if method == "venue"
                                else Booking.PaymentStatus.PAID),
                player_name=data["player_name"],
                player_phone=data["player_phone"],
            )
