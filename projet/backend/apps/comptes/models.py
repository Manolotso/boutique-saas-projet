import random
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models


class CustomUserManager(UserManager):
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("role", CustomUser.Role.SUPERADMIN)
        return super().create_superuser(username, email, password, **extra_fields)


class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        CLIENT = "client", "Client"
        COMMERCANT = "commercant", "Commerçant"
        SUPERADMIN = "superadmin", "Super administrateur"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CLIENT)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return f"{self.username} ({self.role})"


    

class CodeVerification(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    role = models.CharField(max_length=20, choices=CustomUser.Role.choices)
    date_creation = models.DateTimeField(auto_now_add=True)
    est_verifie = models.BooleanField(default=False)

    def est_expire(self):
        return timezone.now() > self.date_creation + timedelta(minutes=15)

    @staticmethod
    def generer_code():
        return str(random.randint(100000, 999999))

    def __str__(self):
        return f"{self.email} - {self.code}"