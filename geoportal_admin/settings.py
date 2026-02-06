"""
Django settings for geoportal_admin project.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-CHANGE-ME-TO-RANDOM-STRING-IN-PRODUCTION'

DEBUG = True

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    # Wagtail
    'wagtail.contrib.forms',
    'wagtail.contrib.redirects',
    'wagtail.embeds',
    'wagtail.sites',
    'wagtail.users',
    'wagtail.snippets',
    'wagtail.documents',
    'wagtail.images',
    'wagtail.search',
    'wagtail.admin',
    'wagtail',
    'modelcluster',
    'taggit',
   
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.postgres',
    'django.contrib.gis',
    'rest_framework',
    'corsheaders',
    'layers',
    'stories',
    'home',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'geoportal_admin.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'geoportal_admin.wsgi.application'

# --- Database ---
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'geoportal',
        'USER': 'geouser',
        'PASSWORD': 'ChangeMe2026',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Europe/Moscow'
USE_I18N = True
USE_TZ = True

# --- Static & Media ---
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- CORS ---
CORS_ALLOW_ALL_ORIGINS = True

# --- REST Framework ---
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}

# --- GeoServer ---
GEOSERVER_URL = 'http://localhost:8080/geoserver'
GEOSERVER_USER = 'admin'
GEOSERVER_PASSWORD = 'geoserver'  # CHANGE if you updated it
GEOSERVER_WORKSPACE = 'geoportal'

# --- Celery ---
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Europe/Moscow'

# --- Upload settings ---
FILE_UPLOAD_MAX_MEMORY_SIZE = 104857600   # 100 MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 104857600

# --- Layer import settings ---
LAYER_UPLOAD_DIR = os.path.join(MEDIA_ROOT, 'layers',
    'stories',
    'home', 'uploads')
RASTER_STORAGE_DIR = os.path.join(MEDIA_ROOT, 'layers',
    'stories',
    'home', 'rasters')

# --- CKEditor 5 ---
INSTALLED_APPS += ['django_ckeditor_5']

CKEDITOR_5_CONFIGS = {
    'default': {
        'toolbar': [
            'heading', '|',
            'bold', 'italic', 'underline', '|',
            'bulletedList', 'numberedList', '|',
            'link', 'blockQuote', '|',
            'imageUpload', 'insertTable', '|',
            'undo', 'redo'
        ],
        'height': 400,
    },
    'extends': {
        'toolbar': [
            'heading', '|',
            'bold', 'italic', 'underline', 'strikethrough', '|',
            'fontSize', 'fontColor', '|',
            'bulletedList', 'numberedList', 'todoList', '|',
            'outdent', 'indent', 'alignment', '|',
            'link', 'blockQuote', 'insertTable', '|',
            'imageUpload', 'mediaEmbed', '|',
            'horizontalLine', 'specialCharacters', '|',
            'sourceEditing', '|',
            'undo', 'redo'
        ],
        'height': 500,
        'image': {
            'toolbar': ['imageTextAlternative', 'imageStyle:full', 'imageStyle:side']
        },
        'table': {
            'contentToolbar': ['tableColumn', 'tableRow', 'mergeTableCells']
        },
    }
}

CKEDITOR_5_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
CKEDITOR_5_UPLOAD_PATH = 'ckeditor/'
GOOGLE_API_KEY = 'AIzaSyA21fBglLKQQfQnKAZCvwaGP3McL7eyiWE'
CSRF_TRUSTED_ORIGINS = ['https://reliefwestsib.ru', 'https://www.reliefwestsib.ru']


# Wagtail settings
WAGTAIL_SITE_NAME = 'Relief West Siberia'
WAGTAILADMIN_BASE_URL = 'https://reliefwestsib.ru'
WAGTAIL_I18N_ENABLED = True
WAGTAIL_CONTENT_LANGUAGES = [
    ('ru', 'Russian'),
]

# Templates
TEMPLATES[0]['DIRS'] = [BASE_DIR / 'home' / 'templates']
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
