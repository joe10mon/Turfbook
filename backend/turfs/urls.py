from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import ContactView, FavoritesView, MetaView, TurfViewSet, UploadView

router = SimpleRouter()
router.register("turfs", TurfViewSet, basename="turf")

urlpatterns = [
    path("meta/", MetaView.as_view()),
    path("favorites/", FavoritesView.as_view()),
    path("contact/", ContactView.as_view()),
    path("uploads/", UploadView.as_view()),
    path("", include(router.urls)),
]
