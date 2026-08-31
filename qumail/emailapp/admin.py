from django.contrib import admin

from .models import (
    DeletedEmail,
    Email,
    UserProfile,
    OTP,
    LoginActivity
)

admin.site.register(Email)

admin.site.register(UserProfile)

admin.site.register(OTP)

admin.site.register(LoginActivity)

admin.site.register(DeletedEmail)