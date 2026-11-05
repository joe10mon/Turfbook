from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="first_name", allow_blank=True, required=False)

    class Meta:
        model = User
        fields = ["id", "name", "email", "phone", "role"]
        read_only_fields = ["id", "email", "role"]


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=80)
    email = serializers.EmailField()
    phone = serializers.RegexField(r"^[0-9]{10}$", required=False, allow_blank=True,
                                   error_messages={"invalid": "Enter a 10-digit mobile number."})
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=[User.Role.CUSTOMER, User.Role.OWNER], default=User.Role.CUSTOMER)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, data):
        return User.objects.create_user(
            username=data["email"],
            email=data["email"],
            password=data["password"],
            first_name=data["name"],
            phone=data.get("phone", ""),
            role=data["role"],
        )
