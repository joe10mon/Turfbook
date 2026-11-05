from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Players book turfs; owners list and manage them."""

    class Role(models.TextChoices):
        CUSTOMER = "customer", "Player"
        OWNER = "owner", "Turf owner"

    email = models.EmailField("email address", unique=True)
    phone = models.CharField(max_length=15, blank=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.CUSTOMER)

    def __str__(self):
        return self.email or self.username

    @property
    def is_owner(self):
        return self.role == self.Role.OWNER
