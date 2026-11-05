from datetime import timedelta

from django.db.models import Count, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from turfs.models import Turf
from turfs.views import IsOwnerRole

from .models import Booking
from .serializers import BookingCreateSerializer, BookingSerializer


def visible_bookings(user):
    """A booking is visible to the player who made it and to the owner of the turf."""
    from django.db.models import Q
    return Booking.objects.select_related("turf").filter(Q(user=user) | Q(turf__owner=user))


class BookingListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.select_related("turf").filter(user=self.request.user)

    def get_serializer_class(self):
        return BookingCreateSerializer if self.request.method == "POST" else BookingSerializer

    def create(self, request, *args, **kwargs):
        serializer = BookingCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class BookingDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookingSerializer
    lookup_field = "code"

    def get_queryset(self):
        return visible_bookings(self.request.user)


class BookingCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, code):
        booking = get_object_or_404(visible_bookings(request.user), code=code)
        is_turf_owner = booking.turf.owner_id == request.user.id
        if booking.status != Booking.Status.CONFIRMED:
            return Response({"detail": "This booking is already cancelled."}, status=status.HTTP_400_BAD_REQUEST)
        if not is_turf_owner and not BookingSerializer().get_can_cancel(booking):
            return Response({"detail": "Bookings can only be cancelled up to 2 hours before the start time."},
                            status=status.HTTP_400_BAD_REQUEST)
        booking.status = Booking.Status.CANCELLED
        if booking.payment_status == Booking.PaymentStatus.PAID:
            booking.payment_status = Booking.PaymentStatus.REFUNDED
        booking.save(update_fields=["status", "payment_status"])
        return Response(BookingSerializer(booking).data)


class OwnerBookingsView(generics.ListAPIView):
    permission_classes = [IsOwnerRole]
    serializer_class = BookingSerializer

    def get_queryset(self):
        qs = Booking.objects.select_related("turf").filter(turf__owner=self.request.user)
        p = self.request.query_params
        if p.get("status"):
            qs = qs.filter(status=p["status"])
        if p.get("turf"):
            qs = qs.filter(turf__slug=p["turf"])
        return qs


class OwnerStatsView(APIView):
    permission_classes = [IsOwnerRole]

    def get(self, request):
        today = timezone.localdate()
        confirmed = Booking.objects.filter(turf__owner=request.user, status=Booking.Status.CONFIRMED)

        daily = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            agg = confirmed.filter(date=day).aggregate(revenue=Sum("amount"), bookings=Count("id"))
            daily.append({"date": day.isoformat(), "revenue": agg["revenue"] or 0, "bookings": agg["bookings"]})

        by_turf = list(
            confirmed.values("turf__name").annotate(bookings=Count("id"), revenue=Sum("amount"))
            .order_by("-revenue")
        )
        return Response({
            "turfs": Turf.objects.filter(owner=request.user).count(),
            "total_bookings": confirmed.count(),
            "total_revenue": confirmed.aggregate(s=Sum("amount"))["s"] or 0,
            "upcoming": confirmed.filter(date__gte=today).count(),
            "today": confirmed.filter(date=today).count(),
            "last_7_days": daily,
            "by_turf": [{"name": r["turf__name"], "bookings": r["bookings"], "revenue": r["revenue"]} for r in by_turf],
        })
