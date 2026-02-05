from django.urls import path, re_path
from . import views

urlpatterns = [
    path('', views.home_view, name='home'),
    path('page-editor/<int:page_id>/', views.page_editor, name='page_editor'),
    path('api/pages/<int:page_id>/save/', views.page_save, name='page_save'),
    path('api/pages/', views.pages_api, name='pages_api'),
    re_path(r'^p/(?P<slug>[\w-]+)/$', views.page_view, name='page_view'),
]
