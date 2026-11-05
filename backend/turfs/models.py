from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.text import slugify

DISTRICTS = [
    "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
    "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram",
    "Kozhikode", "Wayanad", "Kannur", "Kasaragod",
]

SPORTS = [
    ("football", "Football"),
    ("cricket", "Box Cricket"),
    ("badminton", "Badminton"),
    ("basketball", "Basketball"),
    ("multi", "Multi-sport"),
]

AMENITIES = [
    "Floodlights", "Parking", "Washrooms", "Changing room", "Drinking water",
    "Cafe", "Equipment rental", "First aid", "Spectator seating", "CCTV",
]


class Turf(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="turfs")
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    sport = models.CharField(max_length=12, choices=SPORTS, default="football")
    description = models.TextField(blank=True)
    district = models.CharField(max_length=30, choices=[(d, d) for d in DISTRICTS])
    address = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    price_per_hour = models.PositiveIntegerField(validators=[MinValueValidator(100)])
    weekend_price = models.PositiveIntegerField(null=True, blank=True)
    open_hour = models.PositiveSmallIntegerField(default=6, validators=[MaxValueValidator(23)])
    close_hour = models.PositiveSmallIntegerField(default=23, validators=[MinValueValidator(1), MaxValueValidator(24)])
    size = models.CharField(max_length=40, blank=True, help_text="e.g. 7-a-side, 60x40 ft")
    surface = models.CharField(max_length=60, blank=True, default="Artificial turf")
    amenities = models.JSONField(default=list, blank=True)
    images = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.district})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)[:120] or "turf"
            slug, n = base, 2
            while Turf.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)


class Review(models.Model):
    turf = models.ForeignKey(Turf, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, max_length=1000)
    created_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [models.UniqueConstraint(fields=["turf", "user"], name="one_review_per_user_per_turf")]


class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorites")
    turf = models.ForeignKey(Turf, on_delete=models.CASCADE, related_name="favorited_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "turf"], name="unique_favorite")]


class ContactMessage(models.Model):
    name = models.CharField(max_length=80)
    email = models.EmailField()
    subject = models.CharField(max_length=140, blank=True)
    message = models.TextField(max_length=3000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
