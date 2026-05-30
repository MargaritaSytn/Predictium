from pathlib import Path
from datetime import timedelta
import os
import sys
from urllib.parse import urlparse, parse_qs

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

BASE_DIR = Path(__file__).resolve().parent.parent

DEBUG = os.getenv("DEBUG", "True").lower() == "true"

# True when running manage.py test — used to disable throttling in tests
TESTING = len(sys.argv) > 1 and sys.argv[1] == "test"

_secret_key = os.getenv("SECRET_KEY")
if not _secret_key:
    if DEBUG:
        _secret_key = "django-insecure-dev-key-DO-NOT-USE-IN-PRODUCTION"
    else:
        raise ImproperlyConfigured("SECRET_KEY environment variable must be set in production")
SECRET_KEY = _secret_key

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,10.0.2.2").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    # Third-party
    "rest_framework",
    "corsheaders",
    "django_filters",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "allauth.socialaccount.providers.facebook",
    # Local
    "core",
    "accounts",
    "events",
    "predictions",
    "payments",
    "ai_hints",
    "notifications",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "allauth.account.middleware.AccountMiddleware",
]

ROOT_URLCONF = "predictium.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "predictium.wsgi.application"

_database_url = os.getenv("DATABASE_URL")
if _database_url:
    _db = urlparse(_database_url)
    _db_options = {}
    _db_params = parse_qs(_db.query)
    if "sslmode" in _db_params:
        _db_options["sslmode"] = _db_params["sslmode"][0]
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": _db.path.lstrip("/"),
            "USER": _db.username,
            "PASSWORD": _db.password,
            "HOST": _db.hostname,
            "PORT": str(_db.port or 5432),
            "CONN_MAX_AGE": 600,
            "OPTIONS": _db_options,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_USER_MODEL = "core.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedStaticFilesStorage"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

SITE_ID = 1

# CORS
_cors_origins = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173")
CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(",") if o.strip()]

# Production security settings (active when DEBUG=False)
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True

X_FRAME_OPTIONS = "DENY"

# REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 12,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "200/day",
        "user": "2000/day",
        "login": "5/min",
        "register": "3/min",
        "prediction": "30/min",
        "hint": "10/min",
        "withdraw": "3/min",
    },
}

# JWT
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
}

# Allauth
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]
ACCOUNT_LOGIN_METHODS = {"email"}
ACCOUNT_SIGNUP_FIELDS = ["email*", "username*", "password1*", "password2*"]
ACCOUNT_EMAIL_VERIFICATION = "none"

SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "APP": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID", ""),
            "secret": os.getenv("GOOGLE_CLIENT_SECRET", ""),
        },
        "SCOPE": ["profile", "email"],
    },
    "facebook": {
        "APP": {
            "client_id": os.getenv("FACEBOOK_APP_ID", ""),
            "secret": os.getenv("FACEBOOK_APP_SECRET", ""),
        },
        "SCOPE": ["email", "public_profile"],
    },
}

# PayPal
PAYPAL_MODE = os.getenv("PAYPAL_MODE", "sandbox")
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET", "")
PAYPAL_RETURN_URL = os.getenv("PAYPAL_RETURN_URL", "http://localhost:5173/payment/success")
PAYPAL_CANCEL_URL = os.getenv("PAYPAL_CANCEL_URL", "http://localhost:5173/payment/cancel")

# Token economy
TOKEN_PRICE_USD = 0.10
TOKEN_WITHDRAWAL_FEE = 0.03
MIN_WITHDRAWAL_TOKENS = 100
PREMIUM_PRICE_USD = 9.99
PREMIUM_DURATION_DAYS = 30

# Anthropic AI
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
AI_HINT_FREE_LIMIT = int(os.getenv("AI_HINT_FREE_LIMIT", "1"))
AI_HINT_PREMIUM_LIMIT = int(os.getenv("AI_HINT_PREMIUM_LIMIT", "5"))
