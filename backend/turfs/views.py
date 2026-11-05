import math
import uuid
from datetime import date as date_cls

from django.core.files.storage import default_storage
from django.db.models import Avg, Count, F, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AMENITIES, DISTRICTS, SPORTS, Favorite, Review, Turf
from .serializers import ContactSerializer, ReviewSerializer, TurfSerializer


def haversine_km(lat1, lng1, lat2, lng2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def parse_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


class IsOwnerRole(BasePermission):
    message = "Only turf owner accounts can do this."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_owner)


class TurfViewSet(viewsets.ModelViewSet):
    serializer_class = TurfSerializer
    lookup_field = "slug"

    # -- permissions -----------------------------------------------------
    def get_permissions(self):
        if self.action in ("list", "retrieve", "availability"):
            return [AllowAny()]
        if self.action == "reviews":
            return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]
        if self.action == "favorite":
            return [IsAuthenticated()]
        return [IsOwnerRole()]

    # -- queryset --------------------------------------------------------
    def get_queryset(self):
        qs = Turf.objects.select_related("owner").annotate(
            avg_rating=Avg("reviews__rating"),
            review_count=Count("reviews", distinct=True),
        )
        user = self.request.user
        if self.action in ("update", "partial_update", "destroy"):
            return qs.filter(owner=user) if user.is_authenticated else qs.none()

        params = self.request.query_params
        if self.action == "list" and params.get("mine") and user.is_authenticated:
            return qs.filter(owner=user)
        if user.is_authenticated:
            return qs.filter(Q(is_active=True) | Q(owner=user))
        return qs.filter(is_active=True)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        user = self.request.user
        ctx["fav_ids"] = (
            set(Favorite.objects.filter(user=user).values_list("turf_id", flat=True))
            if user.is_authenticated else set()
        )
        return ctx

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    # -- list with filters / search / distance sort ---------------------
    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        p = request.query_params

        if p.get("q"):
            q = p["q"].strip()
            qs = qs.filter(Q(name__icontains=q) | Q(address__icontains=q) | Q(district__icontains=q))
        if p.get("district"):
            qs = qs.filter(district__iexact=p["district"])
        if p.get("sport"):
            qs = qs.filter(sport=p["sport"])
        if parse_float(p.get("min_price")) is not None:
            qs = qs.filter(price_per_hour__gte=int(float(p["min_price"])))
        if parse_float(p.get("max_price")) is not None:
            qs = qs.filter(price_per_hour__lte=int(float(p["max_price"])))

        sort = p.get("sort", "rating")
        if sort == "price_asc":
            qs = qs.order_by("price_per_hour", "name")
        elif sort == "price_desc":
            qs = qs.order_by("-price_per_hour", "name")
        else:
            qs = qs.order_by(F("avg_rating").desc(nulls_last=True), "name")

        items = list(qs)
        # JSON "contains" lookups are unsupported on SQLite, so amenities are filtered in Python.
        wanted = [a for a in p.get("amenities", "").split(",") if a]
        if wanted:
            items = [t for t in items if all(a in (t.amenities or []) for a in wanted)]
        lat, lng = parse_float(p.get("lat")), parse_float(p.get("lng"))
        if lat is not None and lng is not None:
            for t in items:
                t.distance_km = round(haversine_km(lat, lng, float(t.latitude), float(t.longitude)), 1)
            if sort == "near":
                items.sort(key=lambda t: t.distance_km)
            radius = parse_float(p.get("radius_km"))
            if radius:
                items = [t for t in items if t.distance_km <= radius]

        return Response(self.get_serializer(items, many=True).data)

    # -- availability ----------------------------------------------------
    @action(detail=True, methods=["get"])
    def availability(self, request, slug=None):
        from bookings.services import get_availability  # local import avoids a circular dependency

        turf = self.get_object()
        raw = request.query_params.get("date")
        try:
            day = date_cls.fromisoformat(raw) if raw else date_cls.today()
        except ValueError:
            return Response({"detail": "Use date=YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"date": day.isoformat(), "slots": get_availability(turf, day)})

    # -- reviews ---------------------------------------------------------
    @action(detail=True, methods=["get", "post"])
    def reviews(self, request, slug=None):
        turf = self.get_object()
        if request.method == "GET":
            qs = turf.reviews.select_related("user")
            return Response(ReviewSerializer(qs, many=True).data)

        if turf.owner_id == request.user.id:
            return Response({"detail": "You can't review your own turf."}, status=status.HTTP_403_FORBIDDEN)
        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        rating = serializer.validated_data["rating"]
        if not 1 <= rating <= 5:
            return Response({"rating": ["Rating must be 1-5."]}, status=status.HTTP_400_BAD_REQUEST)
        review, _ = Review.objects.update_or_create(
            turf=turf, user=request.user,
            defaults={"rating": rating, "comment": serializer.validated_data.get("comment", "")},
        )
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)

    # -- favourites ------------------------------------------------------
    @action(detail=True, methods=["post"])
    def favorite(self, request, slug=None):
        turf = self.get_object()
        fav, created = Favorite.objects.get_or_create(user=request.user, turf=turf)
        if not created:
            fav.delete()
        return Response({"is_favorite": created})


class FavoritesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ids = Favorite.objects.filter(user=request.user).values_list("turf_id", flat=True)
        qs = Turf.objects.filter(id__in=ids, is_active=True).annotate(
            avg_rating=Avg("reviews__rating"), review_count=Count("reviews", distinct=True)
        )
        return Response(TurfSerializer(qs, many=True, context={"fav_ids": set(ids)}).data)


class MetaView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "districts": DISTRICTS,
            "sports": [{"value": v, "label": l} for v, l in SPORTS],
            "amenities": AMENITIES,
        })


class ContactView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ContactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Thanks! We'll get back to you within one working day."},
                        status=status.HTTP_201_CREATED)


class UploadView(APIView):
    """Owner-only image upload. Stores to MEDIA_ROOT and returns an absolute URL."""

    permission_classes = [IsOwnerRole]
    ALLOWED = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    MAX_BYTES = 3 * 1024 * 1024

    def post(self, request):
        file = request.FILES.get("file")
        if file is None:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)
        ext = self.ALLOWED.get(file.content_type)
        if ext is None:
            return Response({"detail": "Only JPG, PNG or WebP images are allowed."},
                            status=status.HTTP_400_BAD_REQUEST)
        if file.size > self.MAX_BYTES:
            return Response({"detail": "Image must be 3 MB or smaller."}, status=status.HTTP_400_BAD_REQUEST)
        name = default_storage.save(f"turfs/{uuid.uuid4().hex}.{ext}", file)
        return Response({"url": request.build_absolute_uri(default_storage.url(name))},
                        status=status.HTTP_201_CREATED)
