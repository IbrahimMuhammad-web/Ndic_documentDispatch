from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),


    # API Routes
    path("external_emails", views.compose_external, name="external_emails"),
    path("emails", views.compose, name="compose"),
    path("emails/<int:department_id>", views.email, name="email"),
    path("emails/<str:mailbox>", views.mailbox, name="mailbox"),
    path("emails/search/<str:query>", views.search, name="search"),
]
