from rest_framework import serializers

from .models import AMENITIES, ContactMessage, Review, Turf

# Rough bounding box of Kerala, used to keep listings on the map where they belong.
KERALA_LAT = (8.0, 13.0)
KERALA_LNG = (74.7, 77.6)

DEFAULT_IMAGES = {
    "football": ["/img/turfs/football-day.svg", "/img/turfs/football-dusk.svg", "/img/turfs/football-night.svg"],
    "cricket": ["/img/turfs/cricket-day.svg", "/img/turfs/cricket-dusk.svg", "/img/turfs/cricket-night.svg"],
    "badminton": ["/img/turfs/badminton-day.svg", "/img/turfs/badminton-dusk.svg", "/img/turfs/badminton-night.svg"],
    "basketball": ["/img/turfs/basketball-day.svg", "/img/turfs/basketball-dusk.svg", "/img/turfs/basketball-night.svg"],
    "multi": ["/img/turfs/multi-day.svg", "/img/turfs/multi-dusk.svg", "/img/turfs/multi-night.svg"],
}


class TurfSerializer(serializers.ModelSerializer):
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    distance_km = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source="owner.first_name", read_only=True)
    sport_label = serializers.CharField(source="get_sport_display", read_only=True)

    class Meta:
        model = Turf
        fields = [
            "id", "slug", "name", "sport", "sport_label", "description", "district", "address",
            "latitude", "longitude", "price_per_hour", "weekend_price", "open_hour", "close_hour",
            "size", "surface", "amenities", "images", "is_active", "owner_name",
            "avg_rating", "review_count", "is_favorite", "distance_km",
        ]
        read_only_fields = ["id", "slug"]

    # -- computed fields -------------------------------------------------
    def get_avg_rating(self, obj):
        value = getattr(obj, "avg_rating", None)
        return round(float(value), 1) if value else None

    def get_review_count(self, obj):
        return getattr(obj, "review_count", 0) or 0

    def get_is_favorite(self, obj):
        return obj.id in self.context.get("fav_ids", set())

    def get_distance_km(self, obj):
        return getattr(obj, "distance_km", None)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not data["images"]:
            data["images"] = DEFAULT_IMAGES.get(instance.sport, DEFAULT_IMAGES["multi"])
        return data

    # -- validation ------------------------------------------------------
    def validate_latitude(self, value):
        if not KERALA_LAT[0] <= float(value) <= KERALA_LAT[1]:
            raise serializers.ValidationError("Location must be inside Kerala.")
        return value

    def validate_longitude(self, value):
        if not KERALA_LNG[0] <= float(value) <= KERALA_LNG[1]:
            raise serializers.ValidationError("Location must be inside Kerala.")
        return value

    def validate_amenities(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Must be a list.")
        return [a for a in value if a in AMENITIES]

    def validate_images(self, value):
        if not isinstance(value, list) or len(value) > 8:
            raise serializers.ValidationError("Provide up to 8 image URLs.")
        for url in value:
            if not isinstance(url, str) or not (url.startswith("/") or url.startswith("http")):
                raise serializers.ValidationError("Images must be URLs.")
        return value

    def validate(self, attrs):
        open_h = attrs.get("open_hour", getattr(self.instance, "open_hour", 6))
        close_h = attrs.get("close_hour", getattr(self.instance, "close_hour", 23))
        if close_h <= open_h:
            raise serializers.ValidationError({"close_hour": "Closing time must be after opening time."})
        return attrs


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ["id", "user_name", "rating", "comment", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_user_name(self, obj):
        return obj.user.first_name or "Player"


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["name", "email", "subject", "message"]
