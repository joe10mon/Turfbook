from django.contrib import admin

from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("code", "turf", "user", "date", "start_hour", "end_hour", "amount", "status", "payment_status")
    list_filter = ("status", "payment_status", "date")
    search_fields = ("code", "player_name", "player_phone", "turf__name")
