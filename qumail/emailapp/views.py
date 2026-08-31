import re
from unicodedata import name
from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone
from requests import request
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from channels.layers import get_channel_layer
import os
from asgiref.sync import async_to_sync
from dotenv import load_dotenv

from .models import AdminNotification, LoginActivity, UserProfile
from .utils import encrypt_message
from .utils import decrypt_message
from .models import OTP
import secrets
import string
import boto3
from django.conf import settings

import re

from rest_framework.decorators import api_view
from rest_framework.response import Response

from django.contrib.auth.models import User

from .models import UserProfile


@api_view(['POST'])
def register(request):

    name = request.data.get('name', '').strip()
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')
    confirm_password = request.data.get('confirm_password', '')
    phone_number = request.data.get('phone_number', '').strip()
    errors = {}
    if not name:
        errors["name"] = "Required"
    else:
        # First check characters
        if not re.fullmatch(r"[A-Za-z ]+", name):
            errors["name"] = (
                "Name must contain only alphabets"
            )
        # Only check length if characters are valid
        elif len(name) > 20:
            errors["name"] = (
                "Name must not exceed 20 characters"
            )
    if not email:
        errors["email"] = "Required"
    elif not email.lower().endswith("@qumail.io"):
        errors["email"] = (
            "Email must end with '@qumail.io'"
        )
    if not phone_number:
        errors["phone_number"] = "Required"
    elif not phone_number.isdigit():
        errors["phone_number"] = (
            "Phone number must contain only digits"
        )
    elif len(phone_number) != 10:
        errors["phone_number"] = (
            "Phone number must contain exactly 10 digits"
        )
    if not password:
        errors["password"] = "Required"
    else:
        password_requirements = {
            "min_length": len(password) >= 8,
            "uppercase": bool(
                re.search(r"[A-Z]", password)
            ),
            "lowercase": bool(
                re.search(r"[a-z]", password)
            ),
            "number": bool(
                re.search(r"[0-9]", password)
            ),
            "special": bool(
                re.search(
                    r'[!@#$%^&*(),.?":{}|<>]',
                    password
                )
            ),
            "no_name_or_email": (
                name.lower() not in password.lower()
                and
                email.lower() not in password.lower()
            )
        }
        if not all(password_requirements.values()):
            errors["password"] = (
                "Password requirements not satisfied"
            )


    # =========================================================
    # CONFIRM PASSWORD
    # =========================================================

    if not confirm_password:

        errors["confirm_password"] = "Required"

    elif password != confirm_password:

        errors["confirm_password"] = (
            "Passwords do not match"
        )


    # =========================================================
    # EMAIL ALREADY EXISTS
    # =========================================================

    if email:

        if User.objects.filter(username=email).exists():

            errors["email"] = (
                "Email already exists. Try another email."
            )


    # =========================================================
    # RETURN ALL ERRORS TOGETHER
    # =========================================================

    if errors:

        response_data = {
            "errors": errors
        }


        # If password was entered, also return
        # individual password requirement status

        if password:

            response_data["password_requirements"] = {

                "min_length":
                    len(password) >= 8,

                "uppercase":
                    bool(re.search(r"[A-Z]", password)),

                "lowercase":
                    bool(re.search(r"[a-z]", password)),

                "number":
                    bool(re.search(r"[0-9]", password)),

                "special":
                    bool(
                        re.search(
                            r'[!@#$%^&*(),.?":{}|<>]',
                            password
                        )
                    ),

                "no_name_or_email":
                    (
                        name.lower() not in password.lower()
                        and
                        email.lower() not in password.lower()
                    )
            }


        return Response(
            response_data,
            status=400
        )


    # =========================================================
    # CREATE USER
    # =========================================================

    user = User.objects.create_user(

        username=email,

        password=password,

        email=email,

        first_name=name
    )


    # =========================================================
    # SAVE PHONE NUMBER
    # =========================================================

    UserProfile.objects.create(

        user=user,

        phone_number=phone_number
    )


    # =========================================================
    # SUCCESS
    # =========================================================

    return Response({

        "message":
            "User registered successfully"

    }, status=201)

from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

@api_view(['POST'])
def login(request):

    # =========================================================
    # GET LOGIN DATA
    # =========================================================

    email = request.data.get(
        'username',
        ''
    ).strip()

    password = request.data.get(
        'password',
        ''
    )

    ip = request.META.get(
        'REMOTE_ADDR',
        ''
    )

    device = request.META.get(
        'HTTP_USER_AGENT',
        'Unknown Device'
    )

    # =========================================================
    # VALIDATION
    # =========================================================

    if not email:

        return Response({
            "errors": {
                "email": "Enter your email"
            }
        }, status=400)

    if not password:

        return Response({
            "errors": {
                "password": "Enter your password"
            }
        }, status=400)

    # =========================================================
    # FIND USER
    # =========================================================

    try:

        user = User.objects.get(
            username=email
        )

    except User.DoesNotExist:

        return Response({
            "error_type": "email",
            "error": "Invalid email ID"
        }, status=401)

    # =========================================================
    # CHECK ACCOUNT STATUS
    # =========================================================

    if not user.is_active:

        return Response({
            "error": "This account has been deleted."
        }, status=403)

    # =========================================================
    # GET USER PROFILE
    # =========================================================

    profile = UserProfile.objects.filter(
        user=user
    ).first()

    # =========================================================
    # CHECK NORMAL ACCOUNT LOCK
    # =========================================================

    if profile and profile.is_locked:

        # -----------------------------------------------------
        # If this is a temporary-password account, we still
        # allow the temporary password to be checked below.
        # -----------------------------------------------------

        if not profile.must_change_password:

            return Response({

                "error_type":
                    "account_locked",

                "error": (
                    "Your account is locked because of "
                    "three failed login attempts. "
                    "Please contact the administrator."
                ),

                "attempts":
                    profile.failed_login_attempts

            }, status=403)

    # =========================================================
    # CHECK PASSWORD
    # =========================================================

    password_correct = user.check_password(
        password
    )

    # =========================================================
    # TEMPORARY PASSWORD FLOW
    # =========================================================

    if (
        password_correct
        and profile
        and profile.must_change_password
    ):

        # -----------------------------------------------------
        # CHECK WHETHER TEMPORARY PASSWORD HAS EXPIRED
        # -----------------------------------------------------

        if (
            not profile.temporary_password_expiry
            or timezone.now() >
            profile.temporary_password_expiry
        ):

            # ================================================
            # EXPIRE TEMPORARY PASSWORD
            # ================================================

            profile.must_change_password = False

            profile.is_locked = True

            profile.temporary_password_expiry = None

            profile.save(
                update_fields=[
                    "must_change_password",
                    "is_locked",
                    "temporary_password_expiry"
                ]
            )

            # ================================================
            # ADMIN NOTIFICATION
            # ================================================

            channel_layer = get_channel_layer()

            async_to_sync(
                channel_layer.group_send
            )(
                "notifications",
                {
                    "type": "send_notification",

                    "message": (
                        "🔒 Temporary Password Expired: "
                        f"Temporary password for user "
                        f"{user.username} has expired. "
                        "Please generate a new temporary password."
                    )
                }
            )

            # ================================================
            # RESPONSE TO USER
            # ================================================

            return Response({

                "error_type":
                    "temporary_password_expired",

                "error": (
                    "Your temporary password has expired. "
                    "Please contact the administrator "
                    "to generate a new temporary password."
                )

            }, status=403)

        # -----------------------------------------------------
        # TEMPORARY PASSWORD IS VALID
        # -----------------------------------------------------

        # IMPORTANT:
        # Do NOT reset must_change_password here.
        #
        # The frontend will receive True and redirect the
        # user to Change Password.

    # =========================================================
    # WRONG PASSWORD
    # =========================================================

    if not password_correct:

        # -----------------------------------------------------
        # RECORD FAILED LOGIN
        # -----------------------------------------------------

        LoginActivity.objects.create(

            user=user,

            ip_address=ip,

            device=device,

            status="FAILED",

            is_active=False
        )

        # -----------------------------------------------------
        # UPDATE FAILED ATTEMPTS
        # -----------------------------------------------------

        if profile:

            profile.failed_login_attempts += 1

            # ================================================
            # THIRD FAILED ATTEMPT
            # ================================================

            if profile.failed_login_attempts >= 3:

                profile.is_locked = True

                profile.save(
                    update_fields=[
                        "failed_login_attempts",
                        "is_locked"
                    ]
                )

                # =========================================================
                # ADMIN NOTIFICATION - TERMINAL TEST OUTPUT
                # =========================================================

                admin_message = (
                    "🔒 Security Alert: "
                    f"User {user.username} has failed login 3 times. "
                    "The account has been locked. "
                    "Please generate a new temporary password."
                )

                AdminNotification.objects.create(
                    user=user,
                    message=admin_message,
                    notification_type="SECURITY"
                )

                print("\n")
                print("==============================================")
                print("          ADMIN SECURITY NOTIFICATION")
                print("==============================================")
                print(admin_message)
                print("==============================================")
                print("\n")

                # =========================================================
                # SEND NOTIFICATION TO ADMIN DASHBOARD
                # =========================================================

                channel_layer = get_channel_layer()

                async_to_sync(
                    channel_layer.group_send
                )(
                    "notifications",
                    {
                        "type": "send_notification",
                        "message": admin_message
                    }
                )

                return Response({

                    "error_type":
                        "account_locked",

                    "error": (
                        "Three failed login attempts. "
                        "Your account has been locked. "
                        "Please contact the administrator."
                    ),

                    "attempts": 3

                }, status=403)

            # ================================================
            # SAVE 1ST / 2ND ATTEMPT
            # ================================================

            profile.save(
                update_fields=[
                    "failed_login_attempts"
                ]
            )

            attempts_remaining = (
                3 -
                profile.failed_login_attempts
            )

        else:

            attempts_remaining = None

        # =====================================================
        # WRONG PASSWORD RESPONSE
        # =====================================================

        response_data = {

            "error_type":
                "password",

            "error":
                "Invalid password"
        }

        if attempts_remaining is not None:

            response_data[
                "attempts_remaining"
            ] = attempts_remaining

        return Response(
            response_data,
            status=401
        )

    # =========================================================
    # SUCCESSFUL LOGIN
    # =========================================================

    if profile:

        # Reset failed attempts

        profile.failed_login_attempts = 0

        profile.save(
            update_fields=[
                "failed_login_attempts"
            ]
        )

    # =========================================================
    # CREATE JWT
    # =========================================================

    refresh = RefreshToken.for_user(
        user
    )

    # =========================================================
    # LOGIN ACTIVITY
    # =========================================================

    LoginActivity.objects.create(

        user=user,

        ip_address=ip,

        device=device,

        status="SUCCESS",

        is_active=True
    )

    # =========================================================
    # LOGIN SMS
    # =========================================================

    if profile:

        try:

            sns_client = boto3.client(

                "sns",

                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )

            sms_response = sns_client.publish(

                PhoneNumber=
                "+91" + profile.phone_number,

                Message=(
                    "QMail Security Alert:\n"
                    "You have successfully logged "
                    "into your account."
                )
            )

            print(
                "LOGIN SMS RESPONSE:",
                sms_response
            )

        except Exception as e:

            print(
                "LOGIN SMS FAILED:",
                str(e)
            )

    # =========================================================
    # FINAL LOGIN RESPONSE
    # =========================================================

    return Response({

        "access":
            str(refresh.access_token),

        "refresh":
            str(refresh),

        "is_admin":
            user.is_staff,

        "must_change_password": (
            profile.must_change_password
            if profile
            else False
        )

    }, status=200)

# =========================================================
# ADMIN - GENERATE TEMPORARY PASSWORD
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_generate_temp_password(request, user_id):

    # =====================================================
    # CHECK ADMIN
    # =====================================================

    if not request.user.is_staff:

        return Response({
            "error": "Admin access required"
        }, status=403)

    # =====================================================
    # GET USER
    # =====================================================

    try:

        user = User.objects.get(
            id=user_id
        )

    except User.DoesNotExist:

        return Response({
            "error": "User not found"
        }, status=404)

    # =====================================================
    # GET USER PROFILE
    # =====================================================

    try:

        profile = UserProfile.objects.get(
            user=user
        )

    except UserProfile.DoesNotExist:

        return Response({
            "error": "User profile not found"
        }, status=404)

    # =====================================================
    # CHECK PHONE NUMBER
    # =====================================================

    if not profile.phone_number:

        return Response({
            "error":
                "User does not have a registered phone number"
        }, status=400)

    # =====================================================
    # GENERATE RANDOM PASSWORD
    # =====================================================

    characters = (
        string.ascii_letters +
        string.digits +
        "!@#$%^&*"
    )

    temporary_password = ''.join(

        secrets.choice(characters)

        for _ in range(12)
    )

    # =====================================================
    # SET PASSWORD
    # =====================================================

    user.set_password(
        temporary_password
    )

    user.save(
        update_fields=[
            "password"
        ]
    )

    # =====================================================
    # SET TEMPORARY PASSWORD STATUS
    # =====================================================

    profile.failed_login_attempts = 0

    profile.is_locked = False

    profile.must_change_password = True

    profile.temporary_password_expiry = (
        timezone.now() +
        timedelta(minutes=5)
    )

    profile.save(
        update_fields=[
            "failed_login_attempts",
            "is_locked",
            "must_change_password",
            "temporary_password_expiry"
        ]
    )

    # =====================================================
    # SMS MESSAGE
    # =====================================================

    sms_message = (

        "QMail Security Alert:\n"

        "Your account was locked due to "
        "multiple failed login attempts.\n\n"

        "Your temporary password is: "
        f"{temporary_password}\n\n"

        "This password is valid for 5 minutes only. "

        "Please login and change your password "
        "immediately.\n\n"

        "- QMail Administrator"
    )

    # =====================================================
    # SEND SMS
    # =====================================================

    try:

        sns_client = boto3.client(

            "sns",

            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )

        sms_response = sns_client.publish(

            PhoneNumber=
            "+91" + profile.phone_number,

            Message=sms_message
        )
        print("\n")
        print("==============================================")
        print("          TEMPORARY PASSWORD SMS")
        print("==============================================")
        print("User:", user.username)
        print("Phone:", profile.phone_number)
        print("Temporary Password:", temporary_password)
        print("Expires In: 5 minutes")
        print("----------------------------------------------")
        print("MESSAGE:")
        print("----------------------------------------------")
        print(sms_message)
        print("----------------------------------------------")
        print("SMS SENT SUCCESSFULLY")
        print("==============================================")
        print("\n")
        # =================================================
        # PRINT TO TERMINAL
        # =================================================

        print(
            "\n========================================"
        )

        print(
            "TEMPORARY PASSWORD SMS"
        )

        print(
            "========================================"
        )

        print(
            "User:",
            user.username
        )

        print(
            "Phone:",
            profile.phone_number
        )

        print(
            "Temporary Password:",
            temporary_password
        )

        print(
            "Expires In: 5 minutes"
        )

        print(
            "----------------------------------------"
        )

        print(
            "MESSAGE:"
        )

        print(
            sms_message
        )

        print(
            "----------------------------------------"
        )

        print(
            "SMS SENT SUCCESSFULLY"
        )

        print(
            "SNS RESPONSE:",
            sms_response
        )

        print(
            "========================================\n"
        )

    except Exception as e:

        # =================================================
        # SMS FAILED
        # =================================================

        print(
            "\n========================================"
        )

        print(
            "TEMPORARY PASSWORD SMS FAILED"
        )

        print(
            "========================================"
        )

        print(
            "User:",
            user.username
        )

        print(
            "Phone:",
            profile.phone_number
        )

        print(
            "Temporary Password:",
            temporary_password
        )

        print(
            "Error:",
            str(e)
        )

        print(
            "========================================\n"
        )

        return Response({

            "error": (
                "Temporary password was generated, "
                "but SMS could not be sent."
            ),

            "details":
                str(e)

        }, status=500)

    # =====================================================
    # SUCCESS RESPONSE
    # =====================================================

    return Response({

        "message":
            "Temporary password generated "
            "and sent successfully",

        "user": {

            "id":
                str(user.id),

            "username":
                user.username,

            "name":
                user.first_name or user.username
        },

        "temporary_password":
            temporary_password,

        "expires_in_minutes":
            5,

        "expires_at":
            profile.temporary_password_expiry.strftime(
                "%d %b %Y, %I:%M %p"
            )

    }, status=200)


from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

from .models import Email, UserProfile

@api_view(['POST'])
@permission_classes([IsAuthenticated])

def send_mail(request):

    sender = request.user

    receiver_emails = request.data.get(
        'receivers'
    )
    if not receiver_emails:
        return Response({

        "error": "Receivers required"

    }, status=400)
    # =========================================================
    # HANDLE SINGLE / MULTIPLE RECEIVERS
    # =========================================================

    if isinstance(receiver_emails, str):

        # Frontend may send:
        # "teju@qumail.io,Deep@qumail.io"

        receiver_emails = [
            email.strip()
            for email in receiver_emails.split(",")
            if email.strip()
        ]

    elif isinstance(receiver_emails, list):

        receiver_emails = [
            email.strip()
            for email in receiver_emails
            if email.strip()
        ]

    else:

        return Response(
            {
                "error": "Invalid receivers format"
            },
            status=400
        )

    # Make sure at least one receiver exists
    if not receiver_emails:

        return Response(
            {
                "error": "Receivers required"
            },
            status=400
        )

    # Store all receivers if needed
    all_receivers = ",".join(
        receiver_emails
    )

    subject = request.data.get('subject')

    message = request.data.get('message')

    attachment = request.FILES.get("attachment")

    

    # ✅ Encrypt Message
    encrypted_data = encrypt_message(message)

    encrypted_attachment_file = None

    # ✅ Encrypt attachment if exists
    if attachment:

        file_data = attachment.read()

        key = bytes.fromhex(
            encrypted_data["key"]
        )

        encrypted_file_data = encrypt_file(
            file_data,
            key
        )

        encrypted_attachment_file = (
            encrypted_file_data
        )

    saved_count = 0

    for receiver_email in receiver_emails:

        try:

            receiver = User.objects.get(
                username=receiver_email
            )

        except User.DoesNotExist:

            continue

        profile = UserProfile.objects.filter(
            user=receiver
        ).first()

        if profile and profile.is_deleted:
            continue

        email = Email.objects.create(

            sender=sender,

            receiver=receiver,

            subject=subject,

            message=message,

            encrypted_message=encrypted_data["encrypted"],

            iv=encrypted_data["iv"],

            auth_tag=encrypted_data["auth_tag"],

            key_id=encrypted_data["key_id"],

            key=encrypted_data["key"]
        )

        if attachment and encrypted_attachment_file:

            email.attachment_iv = (

                encrypted_attachment_file[
                    "iv"
                ].hex()
            )

            email.attachment_auth_tag = (

                encrypted_attachment_file[
                    "tag"
                ].hex()
            )

            email.save()

            encrypted_filename = (
                attachment.name + ".enc"
            )

            email.encrypted_attachment.save(

                encrypted_filename,

                ContentFile(

                    encrypted_attachment_file[
                        "encrypted_file"
                    ]
                )
            )

        saved_count += 1

    if saved_count == 0:

        return Response({

            "error": "No valid receivers found"

        }, status=400)

    channel_layer = get_channel_layer()
    async_to_sync(
    channel_layer.group_send
)(

    "notifications",

    {

        "type": "send_notification",

        "message":

        f"📩 New Secure Mail from {sender.username}"
    }
)

    return Response({

        "message": "Mail saved successfully"
    })

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inbox(request):

    user = request.user

    emails = Email.objects.filter(
        receiver=user,
        is_deleted=False,
        is_draft=False
    ).order_by('-created_at')
    data = []
    for mail in emails:
        data.append({

    "id": str(mail.id),

    "sender": mail.sender.username,

    "subject": mail.subject,

    "preview": mail.message[:50],

    "time": mail.created_at.strftime("%d %b %Y, %I:%M %p"),

    "avatar": mail.sender.username[0].upper(),

    "unread": not mail.is_read,

    "is_starred": mail.is_starred,

    "hasAttachment": bool(mail.encrypted_attachment)
})
    
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def decrypt_mail(request, mail_id):
    try:
        mail = Email.objects.get(
            id=mail_id
        )

        # Allow only sender or receiver to open the mail
        if (
            mail.receiver != request.user
            and mail.sender != request.user
        ):
            return Response({
                "error": "Unauthorized"
            }, status=403)

    except Email.DoesNotExist:
        return Response({
            "error": "Mail not found"
        }, status=404)

    # =========================================================
    # DECRYPT MESSAGE
    # =========================================================

    try:
        decrypted_text = decrypt_message(
            mail.encrypted_message,
            mail.iv,
            mail.auth_tag,
            mail.key
        )

    except Exception as e:
        return Response({
            "error": "Decryption failed",
            "details": str(e)
        }, status=400)

    # =========================================================
    # ATTACHMENT
    # =========================================================

    if mail.receiver == request.user and not mail.is_read:
        mail.is_read = True
        mail.save(update_fields=["is_read"])

    attachment_url = None

    if mail.encrypted_attachment:
        attachment_url = request.build_absolute_uri(
            mail.encrypted_attachment.url
        )

    # =========================================================
    # RETURN MAIL DETAILS
    # =========================================================

    return Response({
        "id": str(mail.id),
        "sender": mail.sender.username,
        "recipient": mail.receiver.username,
        "subject": mail.subject,
        "message": decrypted_text,
        "is_starred": mail.is_starred,
        "attachments": [
            {
                "id": str(mail.id),
                "name": (
                    mail.encrypted_attachment.name
                    .split('/')[-1]
                    .replace('.enc', '')
                ),
                "size": "Secure File",
                "encrypted": True
            }
        ] if mail.encrypted_attachment else [],
        "created_at": mail.created_at.strftime(
            "%d %b %Y, %I:%M %p"
        ),
        "is_read": mail.is_read,
        "username": (
            mail.sender.first_name
            or mail.sender.username
        )
    })



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_attachment(request, mail_id):
    try:
        mail = Email.objects.get(
            id=mail_id,
            receiver=request.user
        )
    except Email.DoesNotExist:
        return Response({
            "error": "Mail not found"
        }, status=404)
    if not mail.encrypted_attachment:
        return Response({
            "error": "No attachment found"
        }, status=404)
    try:
        with open(
            mail.encrypted_attachment.path,
            'rb'
        ) as f:

            encrypted_data = f.read()

        key = bytes.fromhex(mail.key)

        iv = bytes.fromhex(
            mail.attachment_iv
)
        tag = bytes.fromhex(
    mail.attachment_auth_tag
)
        decrypted_data = decrypt_file(

            encrypted_data,

            iv,

            tag,

            key
        )

        response = HttpResponse(

            decrypted_data,

            content_type='application/octet-stream'
        )

        filename = (
            mail.encrypted_attachment.name
            .split('/')[-1]
            .replace('.enc', '')
        )

        response[
            'Content-Disposition'
        ] = f'attachment; filename="{filename}"'

        return response

    except Exception as e:

        return Response({

            "error": "Attachment decryption failed",

            "details": str(e)

        }, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def forward_mail(request):

    mail_id = request.data.get('mail_id')

    #new_receiver_email = request.data.get('receiver')
    receivers = request.data.get("receivers", [])
    if not receivers:
        return Response({
            "error": "At least one recipient is required"
        }, status=400)
    # 🔍 Find original mail
    try:
        original_mail = Email.objects.get(
        Q(id=mail_id) &
        (Q(receiver=request.user) | Q(sender=request.user))
    )
    except Email.DoesNotExist:
        return Response({
        "error": "Mail not found"
    }, status=404)
    forwarded_count = 0
    skipped_users = []
    

    for receiver_email in receivers:
        try:
            new_receiver = User.objects.get(
            username=receiver_email
        )
        except User.DoesNotExist:
            skipped_users.append(receiver_email)
            continue
        encrypted_data = encrypt_message(
        original_mail.message
        )
        Email.objects.create(

            sender=request.user,
            receiver=new_receiver,
        subject="FWD: " + original_mail.subject,
            message=original_mail.message,
            encrypted_message=encrypted_data["encrypted"],
            iv=encrypted_data["iv"],
            auth_tag=encrypted_data["auth_tag"],
            key_id=encrypted_data["key_id"],
            key=encrypted_data["key"],
            # ✅ Forward attachment too
            encrypted_attachment=original_mail.encrypted_attachment,
            attachment_iv=original_mail.attachment_iv,
            attachment_auth_tag=original_mail.attachment_auth_tag,
        )
        forwarded_count += 1
    return Response({
        "message": "Mail forwarded successfully",
        "forwarded_count": forwarded_count,
        "skipped_users": skipped_users
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_mail(request, mail_id):

    try:
        mail = Email.objects.get(id=mail_id)

    except Email.DoesNotExist:
        return Response({
            "error": "Mail not found"
        }, status=404)

    # ==========================================
    # DRAFT → PERMANENT DELETE
    # ==========================================

    if mail.is_draft and mail.sender == request.user:

        mail.delete()

        return Response({
            "message": "Draft deleted permanently"
        }, status=200)

    # ==========================================
    # SENT → MOVE TO TRASH
    # ==========================================

    if mail.sender == request.user:

        mail.is_deleted = True
        mail.deleted_from = "sent"
        mail.save()

        return Response({
            "message": "Mail moved to trash",
            "deleted_from": "sent"
        }, status=200)

    # ==========================================
    # INBOX → MOVE TO TRASH
    # ==========================================

    if mail.receiver == request.user:

        mail.is_deleted = True
        mail.deleted_from = "inbox"
        mail.save()

        return Response({
            "message": "Mail moved to trash",
            "deleted_from": "inbox"
        }, status=200)

    return Response({
        "error": "Unauthorized"
    }, status=403)



@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def edit_mail(request, mail_id):

    try:
        mail = Email.objects.get(
            id=mail_id,
            sender=request.user
        )

    except Email.DoesNotExist:
        return Response({
            "error": "Mail not found"
        }, status=404)

    # Prevent editing after reply
    if mail.is_read:
        return Response({
            "error": "Cannot edit. Receiver already read the mail."
        }, status=400)

    # Get edited data
    new_subject = request.data.get('subject')
    new_message = request.data.get('message')

    if not new_message:
        return Response({
            "error": "Message cannot be empty"
        }, status=400)

    # Re-encrypt edited message
    encrypted_data = encrypt_message(new_message)

    # Update mail
    mail.subject = new_subject
    mail.message = new_message

    mail.encrypted_message = encrypted_data["encrypted"]
    mail.iv = encrypted_data["iv"]
    mail.auth_tag = encrypted_data["auth_tag"]
    mail.key_id = encrypted_data["key_id"]
    mail.key = encrypted_data["key"]

    mail.save()

    return Response({
        "message": "Mail updated successfully"
    }, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_otp(request, mail_id):

    otp = ''.join(
        secrets.choice(string.ascii_lowercase + string.digits)
        for _ in range(6)
    )
    
    OTP.objects.create(

    user=request.user,

    otp=otp

    )
    profile = UserProfile.objects.get(
        user=request.user
    )

    client = boto3.client(

        "sns",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
    )

    response = client.publish(

        PhoneNumber="+91" + profile.phone_number,

        Message=f"Your OTP for QMail is {otp}"
    )

    print("Generated OTP:", otp)
    print(response)

    return Response({
        "message": "OTP sent successfully",
        "otp": otp
    })

from django.utils import timezone
from datetime import timedelta

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_otp(request):

    entered_otp = request.data.get("otp")

    otp_obj = OTP.objects.filter(
        user=request.user,
        otp=entered_otp,
        is_verified=False
    ).last()

    latest_otp = OTP.objects.filter(
    user=request.user
).last()
    if latest_otp.attempts >= 3:
        
        return Response({
        "error": "Too many wrong attempts"
    }, status=400)

    if not otp_obj:
        latest_otp.attempts += 1
        latest_otp.save()
        return Response({
            "error": "Invalid OTP"
        }, status=400)

    # 🔥 OTP Expiry Check
    if timezone.now() > otp_obj.created_at + timedelta(minutes=2):

        return Response({
            "error": "OTP expired"
        }, status=400)

    otp_obj.is_verified = True
    otp_obj.save()

    return Response({
        "message": "OTP verified successfully"
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])

def star_mail(request, mail_id):

    try:

        mail = Email.objects.get(
            id=mail_id,
            receiver=request.user
        )

    except Email.DoesNotExist:

        return Response({
            "error": "Mail not found"
        }, status=404)

    mail.is_starred = not mail.is_starred

    mail.save()

    return Response({

        "message": "Star updated",

        "is_starred": mail.is_starred
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def restore_mail(request, mail_id):

    try:
        mail = Email.objects.get(
            id=mail_id,
            is_deleted=True
        )

    except Email.DoesNotExist:
        return Response({
            "error": "Mail not found in trash"
        }, status=404)

    # ==========================================
    # RESTORE SENT MAIL
    # ==========================================

    if (
        mail.sender == request.user
        and mail.deleted_from == "sent"
    ):

        mail.is_deleted = False
        mail.deleted_from = None
        mail.save()

        return Response({
            "message": "Mail restored successfully",
            "restored_to": "sent"
        })

    # ==========================================
    # RESTORE INBOX MAIL
    # ==========================================

    if (
        mail.receiver == request.user
        and mail.deleted_from == "inbox"
    ):

        mail.is_deleted = False
        mail.deleted_from = None
        mail.save()

        return Response({
            "message": "Mail restored successfully",
            "restored_to": "inbox"
        })

    return Response({
        "error": "Unauthorized"
    }, status=403)
from django.core.files.base import ContentFile

from .utils import (
    encrypt_message,
    decrypt_message,
    encrypt_file,
    decrypt_file
)

from django.db.models import Q

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search_mails(request):

    user = request.user
    keyword = request.GET.get("q", "").strip()

    mails = Email.objects.filter(
        receiver=user,
        is_deleted=False
    )

    if keyword:
        mails = mails.filter(
            Q(sender__username__icontains=keyword) |
            Q(sender__first_name__icontains=keyword) |
            Q(subject__icontains=keyword) |
            Q(message__icontains=keyword)
        )

    data = []

    for mail in mails:
        data.append({
            "id": str(mail.id),
            "sender": mail.sender.username,
            "subject": mail.subject,
            "preview": mail.message[:50],
            "time": mail.created_at.strftime("%d %b %Y, %I:%M %p"),
            "avatar": mail.sender.username[0].upper(),
            "unread": not mail.is_read,
            "is_starred": mail.is_starred,
            "hasAttachment": bool(mail.encrypted_attachment)
        })
    print("Keyword:", keyword)
    print("Matched mails:", mails.count())

    return Response(data)

@api_view(['POST'])
def forgot_password(request):
    email = request.data.get('email')

    try:

        user = User.objects.get(
            username=email
        )

    except User.DoesNotExist:

        return Response({

            "error": "User not found"

        }, status=404)

    profile = UserProfile.objects.get(
        user=user
    )

    otp = ''.join(
        secrets.choice(string.ascii_lowercase + string.digits)
        for _ in range(6)
    )

    OTP.objects.create(

        user=user,

        otp=otp
    )
    sns_client = boto3.client(

    "sns",

    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
)
    response = sns_client.publish(

    PhoneNumber="+91" + profile.phone_number,

    Message=f"QMail Password Reset OTP: {otp}"
)
    print(response)
    print("OTP:", otp)
    return Response({

        "message":
        "OTP sent successfully"
    })

from django.utils import timezone
from datetime import timedelta

@api_view(['POST'])
def verify_forgot_otp(request):

    email = request.data.get("email")

    otp = request.data.get("otp")

    try:

        user = User.objects.get(
            username=email
        )

    except User.DoesNotExist:

        return Response({

            "error": "User not found"

        }, status=404)

    otp_obj = OTP.objects.filter(

        user=user,

        otp=otp

    ).last()

    if not otp_obj:

        return Response({

            "error": "Invalid OTP"

        }, status=400)

    # ✅ OTP Expiry Check
    if timezone.now() > otp_obj.created_at + timedelta(minutes=2):

        return Response({

            "error": "OTP expired"

        }, status=400)

    return Response({

        "message": "OTP verified successfully"
    })



@api_view(['POST'])

def reset_password(request):

    email = request.data.get('email')

    otp = request.data.get('otp')

    new_password = request.data.get(
        'new_password'
    )

    confirm_password = request.data.get(
        'confirm_password'
    )

    if new_password != confirm_password:

        return Response({

            "error":
            "Passwords do not match"

        }, status=400)

    try:

        user = User.objects.get(
            username=email
        )

    except User.DoesNotExist:

        return Response({

            "error": "User not found"

        }, status=404)

    latest_otp = OTP.objects.filter(

        user=user,

        otp=otp

    ).last()

    if not latest_otp:

        return Response({

            "error": "Invalid OTP"

        }, status=400)

    user.set_password(new_password)

    user.save()

    return Response({

        "message":
        "Password reset successful"
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reply_mail(request, mail_id):
    try:
        original_mail = Email.objects.get(
            id=mail_id
        )
    except Email.DoesNotExist:
        return Response({
            "error": "Mail not found"
        }, status=404)
    message = request.data.get(
        'message'
    )
    attachment = request.FILES.get("attachment")
    encrypted_data = encrypt_message(
        message
    )
    encrypted_attachment_file = None
    if attachment:
        file_data = attachment.read()
        key = bytes.fromhex(
        encrypted_data["key"]
    )
        encrypted_attachment_file = encrypt_file(
        file_data,
        key
    )
        
    email = Email.objects.create(

        sender=request.user,

        receiver=original_mail.sender,

        subject="RE: " + original_mail.subject,

        message=message,
        
        encrypted_message= encrypted_data["encrypted"],

        iv=encrypted_data["iv"],

        auth_tag=
        encrypted_data["auth_tag"],

        key_id=
        encrypted_data["key_id"],

        key=encrypted_data["key"],

        is_replied=True
    )
    if attachment and encrypted_attachment_file:
        email.attachment_iv = (
        encrypted_attachment_file["iv"].hex()
    )
        email.attachment_auth_tag = (
        encrypted_attachment_file["tag"].hex()
    )
        email.save()
        encrypted_filename = (
        attachment.name + ".enc"
    )
        email.encrypted_attachment.save(
            encrypted_filename,
            ContentFile(
                encrypted_attachment_file[
                "encrypted_file"
            ]
        )
    )
    return Response({

        "message":
        "Reply sent successfully"
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])

def reply_all(request, mail_id):

    try:

        original_mail = Email.objects.get(
            id=mail_id
        )

    except Email.DoesNotExist:

        return Response({

            "error": "Mail not found"

        }, status=404)

    message = request.data.get(
        'message'
    )

    recipients = original_mail.all_receivers.split(",")

    for email in recipients:

        if email == request.user.username:
            continue

        try:

            receiver = User.objects.get(
                username=email
            )

        except User.DoesNotExist:
            continue

        encrypted_data = encrypt_message(
            message
        )

        Email.objects.create(

            sender=request.user,

            receiver=receiver,

            subject="RE: " +
            original_mail.subject,

            message=message,

            encrypted_message=
            encrypted_data["encrypted"],

            iv=encrypted_data["iv"],

            auth_tag=
            encrypted_data["auth_tag"],

            key_id=
            encrypted_data["key_id"],

            key=encrypted_data["key"],

            is_replied=True,

            all_receivers=
            original_mail.all_receivers
        )

    return Response({

        "message":
        "Reply all sent successfully"
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_draft(request):

    sender = request.user

    receivers = request.data.get("receivers")
    subject = request.data.get("subject")
    message = request.data.get("message")

    receiver_user = User.objects.first()

    if receivers:

        try:
            receiver_user = User.objects.get(
                username=receivers
            )
        except:
            receiver_user = User.objects.first()

    Email.objects.create(

        sender=sender,
        receiver=receiver_user,
        subject=subject or "",
        message=message or "",

        encrypted_message="",
        iv="",
        auth_tag="",
        key_id="",
        key="",

        is_draft=True,
        all_receivers=receivers
    )

    return Response({

        "message": "Draft saved successfully"

    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_drafts(request):

    drafts = Email.objects.filter(
        sender=request.user,
        is_draft=True
    ).order_by("-id")

    data = []

    for mail in drafts:
        data.append({
            "id": str(mail.id),
            "sender": mail.sender.username,
            "receiver": mail.all_receivers or "",
            "subject": mail.subject,
            "message": mail.message,
            "preview": mail.message[:50],
            "time": mail.created_at.strftime("%d %b %Y, %I:%M %p"),
            "avatar": mail.sender.username[0].upper(),
            "unread": False,
            "is_starred": mail.is_starred,
            "hasAttachment": bool(mail.encrypted_attachment),
            "is_draft": True
        })

    return Response(data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_sent_mails(request):
    sent = Email.objects.filter(
        sender=request.user,
        is_draft=False,
        is_deleted=False
    ).exclude(
        receiver=request.user
    ).order_by('-created_at')

    data = []

    for mail in sent:
        data.append({
            "id": str(mail.id),
            "sender": mail.sender.username,
            "recipient": mail.receiver.username,
            "subject": mail.subject,
            "preview": mail.message[:50],
            "time": mail.created_at.strftime(
                "%d %b %Y, %I:%M %p"
            ),
            "avatar": mail.receiver.username[0].upper(),
            "unread": False,
            "is_starred": mail.is_starred,
            "is_read": mail.is_read,
            "hasAttachment": bool(
                mail.encrypted_attachment
            )
        })

    return Response(data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_draft(request, mail_id):

    # =========================================================
    # FIND DRAFT
    # =========================================================

    try:
        draft = Email.objects.get(
            id=mail_id,
            sender=request.user,
            is_draft=True
        )

    except Email.DoesNotExist:
        return Response({
            "error": "Draft not found"
        }, status=404)


    # =========================================================
    # GET RECIPIENTS
    # =========================================================

    receivers = draft.all_receivers

    if not receivers:
        return Response({
            "error": "Recipient email is required"
        }, status=400)

    # Convert comma-separated recipients into list
    receiver_emails = [
        email.strip()
        for email in receivers.split(",")
        if email.strip()
    ]


    if not receiver_emails:
        return Response({
            "error": "Recipient email is required"
        }, status=400)


    # =========================================================
    # CHECK MESSAGE
    # =========================================================

    if not draft.message.strip():

        return Response({
            "error": "Message cannot be empty"
        }, status=400)


    # =========================================================
    # ENCRYPT MESSAGE
    # =========================================================

    encrypted_data = encrypt_message(
        draft.message
    )


    # =========================================================
    # SEND TO EACH RECIPIENT
    # =========================================================

    saved_count = 0

    for receiver_email in receiver_emails:

        try:

            receiver = User.objects.get(
                username=receiver_email
            )

        except User.DoesNotExist:

            continue


        # Skip deleted users
        try:
            profile = UserProfile.objects.get(
                user=receiver
            )

            if profile.is_deleted:
                continue

        except UserProfile.DoesNotExist:
            pass


        # Create actual sent email
        Email.objects.create(

            sender=request.user,

            receiver=receiver,

            subject=draft.subject,

            message=draft.message,

            encrypted_message=
                encrypted_data["encrypted"],

            iv=
                encrypted_data["iv"],

            auth_tag=
                encrypted_data["auth_tag"],

            key_id=
                encrypted_data["key_id"],

            key=
                encrypted_data["key_id"]
                if False else encrypted_data["key"],

            all_receivers=
                draft.all_receivers,

            is_draft=False,

            is_deleted=False
        )


        saved_count += 1


    # =========================================================
    # NO VALID RECIPIENT
    # =========================================================

    if saved_count == 0:

        return Response({
            "error": "No valid recipients found"
        }, status=400)


    # =========================================================
    # DELETE THE OLD DRAFT
    # =========================================================

    draft.delete()


    # =========================================================
    # SUCCESS
    # =========================================================

    return Response({

        "message": "Draft sent successfully",

        "recipients": receiver_emails

    }, status=200)


@api_view(["POST"])
@permission_classes([IsAuthenticated])

def toggle_star(request, mail_id):

    try:

        mail = Email.objects.get(id=mail_id)

        mail.is_starred = not mail.is_starred

        mail.save()

        return Response({

            "message": "Star updated",
            "is_starred": mail.is_starred
        })

    except Email.DoesNotExist:

        return Response({

            "error": "Mail not found"
        }, status=404)
    
@api_view(["GET"])
@permission_classes([IsAuthenticated])

def get_starred_mails(request):

    mails = Email.objects.filter(
        sender=request.user,
        is_starred=True
    ) | Email.objects.filter(
        receiver=request.user,
        is_starred=True
    )

    mails = mails.order_by("-created_at")

    data = []

    for mail in mails:

        data.append({

            "id": str(mail.id),

            "sender": mail.sender.username,

            "subject": mail.subject,

            "preview": mail.message[:50],

            "time": mail.created_at.strftime("%d %b %Y, %I:%M %p"),

            "avatar": mail.sender.username[0].upper(),

            "unread": False,

            "is_starred": mail.is_starred,

            "hasAttachment": bool(mail.encrypted_attachment),

            "is_draft": mail.is_draft
        })

    return Response(data)
from django.db.models import Q

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_trash_mails(request):

    mails = Email.objects.filter(
        is_deleted=True
    ).filter(
        Q(
            sender=request.user,
            deleted_from="sent"
        )
        |
        Q(
            receiver=request.user,
            deleted_from="inbox"
        )
    ).order_by("-created_at")

    data = []

    for mail in mails:

        # Sent mail deleted by current user
        if (
            mail.sender == request.user
            and mail.deleted_from == "sent"
        ):

            display_email = mail.receiver.username
            mail_type = "sent"

        # Received mail deleted by current user
        elif (
            mail.receiver == request.user
            and mail.deleted_from == "inbox"
        ):

            display_email = mail.sender.username
            mail_type = "received"

        else:
            continue

        data.append({

            "id": str(mail.id),

            "sender": mail.sender.username,

            "recipient": mail.receiver.username,

            "displayEmail": display_email,

            "mailType": mail_type,

            "subject": mail.subject,

            "preview": mail.message[:50],

            "time": mail.created_at.strftime(
                "%d %b %Y, %I:%M %p"
            ),

            "avatar": display_email[0].upper(),

            "unread": False,

            "is_starred": mail.is_starred,

            "hasAttachment": bool(
                mail.encrypted_attachment
            )
        })

    return Response(data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_users(request):

    users = User.objects.exclude(id=request.user.id)

    data = []

    for user in users:
        data.append({
            "username": user.username,
            "name": user.first_name or user.username
        })

    return Response(data)

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_phone(request):
    profile = UserProfile.objects.get(user=request.user)

    profile.phone_number = request.data.get("phone")
    profile.save()

    return Response({
        "message": "Phone updated successfully"
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):
    profile = UserProfile.objects.get(user=request.user)

    return Response({
        "username": request.user.first_name ,
        "email": request.user.email,
        "phone": profile.phone_number,
    })

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import LoginActivity

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_user(request):

    activity = (
        LoginActivity.objects.filter(
            user=request.user,
            is_active=True
        )
        .order_by("-login_time")
        .first()
    )

    if activity:
        activity.logout_time = timezone.now()
        activity.is_active = False
        activity.save()

    return Response({
        "message": "Logged out successfully"
    })
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import LoginActivity

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def login_history(request):

    activities = (
        LoginActivity.objects.filter(
            user=request.user
        )
        .order_by("-login_time")
    )[:5]

    data = []

    for item in activities:
        data.append({
            "id": str(item.id),
            "device": item.device,
            "ip_address": item.ip_address,
            "login_time": item.login_time.strftime(
                "%d %b %Y, %I:%M %p"
            ),
            "logout_time": (
                item.logout_time.strftime(
                    "%d %b %Y, %I:%M %p"
                )
                if item.logout_time
                else None
            ),
            "status": (
                item.status
            ),
        })

    return Response(data)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):

    current_password = request.data.get("current_password")
    new_password = request.data.get("new_password")
    confirm_password = request.data.get("confirm_password")

    # =========================================================
    # VALIDATE INPUTS
    # =========================================================

    if not current_password:
        return Response(
            {"error": "Current password is required"},
            status=400
        )

    if not new_password:
        return Response(
            {"error": "New password is required"},
            status=400
        )

    if not confirm_password:
        return Response(
            {"error": "Confirm password is required"},
            status=400
        )

    # =========================================================
    # CHECK CURRENT PASSWORD
    # =========================================================

    if not request.user.check_password(
        current_password
    ):

        return Response(
            {"error": "Current password is incorrect"},
            status=400
        )

    # =========================================================
    # CHECK NEW PASSWORD CONFIRMATION
    # =========================================================

    if new_password != confirm_password:

        return Response(
            {
                "error":
                    "New password and confirm password "
                    "do not match"
            },
            status=400
        )

    # =========================================================
    # PREVENT SAME PASSWORD
    # =========================================================

    if current_password == new_password:

        return Response(
            {
                "error":
                    "New password cannot be the same "
                    "as the current password"
            },
            status=400
        )

    # =========================================================
    # GET USER PROFILE
    # =========================================================

    profile = UserProfile.objects.filter(
        user=request.user
    ).first()

    # =========================================================
    # IF THIS IS A TEMPORARY PASSWORD
    # =========================================================

    if profile and profile.must_change_password:

        # -----------------------------------------------------
        # CHECK TEMPORARY PASSWORD EXPIRY
        # -----------------------------------------------------

        if (
            not profile.temporary_password_expiry
            or timezone.now() >
            profile.temporary_password_expiry
        ):

            # Temporary password has expired

            profile.must_change_password = False

            profile.is_locked = True

            profile.temporary_password_expiry = None

            profile.save(
                update_fields=[
                    "must_change_password",
                    "is_locked",
                    "temporary_password_expiry"
                ]
            )

            # -------------------------------------------------
            # NOTIFY ADMIN
            # -------------------------------------------------

            channel_layer = get_channel_layer()

            async_to_sync(
                channel_layer.group_send
            )(
                "notifications",
                {
                    "type":
                        "send_notification",

                    "message": (
                        "🔒 Temporary Password Expired: "
                        f"Temporary password for user "
                        f"{request.user.username} "
                        "has expired. "
                        "Please generate a new "
                        "temporary password."
                    )
                }
            )

            return Response(
                {
                    "error_type":
                        "temporary_password_expired",

                    "error":
                        "Temporary password has expired. "
                        "Please contact the administrator."
                },
                status=403
            )

    # =========================================================
    # UPDATE PASSWORD
    # =========================================================

    request.user.set_password(
        new_password
    )

    request.user.save(
        update_fields=["password"]
    )

    # =========================================================
    # CLEAR TEMPORARY PASSWORD STATUS
    # =========================================================

    if profile:

        profile.must_change_password = False

        profile.temporary_password_expiry = None

        profile.is_locked = False

        profile.failed_login_attempts = 0

        profile.save(
            update_fields=[
                "must_change_password",
                "temporary_password_expiry",
                "is_locked",
                "failed_login_attempts"
            ]
        )

    # =========================================================
    # RESPONSE
    # =========================================================

    return Response(
        {
            "message":
                "Password changed successfully",

            "must_change_password":
                False
        },
        status=200
    )

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Email, LoginActivity


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Email, LoginActivity


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def activity_statistics(request):

    sent_count = Email.objects.filter(
        sender=request.user,
        is_draft=False
    ).count()

    received_count = Email.objects.filter(
        receiver=request.user,
        is_draft=False
    ).count()

    login_history = LoginActivity.objects.filter(
        user=request.user
    ).order_by("-login_time")[:5]

    history = []

    for login in login_history:
        history.append({
            "id": str(login.id),
            "device": login.device,
            "login_time": login.login_time.strftime(
                "%d %b %Y, %I:%M %p"
            ),
            "status": login.status
        })

    return Response({
        "emails_sent": sent_count,
        "emails_received": received_count,
        "recent_login_history": history
    })

from django.utils import timezone
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

from .models import Email, DeletedEmail, UserProfile

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delete_account(request):

    password = request.data.get("password")

    user = authenticate(
        username=request.user.username,
        password=password
    )

    if not user:
        return Response(
            {"error": "Incorrect password"},
            status=400
        )

    profile = UserProfile.objects.get(user=request.user)

    profile.is_deleted = True
    profile.deleted_at = timezone.now()
    profile.save()

    request.user.is_active = False
    request.user.save()

    emails = Email.objects.filter(
        sender=request.user
    ) | Email.objects.filter(
        receiver=request.user
    )

    for mail in emails:

        DeletedEmail.objects.create(

            original_mail_id=str(mail.id),

            sender=mail.sender.username,

            receiver=mail.receiver.username,

            subject=mail.subject,

            message=mail.message,

            encrypted_message=mail.encrypted_message,

            iv=mail.iv,

            auth_tag=mail.auth_tag,

            key=mail.key,

            key_id=mail.key_id,

            attachment=mail.encrypted_attachment
        )

        mail.delete()

    return Response({
        "message": "Account deleted successfully."
    })

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Email


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mail_counts(request):

    user = request.user

    inbox = Email.objects.filter(
        receiver=user,
        is_deleted=False,
        is_draft=False
    ).count()

    sent = Email.objects.filter(
        sender=user,
        is_draft=False,
        is_deleted=False
    ).count()

    drafts = Email.objects.filter(
        sender=user,
        is_draft=True
    ).count()

    starred = Email.objects.filter(
        receiver=user,
        is_starred=True,
        is_deleted=False
    ).count()

    trash = Email.objects.filter(
        receiver=user,
        is_deleted=True
    ).count()

    return Response({
        "inbox": inbox,
        "sent": sent,
        "drafts": drafts,
        "starred": starred,
        "trash": trash,
    })

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def permanent_delete_mail(request, mail_id):

    try:
        mail = Email.objects.get(
            id=mail_id,
            is_deleted=True
        )
    except Email.DoesNotExist:
        return Response(
            {"error": "Mail not found in trash"},
            status=404
        )

    # Only the user who moved it to Trash can permanently delete it
    if (
        (mail.sender == request.user and mail.deleted_from == "sent")
        or
        (mail.receiver == request.user and mail.deleted_from == "inbox")
    ):
        mail.delete()

        return Response({
            "message": "Mail permanently deleted"
        }, status=200)

    return Response(
        {"error": "Unauthorized"},
        status=403
    )

# =========================================================
# ADMIN - GET ALL EMAILS
# =========================================================

# =========================================================
# ADMIN - GET ADMIN CONVERSATIONS
# =========================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_mails(request):

    # Only staff/admin users can access this API
    if not request.user.is_staff:
        return Response(
            {"error": "Admin access required"},
            status=403
        )

    # =====================================================
    # GET ONLY MAILS BETWEEN ADMIN AND USERS
    # =====================================================

    mails = (
        Email.objects
        .filter(
            Q(sender=request.user) |
            Q(receiver=request.user),
            is_draft=False,
            is_deleted=False
        )
        .select_related(
            "sender",
            "receiver"
        )
        .order_by("created_at")
    )

    # =====================================================
    # RETURN MAIL DATA
    # =====================================================

    data = []

    for mail in mails:

        data.append({

            "id": str(mail.id),

            # Sender
            "sender": mail.sender.username,

            "sender_name": (
                mail.sender.first_name
                or mail.sender.username
            ),

            # Receiver
            "receiver": mail.receiver.username,

            "receiver_name": (
                mail.receiver.first_name
                or mail.receiver.username
            ),

            # Mail
            "subject": mail.subject,

            "message": mail.message,

            "created_at":
                mail.created_at.isoformat(),

            # Status
            "is_replied":
                mail.is_replied,

            "is_read":
                mail.is_read,

            "is_starred":
                mail.is_starred,

            # Attachment
            "hasAttachment":
                bool(mail.encrypted_attachment),

            "attachment": (
                request.build_absolute_uri(
                    mail.encrypted_attachment.url
                )
                if mail.encrypted_attachment
                else None
            ),
        })

    return Response(
        data,
        status=200
    )
# =========================================================
# ADMIN - REPLY TO EMAIL
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_reply(request, mail_id):

    # =====================================================
    # CHECK ADMIN
    # =====================================================

    if not request.user.is_staff:
        return Response(
            {"error": "Admin access required"},
            status=403
        )

    # =====================================================
    # GET ORIGINAL MAIL
    # =====================================================

    try:

        original_mail = Email.objects.get(
            id=str(mail_id),
            is_draft=False,
            is_deleted=False
        )

    except Email.DoesNotExist:

        return Response(
            {"error": "Mail not found"},
            status=404
        )

    # =====================================================
    # GET MESSAGE
    # =====================================================

    message = request.data.get(
        "message",
        ""
    ).strip()

    if not message:

        return Response(
            {
                "error":
                "Reply message cannot be empty"
            },
            status=400
        )

    # =====================================================
    # ADMIN REPLY RECEIVER
    # =====================================================

    # The admin replies to whoever sent the selected mail.
    #
    # Example:
    #
    # User B → Admin
    #
    # Admin → User B
    #
    # If the selected mail was originally sent by admin,
    # reply to its receiver.

    if original_mail.sender == request.user:

        receiver = original_mail.receiver

    else:

        receiver = original_mail.sender

    # =====================================================
    # ENCRYPT MESSAGE
    # =====================================================

    encrypted_data = encrypt_message(
        message
    )

    # =====================================================
    # ATTACHMENT
    # =====================================================

    attachment = request.FILES.get(
        "attachment"
    )

    encrypted_attachment_file = None

    if attachment:

        file_data = attachment.read()

        key = bytes.fromhex(
            encrypted_data["key"]
        )

        encrypted_attachment_file = encrypt_file(
            file_data,
            key
        )

    # =====================================================
    # CREATE REPLY
    # =====================================================

    reply = Email.objects.create(

        sender=request.user,

        receiver=receiver,

        # VERY IMPORTANT:
        # SAME SUBJECT
        subject=original_mail.subject,

        message=message,

        encrypted_message=
            encrypted_data["encrypted"],

        iv=
            encrypted_data["iv"],

        auth_tag=
            encrypted_data["auth_tag"],

        key_id=
            encrypted_data["key_id"],

        key=
            encrypted_data["key"],

        is_deleted=False,

        is_draft=False,

        is_replied=True,

        is_read=False,

        is_starred=False,

        all_receivers=
            original_mail.all_receivers
    )

    # =====================================================
    # SAVE ENCRYPTED ATTACHMENT
    # =====================================================

    if attachment and encrypted_attachment_file:

        reply.attachment_iv = (
            encrypted_attachment_file["iv"].hex()
        )

        reply.attachment_auth_tag = (
            encrypted_attachment_file["tag"].hex()
        )

        reply.save()

        encrypted_filename = (
            attachment.name + ".enc"
        )

        reply.encrypted_attachment.save(

            encrypted_filename,

            ContentFile(
                encrypted_attachment_file[
                    "encrypted_file"
                ]
            )
        )

    # =====================================================
    # MARK ORIGINAL AS REPLIED
    # =====================================================

    original_mail.is_replied = True

    original_mail.save(
        update_fields=["is_replied"]
    )

    # =====================================================
    # RESPONSE
    # =====================================================

    return Response({

        "message":
            "Admin reply sent successfully",

        "mail": {

            "id":
                str(reply.id),

            "sender":
                reply.sender.username,

            "sender_name":
                (
                    reply.sender.first_name
                    or reply.sender.username
                ),

            "receiver":
                reply.receiver.username,

            "receiver_name":
                (
                    reply.receiver.first_name
                    or reply.receiver.username
                ),

            "subject":
                reply.subject,

            "message":
                reply.message,

            # ISO timestamp
            "created_at":
                reply.created_at.isoformat(),

            "is_replied":
                reply.is_replied,

            "hasAttachment":
                bool(
                    reply.encrypted_attachment
                )
        }

    }, status=201)
# =========================================================
# ADMIN - MARK A MAIL AS READ
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_mark_mail_read(request, mail_id):

    # -----------------------------------------------------
    # CHECK ADMIN
    # -----------------------------------------------------

    if not request.user.is_staff:
        return Response(
            {
                "error": "Admin access required"
            },
            status=403
        )

    # -----------------------------------------------------
    # FIND MAIL
    # -----------------------------------------------------

    try:
        mail = Email.objects.get(
            id=mail_id,
            is_draft=False,
            is_deleted=False
        )

    except Email.DoesNotExist:
        return Response(
            {
                "error": "Mail not found"
            },
            status=404
        )

    # -----------------------------------------------------
    # ADMIN MUST BE THE RECEIVER
    # -----------------------------------------------------

    if mail.receiver != request.user:

        return Response(
            {
                "error":
                "This mail was not received by the admin"
            },
            status=403
        )

    # -----------------------------------------------------
    # MARK AS READ
    # -----------------------------------------------------

    mail.is_read = True

    mail.save(
        update_fields=["is_read"]
    )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return Response(
        {
            "message": "Mail marked as read",
            "mail_id": str(mail.id),
            "is_read": True
        },
        status=200
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_users(request):

    # =====================================================
    # CHECK ADMIN
    # =====================================================

    if not request.user.is_staff:
        return Response(
            {
                "error": "Admin access required"
            },
            status=403
        )

    # =====================================================
    # GET ALL REGISTERED USERS
    # =====================================================

    users = User.objects.filter(
        is_staff=False
    ).order_by("id")

    data = []

    for user in users:

        profile = UserProfile.objects.filter(
            user=user
        ).first()

        if profile:

            is_locked = profile.is_locked

            phone_number = (
                profile.phone_number
                or ""
            )

        else:

            is_locked = False
            phone_number = ""

        data.append({

            "id": str(user.id),

            "name": (
                user.first_name
                or user.username
            ),

            "email": user.username,

            "phone": phone_number,

            "is_active": user.is_active,

            "is_locked": is_locked,

            "must_change_password": (
                profile.must_change_password
                if profile
                else False
            ),

            "created_at": (
                user.date_joined.strftime(
                    "%d %b %Y, %I:%M %p"
                )
            )

        })

    return Response(
        data,
        status=200
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_user_activity(request, user_id):

    # =====================================================
    # CHECK ADMIN
    # =====================================================

    if not request.user.is_staff:
        return Response(
            {
                "error": "Admin access required"
            },
            status=403
        )

    # =====================================================
    # GET USER
    # =====================================================

    try:

        user = User.objects.get(
            id=str(user_id)
        )

    except User.DoesNotExist:

        return Response(
            {
                "error": "User not found"
            },
            status=404
        )

    # =====================================================
    # GET LOGIN ACTIVITIES
    # =====================================================

    activities = LoginActivity.objects.filter(
        user=user
    ).order_by("-login_time")[:20]

    data = []

    for activity in activities:

        data.append({

            "id": str(activity.id),

            "ip_address":
                activity.ip_address,

            "device":
                activity.device,

            "login_time":
                activity.login_time.strftime(
                    "%d %b %Y, %I:%M %p"
                ),

            "logout_time":
                (
                    activity.logout_time.strftime(
                        "%d %b %Y, %I:%M %p"
                    )
                    if activity.logout_time
                    else None
                ),

            "is_active":
                activity.is_active,

            "status":
                activity.status

        })

    return Response(
        data,
        status=200
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_unread_notification_count(request):

    if not request.user.is_staff:
        return Response(
            {
                "error": "Admin access required"
            },
            status=403
        )

    count = AdminNotification.objects.filter(
        is_read=False
    ).count()

    return Response(
        {
            "count": count
        },
        status=200
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_notifications(request):

    if not request.user.is_staff:
        return Response(
            {
                "error": "Admin access required"
            },
            status=403
        )

    notifications = AdminNotification.objects.all().order_by(
        "-created_at"
    )

    data = []

    for notification in notifications:

        data.append({

            "id": str(notification.id),

            "user_id": str(notification.user.id),

            "username": notification.user.username,

            "message": notification.message,

            "type": notification.notification_type,

            "is_read": notification.is_read,

            "created_at": notification.created_at.strftime(
                "%d %b %Y, %I:%M %p"
            )

        })

    return Response(
        data,
        status=200
    )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_mark_notification_read(
    request,
    notification_id
):

    if not request.user.is_staff:
        return Response(
            {
                "error": "Admin access required"
            },
            status=403
        )

    try:

        notification = AdminNotification.objects.get(
            id=str(notification_id)
        )

    except AdminNotification.DoesNotExist:

        return Response(
            {
                "error": "Notification not found"
            },
            status=404
        )

    notification.is_read = True

    notification.save(
        update_fields=["is_read"]
    )

    return Response(
        {
            "message": "Notification marked as read"
        },
        status=200
    )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_mark_all_notifications_read(request):

    if not request.user.is_staff:
        return Response(
            {
                "error": "Admin access required"
            },
            status=403
        )

    AdminNotification.objects.filter(
        is_read=False
    ).update(
        is_read=True
    )

    return Response(
        {
            "message": "All notifications marked as read"
        },
        status=200
    )



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def test_sns(request):

    try:
        sns_client = boto3.client(
            "sns",
            region_name=settings.AWS_REGION
        )

        response = sns_client.publish(
            PhoneNumber="+917396252914",
            Message="QMail SNS test successful!"
        )

        return Response({
            "message": "SMS sent successfully",
            "message_id": response.get("MessageId")
        }, status=200)

    except Exception as e:

        return Response({
            "error": "SMS failed",
            "details": str(e)
        }, status=500)