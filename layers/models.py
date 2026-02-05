"""
Models for the geoportal layers app.
"""

import os
import uuid
from django.contrib.gis.db import models as gis_models
from django.db import models


def layer_upload_path(instance, filename):
    """Upload path for layer source files."""
    ext = os.path.splitext(filename)[1]
    return f'layers/sources/{instance.slug}/{uuid.uuid4().hex[:8]}{ext}'


def preview_upload_path(instance, filename):
    """Upload path for layer preview images."""
    ext = os.path.splitext(filename)[1]
    return f'layers/previews/{instance.slug}{ext}'


def raster_upload_path(instance, filename):
    """Upload path for raster files (GeoTIFF)."""
    ext = os.path.splitext(filename)[1]
    return f'layers/rasters/{instance.slug}/{uuid.uuid4().hex[:8]}{ext}'


def feature_image_path(instance, filename):
    """Upload path for feature content images."""
    ext = os.path.splitext(filename)[1]
    return f'features/{instance.feature_content.layer.slug}/{instance.feature_content.feature_id}/{uuid.uuid4().hex[:8]}{ext}' if hasattr(instance, 'feature_content') else f'features/{instance.layer.slug}/{instance.feature_id}/{uuid.uuid4().hex[:8]}{ext}'


class MapProject(models.Model):
    """
    A thematic map project grouping multiple layers.
    E.g., "Оледенения Западной Сибири", "Морфология речных долин".
    """
    title = models.CharField('Название', max_length=300)
    slug = models.SlugField('Slug', max_length=100, unique=True)
    description = models.TextField('Описание', blank=True)
    preview_image = models.ImageField(
        'Превью', upload_to='projects/previews/', blank=True, null=True
    )
    # Map center and zoom
    center_lat = models.FloatField('Центр (широта)', default=64.0)
    center_lon = models.FloatField('Центр (долгота)', default=69.0)
    default_zoom = models.IntegerField('Зум по умолчанию', default=6)
    # Basemap
    BASEMAP_CHOICES = [
        ('osm', 'OpenStreetMap'),
        ('topo', 'OpenTopoMap'),
        ('satellite', 'Esri Satellite'),
        ('dark', 'CartoDB Dark'),
    ]
    default_basemap = models.CharField(
        'Базовая карта', max_length=20,
        choices=BASEMAP_CHOICES, default='osm'
    )
    is_published = models.BooleanField('Опубликован', default=False)
    sort_order = models.IntegerField('Порядок сортировки', default=0)
    created_at = models.DateTimeField('Создан', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлён', auto_now=True)

    class Meta:
        verbose_name = 'Картографический проект'
        verbose_name_plural = 'Картографические проекты'
        ordering = ['sort_order', 'title']

    def __str__(self):
        return self.title


class Layer(models.Model):
    """
    A single geospatial layer (vector or raster).
    """
    LAYER_TYPE_CHOICES = [
        ('vector', 'Векторный'),
        ('raster', 'Растровый'),
    ]
    GEOM_TYPE_CHOICES = [
        ('point', 'Точки'),
        ('line', 'Линии'),
        ('polygon', 'Полигоны'),
        ('multi', 'Смешанный'),
    ]

    title = models.CharField('Название', max_length=300)
    slug = models.SlugField('Slug', max_length=100, unique=True)
    layer_type = models.CharField(
        'Тип слоя', max_length=10, choices=LAYER_TYPE_CHOICES, default='vector'
    )
    geom_type = models.CharField(
        'Тип геометрии', max_length=10,
        choices=GEOM_TYPE_CHOICES, default='line', blank=True
    )
    description = models.TextField('Описание', blank=True)
    attribution = models.CharField('Источник данных', max_length=500, blank=True)
    preview_image = models.ImageField(
        'Превью', upload_to=preview_upload_path, blank=True, null=True
    )

    # GeoServer reference
    geoserver_layer_name = models.CharField(
        'Имя слоя в GeoServer', max_length=200, blank=True,
        help_text='workspace:layer_name, e.g. geoportal:Морены'
    )
    postgis_table = models.CharField(
        'Таблица в PostGIS', max_length=200, blank=True,
        help_text='Имя таблицы в БД'
    )

    # Source files (for re-import)
    source_file = models.FileField(
        'Исходный файл', upload_to=layer_upload_path,
        blank=True, null=True,
        help_text='Shapefile (.zip), GeoJSON, GeoTIFF'
    )
    raster_file = models.FileField(
        'Растровый файл', upload_to=raster_upload_path,
        blank=True, null=True,
        help_text='GeoTIFF для растровых слоёв'
    )

    # Display settings
    default_visible = models.BooleanField('Включён по умолчанию', default=True)
    opacity = models.FloatField('Прозрачность', default=1.0)
    min_zoom = models.IntegerField('Мин. зум', default=0)
    max_zoom = models.IntegerField('Макс. зум', default=18)
    sort_order = models.IntegerField('Порядок сортировки', default=0)

    # Style (SLD)
    sld_style = models.TextField(
        'SLD стиль', blank=True,
        help_text='XML-содержимое SLD стиля'
    )
    # Quick style settings (used if SLD is empty)
    stroke_color = models.CharField('Цвет линии', max_length=7, default='#3388ff')
    stroke_width = models.FloatField('Толщина линии', default=2.0)
    fill_color = models.CharField('Цвет заливки', max_length=7, default='#3388ff')
    fill_opacity = models.FloatField('Прозрачность заливки', default=0.3)

    # Feature count (auto-calculated)
    feature_count = models.IntegerField('Количество объектов', default=0)

    # Bounding box (auto-calculated)
    bbox_west = models.FloatField('Bbox West', null=True, blank=True)
    bbox_south = models.FloatField('Bbox South', null=True, blank=True)
    bbox_east = models.FloatField('Bbox East', null=True, blank=True)
    bbox_north = models.FloatField('Bbox North', null=True, blank=True)

    # Projects (M2M)
    projects = models.ManyToManyField(
        MapProject, verbose_name='Проекты',
        related_name='layers', blank=True
    )

    is_published = models.BooleanField('Опубликован', default=False)
    created_at = models.DateTimeField('Создан', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлён', auto_now=True)

    class Meta:
        verbose_name = 'Слой'
        verbose_name_plural = 'Слои'
        ordering = ['sort_order', 'title']

    def __str__(self):
        return f'{self.title} ({self.get_layer_type_display()})'

    @property
    def wms_url(self):
        """WMS URL for this layer."""
        if self.geoserver_layer_name:
            return f'/geoserver/wms'
        return ''


class LayerAttribute(models.Model):
    """
    Metadata about layer attributes/fields for display in popups.
    """
    layer = models.ForeignKey(
        Layer, on_delete=models.CASCADE,
        related_name='attributes', verbose_name='Слой'
    )
    field_name = models.CharField('Имя поля', max_length=100)
    display_name = models.CharField('Отображаемое имя', max_length=200)
    show_in_popup = models.BooleanField('Показывать в попапе', default=True)
    sort_order = models.IntegerField('Порядок', default=0)

    class Meta:
        verbose_name = 'Атрибут слоя'
        verbose_name_plural = 'Атрибуты слоёв'
        ordering = ['sort_order']
        unique_together = ['layer', 'field_name']

    def __str__(self):
        return f'{self.layer.title}: {self.field_name}'


class FeatureContent(models.Model):
    """
    Rich content for individual map features.
    Allows adding descriptions, photos, and formatted text to specific objects.
    """
    layer = models.ForeignKey(
        Layer, on_delete=models.CASCADE,
        related_name='feature_contents', verbose_name='Слой'
    )
    feature_id = models.IntegerField(
        'ID объекта (gid)',
        help_text='gid объекта из таблицы PostGIS'
    )
    
    # Content
    title = models.CharField('Заголовок', max_length=300, blank=True,
        help_text='Если пусто — используется название из атрибутов')
    subtitle = models.CharField('Подзаголовок', max_length=500, blank=True)
    description = models.TextField('Описание', blank=True, 
        help_text='Поддерживает HTML-форматирование')
    
    # Main image
    main_image = models.ImageField(
        'Главное изображение', upload_to=feature_image_path,
        blank=True, null=True
    )
    image_url = models.URLField(
        'Ссылка на изображение', max_length=500, blank=True,
        help_text='Внешняя ссылка (Яндекс.Диск, Google Drive и др.). Используется если файл не загружен.'
    )
    gdrive_folder_id = models.CharField(
        'ID папки Google Drive', max_length=100, blank=True,
        help_text='ID публичной папки с фото для галереи. Пример: 1aBcDeFgHiJkLmNoPqRsTuVwXyZ'
    )
    image_caption = models.CharField('Подпись к изображению', max_length=500, blank=True)
    
    # Additional data (JSON for flexibility)
    extra_data = models.JSONField('Дополнительные данные', default=dict, blank=True,
        help_text='JSON с дополнительными полями')
    
    # Meta
    is_published = models.BooleanField('Опубликован', default=True)
    created_at = models.DateTimeField('Создан', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлён', auto_now=True)

    class Meta:
        verbose_name = 'Контент объекта'
        verbose_name_plural = 'Контент объектов'
        unique_together = ['layer', 'feature_id']
        ordering = ['layer', 'feature_id']

    def __str__(self):
        return f'{self.layer.title} — объект #{self.feature_id}'


class FeatureImage(models.Model):
    """
    Additional images for a feature (gallery).
    """
    feature_content = models.ForeignKey(
        FeatureContent, on_delete=models.CASCADE,
        related_name='gallery', verbose_name='Контент объекта'
    )
    image = models.ImageField('Изображение', upload_to=feature_image_path)
    caption = models.CharField('Подпись', max_length=500, blank=True)
    sort_order = models.IntegerField('Порядок', default=0)

    class Meta:
        verbose_name = 'Изображение галереи'
        verbose_name_plural = 'Изображения галереи'
        ordering = ['sort_order']

    def __str__(self):
        return f'Изображение для {self.feature_content}'


class LayerStyle(models.Model):
    """
    Style rules for layer visualization.
    """
    layer = models.ForeignKey(
        Layer, on_delete=models.CASCADE,
        related_name='styles', verbose_name='Слой'
    )
    attribute_field = models.CharField(
        'Поле для классификации', max_length=100,
        help_text='Имя поля из атрибутов (например: mis, age_type)'
    )
    attribute_value = models.CharField(
        'Значение', max_length=200,
        help_text='Значение поля для этого стиля'
    )
    # Style settings
    fill_color = models.CharField('Цвет заливки', max_length=7, default='#3388ff')
    stroke_color = models.CharField('Цвет обводки', max_length=7, default='#ffffff')
    stroke_width = models.FloatField('Толщина обводки', default=2.0)
    fill_opacity = models.FloatField('Прозрачность заливки', default=0.8)
    radius = models.IntegerField('Радиус (для точек)', default=8)
    # Legend
    legend_label = models.CharField(
        'Подпись в легенде', max_length=200, blank=True,
        help_text='Если пусто — используется значение атрибута'
    )
    sort_order = models.IntegerField('Порядок в легенде', default=0)

    class Meta:
        verbose_name = 'Стиль слоя'
        verbose_name_plural = 'Стили слоёв'
        ordering = ['layer', 'sort_order']
        unique_together = ['layer', 'attribute_field', 'attribute_value']

    def __str__(self):
        return f'{self.layer.title}: {self.attribute_field}={self.attribute_value}'
