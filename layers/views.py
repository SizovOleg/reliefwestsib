"""
REST API views for geoportal layers.
"""

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import MapProject, Layer, FeatureContent
from .serializers import (
    MapProjectSerializer, MapProjectListSerializer,
    LayerSerializer, FeatureContentSerializer,
)


class MapProjectListView(generics.ListAPIView):
    """GET /api/projects/ — list all published projects."""
    serializer_class = MapProjectListSerializer

    def get_queryset(self):
        return MapProject.objects.filter(is_published=True)


class MapProjectDetailView(generics.RetrieveAPIView):
    """GET /api/projects/<slug>/ — project detail with layers."""
    serializer_class = MapProjectSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return MapProject.objects.filter(is_published=True).prefetch_related('layers')


class LayerListView(generics.ListAPIView):
    """GET /api/layers/ — list all published layers."""
    serializer_class = LayerSerializer

    def get_queryset(self):
        return Layer.objects.filter(is_published=True).prefetch_related('attributes', 'feature_contents')


class LayerDetailView(generics.RetrieveAPIView):
    """GET /api/layers/<slug>/ — layer detail."""
    serializer_class = LayerSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return Layer.objects.filter(is_published=True).prefetch_related('attributes', 'feature_contents')


class FeatureContentView(APIView):
    """
    GET /api/features/<layer_slug>/<feature_id>/ — get rich content for a specific feature.
    """
    def get(self, request, layer_slug, feature_id):
        layer = get_object_or_404(Layer, slug=layer_slug, is_published=True)
        
        try:
            content = FeatureContent.objects.get(
                layer=layer, 
                feature_id=feature_id,
                is_published=True
            )
            serializer = FeatureContentSerializer(content, context={'request': request})
            return Response(serializer.data)
        except FeatureContent.DoesNotExist:
            # Return empty response with 404 - feature has no rich content
            return Response(
                {'detail': 'No content for this feature'},
                status=status.HTTP_404_NOT_FOUND
            )


class LayerFeaturesContentView(generics.ListAPIView):
    """
    GET /api/features/<layer_slug>/ — list all features with content for a layer.
    """
    serializer_class = FeatureContentSerializer

    def get_queryset(self):
        layer_slug = self.kwargs['layer_slug']
        return FeatureContent.objects.filter(
            layer__slug=layer_slug,
            layer__is_published=True,
            is_published=True
        ).select_related('layer').prefetch_related('gallery')
