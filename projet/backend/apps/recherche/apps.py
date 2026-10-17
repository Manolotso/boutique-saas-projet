from django.apps import AppConfig


class RechercheConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.recherche"

    def ready(self):
        from . import signaux  # noqa: F401