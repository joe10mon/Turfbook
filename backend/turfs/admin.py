from django.contrib import admin

from .models import ContactMessage, Favorite, Review, Turf


@admin.register(Turf)
class TurfAdmin(admin.ModelAdmin):
    list_display = ("name", "district", "sport", "price_per_hour", "owner", "is_active")
    list_filter = ("district", "sport", "is_active")
    search_fields = ("name", "address")
    prepopulated_fields = {"slug": ("name",)}


admin.site.register(Review)
admin.site.register(Favorite)


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "subject", "created_at")
