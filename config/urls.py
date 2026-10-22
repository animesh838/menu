from django.urls import include, path
from django.views.generic import TemplateView

urlpatterns = [
    path("", TemplateView.as_view(template_name="index.html"), name="menu"),
    path("kitchen.html", TemplateView.as_view(template_name="kitchen.html"), name="kitchen"),
    path("api/", include("orders.urls")),
]
