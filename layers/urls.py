"""
URL routing for layers API.
"""

from django.urls import path
from . import views

urlpatterns = [
    path('projects/', views.MapProjectListView.as_view(), name='project-list'),
    path('projects/<slug:slug>/', views.MapProjectDetailView.as_view(), name='project-detail'),
    path('layers/', views.LayerListView.as_view(), name='layer-list'),
    path('layers/<slug:slug>/', views.LayerDetailView.as_view(), name='layer-detail'),
    path('features/<slug:layer_slug>/', views.LayerFeaturesContentView.as_view(), name='layer-features'),
    path('features/<slug:layer_slug>/<int:feature_id>/', views.FeatureContentView.as_view(), name='feature-content'),
]
