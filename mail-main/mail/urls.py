from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("admin_dashboard_<str:username>", views.admin_dashboard, name="admin_dashboard"),
    path("user_page_<str:username>", views.admin_userPage, name="admin_userPage"),
    path("internal_mails_<str:username>", views.admin_intmailsPage, name="admin_intmailsPage"),
    path("external_mails_<str:username>", views.admin_ExmailsPage, name="admin_ExmailsPage"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    # path("register", views.register, name="register"),



    # API Routes
    path("external_emails", views.compose_external, name="external_emails"),
    path("emails", views.compose, name="compose"),
    path("emails/<int:department_id>", views.email, name="email"),
    path("emails/<str:mailbox>", views.mailbox, name="mailbox"),
    path("emails/search/<str:query>", views.search, name="search"),
]
