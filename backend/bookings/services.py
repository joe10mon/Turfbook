from django.utils import timezone

from .models import Booking


def hour_label(h):
    """15 -> '3:00 PM', 24 -> '12:00 AM'."""
    suffix = "AM" if (h % 24) < 12 else "PM"
    return f"{(h % 12) or 12}:00 {suffix}"


def slot_price(turf, day):
    """Weekend (Sat/Sun) price applies when the owner has set one."""
    if day.weekday() >= 5 and turf.weekend_price:
        return turf.weekend_price
    return turf.price_per_hour


def get_availability(turf, day):
    booked = set()
    for b in Booking.objects.filter(turf=turf, date=day, status=Booking.Status.CONFIRMED):
        booked.update(range(b.start_hour, b.end_hour))

    now = timezone.localtime()
    slots = []
    for h in range(turf.open_hour, turf.close_hour):
        past = day < now.date() or (day == now.date() and h <= now.hour)
        if h in booked:
            state = "booked"
        elif past:
            state = "past"
        else:
            state = "open"
        slots.append({
            "hour": h,
            "label": f"{hour_label(h)} – {hour_label(h + 1)}",
            "price": slot_price(turf, day),
            "state": state,
            "available": state == "open",
        })
    return slots
