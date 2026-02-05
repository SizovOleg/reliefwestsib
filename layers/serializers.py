"""
REST API serializers for geoportal layers.
"""

from rest_framework import serializers
from .gdrive_utils import get_gdrive_images
from .models import MapProject, Layer, LayerAttribute, FeatureContent, FeatureImage, LayerStyle


class LayerAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LayerAttribute
        fields = ['field_name', 'display_name', 'show_in_popup', 'sort_order']


class FeatureImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = FeatureImage
        fields = ['id', 'image_url', 'caption', 'sort_order']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class FeatureContentSerializer(serializers.ModelSerializer):
    gallery = FeatureImageSerializer(many=True, read_only=True)
    main_image_url = serializers.SerializerMethodField()
    layer_title = serializers.CharField(source='layer.title', read_only=True)
    
    class Meta:
        model = FeatureContent
        fields = [
            'id', 'layer', 'layer_title', 'feature_id',
            'title', 'subtitle', 'description',
            'main_image', 'main_image_url', 'image_caption',
            'gallery', 'gdrive_gallery', 'extra_data', 'is_published',
            'created_at', 'updated_at'
        ]
    
    gdrive_gallery = serializers.SerializerMethodField()
    
    def get_gdrive_gallery(self, obj):
        if obj.gdrive_folder_id:
            return get_gdrive_images(obj.gdrive_folder_id)
        return []
    
    def get_main_image_url(self, obj):
        # Приоритет: внешняя ссылка, затем загруженный файл
        if obj.image_url:
            return obj.image_url
        if obj.main_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.main_image.url)
            return obj.main_image.url
        return None


class FeatureContentBriefSerializer(serializers.ModelSerializer):
    """Brief version for listing."""
    main_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = FeatureContent
        fields = ['feature_id', 'title', 'main_image_url']
    
    def get_main_image_url(self, obj):
        # Приоритет: внешняя ссылка, затем загруженный файл
        if obj.image_url:
            return obj.image_url
        if obj.main_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.main_image.url)
            return obj.main_image.url
        return None


class LayerStyleSerializer(serializers.ModelSerializer):
    class Meta:
        model = LayerStyle
        fields = [
            'id', 'attribute_field', 'attribute_value',
            'fill_color', 'stroke_color', 'stroke_width',
            'fill_opacity', 'radius', 'legend_label', 'sort_order'
        ]

class LayerSerializer(serializers.ModelSerializer):
    attributes = LayerAttributeSerializer(many=True, read_only=True)
    layer_type_display = serializers.CharField(
        source='get_layer_type_display', read_only=True
    )
    feature_contents = FeatureContentBriefSerializer(many=True, read_only=True)
    styles = LayerStyleSerializer(many=True, read_only=True)

    class Meta:
        model = Layer
        fields = [
            'id', 'title', 'slug', 'layer_type', 'layer_type_display',
            'geom_type', 'description', 'attribution',
            'preview_image', 'geoserver_layer_name', 'wms_url',
            'default_visible', 'opacity', 'min_zoom', 'max_zoom',
            'sort_order', 'stroke_color', 'stroke_width',
            'fill_color', 'fill_opacity', 'feature_count',
            'bbox_west', 'bbox_south', 'bbox_east', 'bbox_north',
            'attributes', 'feature_contents', 'styles', 'created_at', 'updated_at',
        ]


class LayerBriefSerializer(serializers.ModelSerializer):
    """Short version for project listings."""
    class Meta:
        model = Layer
        fields = [
            'id', 'title', 'slug', 'layer_type', 'geom_type',
            'geoserver_layer_name', 'default_visible', 'opacity',
            'sort_order', 'feature_count',
            'stroke_color', 'stroke_width', 'fill_color', 'fill_opacity',
        ]


class MapProjectSerializer(serializers.ModelSerializer):
    layers = LayerBriefSerializer(many=True, read_only=True)
    layer_count = serializers.SerializerMethodField()

    class Meta:
        model = MapProject
        fields = [
            'id', 'title', 'slug', 'description', 'preview_image', 'center_lat', 'center_lon', 'default_zoom', 'default_basemap',
            'center_lat', 'center_lon', 'default_zoom', 'default_basemap',
            'is_published', 'sort_order', 'layers', 'layer_count',
            'created_at', 'updated_at',
        ]

    def get_layer_count(self, obj):
        return obj.layers.count()


class MapProjectListSerializer(serializers.ModelSerializer):
    """Short version for project list."""
    layer_count = serializers.SerializerMethodField()

    class Meta:
        model = MapProject
        fields = [
            'id', 'title', 'slug', 'description', 'preview_image', 'center_lat', 'center_lon', 'default_zoom', 'default_basemap',
            'is_published', 'layer_count',
        ]

    def get_layer_count(self, obj):
        return obj.layers.count()


