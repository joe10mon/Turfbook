from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class TurfUserAdmin(UserAdmin):
    list_display = ("email", "first_name", "role", "phone", "is_staff")
    list_filter = ("role", "is_staff")
    fieldsets = UserAdmin.fieldsets + (("TurfBook", {"fields": ("role", "phone")}),)
