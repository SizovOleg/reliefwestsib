"""
Celery configuration for geoportal_admin project.
"""

import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'geoportal_admin.settings')

app = Celery('geoportal_admin')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
