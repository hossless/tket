"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from core import views
from django.urls import path
from django.contrib import admin

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('api/auth/login/', views.login),
    path('api/auth/signup/request/', views.request_signup_otp),
    path('api/auth/signup/verify/', views.verify_signup_otp),
    
    path('api/user/profile/', views.update_user_profile),
    path('api/user/reservations/', views.get_user_bookings),
    path('api/user/reservations/cancel/', views.cancel_ticket_and_refund),
    path('api/user/reports/', views.report_ticket_issue),
    
    path('api/tickets/cities-venues/', views.get_cities_and_venues_list),
    path('api/tickets/search/', views.search_tickets),
    path('api/tickets/<int:ticket_id>/', views.get_ticket_details),
    
    path('api/tickets/reserve/', views.reserve_ticket),
    path('api/tickets/pay/', views.payment_for_ticket),
    path('api/tickets/reservations/<int:reservation_id>/penalty/', views.check_cancellation_penalty),
    
    path('api/admin/manage/', views.admin_ticket_management),
]