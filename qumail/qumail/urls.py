"""
URL configuration for qumail project.

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
from django import views
from django.contrib import admin
from django.urls import path
from emailapp.views import admin_mark_mail_read, forgot_password, get_starred_mails, get_users, register, login, reply_all, reset_password, save_draft, search_mails,send_mail,inbox,decrypt_mail, send_otp, toggle_star, verify_forgot_otp 
from emailapp.views import reply_mail,get_drafts,get_sent_mails,get_trash_mails
from emailapp.views import forward_mail,update_phone,profile,change_password,activity_statistics
from emailapp.views import delete_mail, restore_mail,delete_account,permanent_delete_mail
from emailapp.views import edit_mail,logout_user, login_history
from emailapp.views import verify_otp,mail_counts,send_draft,admin_generate_temp_password,admin_user_activity
from emailapp.views import star_mail,admin_users,admin_unread_notification_count,admin_notifications,admin_mark_notification_read
from django.conf import settings
from django.conf.urls.static import static
from emailapp.views import download_attachment,admin_generate_temp_password,admin_mark_all_notifications_read
from emailapp.views import admin_mails, admin_reply
from emailapp import views
urlpatterns = [
    path('admin/', admin.site.urls),
    path('register/', register),
    path('login/', login),
    path('sendMail/', send_mail),
    path('inbox/', inbox),
    path('decrypt-mail/<str:mail_id>/', decrypt_mail),
    path('reply/', reply_mail),
    path('forward/', forward_mail),
    path('delete-mail/<str:mail_id>/', delete_mail),
    path('trash-mail/', get_trash_mails),
    path('edit/<str:mail_id>/', edit_mail),
    path('send-otp/<str:mail_id>/', send_otp),
    path('verify-otp/', verify_otp),
    path('star-mail/<str:mail_id>/', star_mail),
    path('restore-mail/<str:mail_id>/', restore_mail),
    path(
    'download-attachment/<str:mail_id>/',download_attachment
),
path(
    'search-mails/',
    search_mails
),
path(
    'forgot-password/',
    forgot_password
),

path(
    'reset-password/',
    reset_password
),
path(
    'reply-mail/<str:mail_id>/',
    reply_mail
),

path(
    'reply-all/<str:mail_id>/',
    reply_all
),
path(
    'verify-forgot-otp/',verify_forgot_otp
),
path(
    "saveDraft/",
    save_draft
),
path("drafts/", get_drafts),
path("sent/", get_sent_mails),
path("toggle-star/<str:mail_id>/", toggle_star),
path("starred/", get_starred_mails),
path("users/", get_users),
path("update-phone/", update_phone),
path("profile/", profile),
path("logout/", logout_user),
path("login-history/", login_history),
path("change-password/", change_password),
path("activity-statistics/", activity_statistics),
path("delete-account/", delete_account),
path("mail-counts/", mail_counts),
path(
    "send-draft/<str:mail_id>/",send_draft
),
path(
    "delete-permanently/<str:mail_id>/",
    permanent_delete_mail
),
path(
    "adminmails/",
    admin_mails
),

path(
    "adminreply/<str:mail_id>/",
    admin_reply
),
path(
    "adminmarkread/<str:mail_id>/",
    admin_mark_mail_read
),
path(
    "admingenerate-temp-password/<str:user_id>/",
    admin_generate_temp_password
),
path(
    "adminuser-activity/<str:user_id>/",
    admin_user_activity
),
path(
    "adminusers/",admin_users
),
path(
    "admin-notifications/unread-count/",
    admin_unread_notification_count
),

path(
    "admin-notifications/",
    admin_notifications
),

path(
    "admin-notifications/<str:notification_id>/read/",
    admin_mark_notification_read
),
path(
    "admin-notifications/mark-all-read/",
    admin_mark_all_notifications_read
),
path(
    "test-sns/",
    views.test_sns,
    name="test_sns"
),
]
urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT
)