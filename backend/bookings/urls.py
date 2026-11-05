from django.urls import path

from .views import (BookingCancelView, BookingDetailView, BookingListCreateView,
                    OwnerBookingsView, OwnerStatsView)

urlpatterns = [
    path("bookings/", BookingListCreateView.as_view()),
    path("bookings/<str:code>/", BookingDetailView.as_view()),
    path("bookings/<str:code>/cancel/", BookingCancelView.as_view()),
    path("owner/bookings/", OwnerBookingsView.as_view()),
    path("owner/stats/", OwnerStatsView.as_view()),
]
