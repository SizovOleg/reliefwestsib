"""
from .admin_forms import LayerStyleForm
Admin configuration for geoportal layers.
"""

from django.contrib import admin
from django.contrib import messages
from django.utils.html import format_html
from django import forms
from django_ckeditor_5.widgets import CKEditor5Widget
from .models import MapProject, Layer, LayerAttribute, FeatureContent, FeatureImage, LayerStyle


class LayerAttributeInline(admin.TabularInline):
    model = LayerAttribute
    extra = 0
    fields = ('field_name', 'display_name', 'show_in_popup', 'sort_order')


class LayerInline(admin.TabularInline):
    model = Layer.projects.through
    extra = 0
    verbose_name = 'Слой'
    verbose_name_plural = 'Слои проекта'


class FeatureImageInline(admin.TabularInline):
    model = FeatureImage
    extra = 1
    fields = ('image', 'caption', 'sort_order')


class FeatureContentAdminForm(forms.ModelForm):
    description = forms.CharField(
        widget=CKEditor5Widget(config_name='extends'),
        required=False,
        label='Описание'
    )
    
    class Meta:
        model = FeatureContent
        fields = '__all__'


@admin.register(MapProject)
class MapProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'is_published', 'layer_count', 'sort_order')
    list_editable = ('is_published', 'sort_order')
    list_filter = ('is_published',)
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [LayerInline]

    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'description', 'preview_image', 'is_published')
        }),
        ('Параметры карты', {
            'fields': ('center_lat', 'center_lon', 'default_zoom', 'default_basemap'),
        }),
        ('Сортировка', {
            'fields': ('sort_order',),
        }),
    )

    def layer_count(self, obj):
        return obj.layers.count()
    layer_count.short_description = 'Слоёв'


@admin.register(Layer)
class LayerAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'layer_type', 'geom_type', 'geoserver_layer_name',
        'feature_count', 'content_count', 'import_status_badge', 'is_published', 'sort_order'
    )
    list_editable = ('is_published', 'sort_order')
    list_filter = ('layer_type', 'geom_type', 'is_published', 'projects')
    search_fields = ('title', 'description', 'geoserver_layer_name')
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ('projects',)
    inlines = [LayerAttributeInline]
    actions = ['import_selected_layers', 'delete_layer_data']

    fieldsets = (
        (None, {
            'fields': (
                'title', 'slug', 'layer_type', 'geom_type',
                'description', 'attribution', 'preview_image'
            )
        }),
        ('GeoServer / PostGIS', {
            'fields': ('geoserver_layer_name', 'postgis_table'),
            'description': 'Заполняется автоматически после импорта.'
        }),
        ('Загрузка данных', {
            'fields': ('source_file', 'raster_file'),
            'description': 'Загрузите shapefile (.zip) или GeoJSON.'
        }),
        ('Отображение', {
            'fields': (
                'default_visible', 'opacity', 'min_zoom', 'max_zoom',
                'sort_order', 'projects'
            ),
        }),
        ('Стиль', {
            'fields': ('stroke_color', 'stroke_width', 'fill_color', 'fill_opacity'),
            'classes': ('collapse',),
        }),
        ('SLD стиль (XML)', {
            'fields': ('sld_style',),
            'classes': ('collapse',),
        }),
        ('Статистика', {
            'fields': ('feature_count', 'bbox_west', 'bbox_south', 'bbox_east', 'bbox_north'),
        }),
        ('Публикация', {
            'fields': ('is_published',),
        }),
    )

    def content_count(self, obj):
        count = obj.feature_contents.count()
        if count > 0:
            return format_html('<span style="color: #28a745;">{}</span>', count)
        return '-'
    content_count.short_description = 'Контент'

    def import_status_badge(self, obj):
        if obj.geoserver_layer_name and obj.postgis_table:
            return format_html(
                '<span style="color: #fff; background: {}; padding: 2px 8px; border-radius: 3px;">Импортирован</span>',
                '#28a745'
            )
        elif obj.source_file:
            return format_html(
                '<span style="color: #fff; background: {}; padding: 2px 8px; border-radius: 3px;">Ожидает импорт</span>',
                '#ffc107'
            )
        else:
            return format_html(
                '<span style="color: #fff; background: {}; padding: 2px 8px; border-radius: 3px;">Нет файла</span>',
                '#6c757d'
            )
    import_status_badge.short_description = 'Статус'

    @admin.action(description='Импортировать выбранные слои в PostGIS и GeoServer')
    def import_selected_layers(self, request, queryset):
        from .tasks import import_layer_task
        imported = 0
        skipped = 0
        for layer in queryset:
            if not layer.source_file:
                skipped += 1
                continue
            import_layer_task.delay(layer.id)
            imported += 1
        if imported:
            self.message_user(request, f"Запущен импорт {imported} слоёв.", messages.SUCCESS)
        if skipped:
            self.message_user(request, f"Пропущено {skipped} слоёв без файлов.", messages.WARNING)

    @admin.action(description='Удалить данные слоёв из PostGIS и GeoServer')
    def delete_layer_data(self, request, queryset):
        from .tasks import delete_layer_data_task
        deleted = 0
        for layer in queryset:
            if layer.postgis_table or layer.geoserver_layer_name:
                delete_layer_data_task.delay(layer.postgis_table, layer.geoserver_layer_name)
                layer.postgis_table = ''
                layer.geoserver_layer_name = ''
                layer.feature_count = 0
                layer.bbox_west = None
                layer.bbox_south = None
                layer.bbox_east = None
                layer.bbox_north = None
                layer.save()
                deleted += 1
        if deleted:
            self.message_user(request, f"Запущено удаление данных {deleted} слоёв.", messages.SUCCESS)


@admin.register(FeatureContent)
class FeatureContentAdmin(admin.ModelAdmin):
    form = FeatureContentAdminForm
    list_display = ('layer', 'feature_id', 'title', 'has_image', 'is_published', 'updated_at')
    list_filter = ('layer', 'is_published')
    list_editable = ('is_published',)
    search_fields = ('title', 'subtitle', 'description')
    inlines = [FeatureImageInline]
    
    fieldsets = (
        (None, {
            'fields': ('layer', 'feature_id')
        }),
        ('Контент', {
            'fields': ('title', 'subtitle', 'description')
        }),
        ('Изображение', {
            'fields': ('main_image', 'image_url', 'gdrive_folder_id', 'image_caption')
        }),
        ('Дополнительно', {
            'fields': ('extra_data', 'is_published'),
            'classes': ('collapse',),
        }),
    )
    
    def has_image(self, obj):
        if obj.main_image:
            return format_html('<span style="color: {};">✓</span>', '#28a745')
        return '-'
    has_image.short_description = 'Фото'


@admin.register(LayerStyle)

class LayerStyleAdmin(admin.ModelAdmin):
    # form = LayerStyleForm
    list_display = ('layer', 'attribute_field', 'attribute_value', 'fill_color_preview', 'legend_label', 'sort_order')
    list_filter = ('layer', 'attribute_field')
    list_editable = ('sort_order',)
    ordering = ('layer', 'sort_order')

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if db_field.name in ("fill_color", "stroke_color"):
            from django import forms
            kwargs["widget"] = forms.TextInput(attrs={"type": "color", "style": "width:80px; height:30px;"})
        return super().formfield_for_dbfield(db_field, request, **kwargs)
    
    fieldsets = (
        (None, {
            'fields': ('layer', 'attribute_field', 'attribute_value')
        }),
        ('Стиль', {
            'fields': ('fill_color', 'stroke_color', 'stroke_width', 'fill_opacity', 'radius')
        }),
        ('Легенда', {
            'fields': ('legend_label', 'sort_order')
        }),
    )
    
    def fill_color_preview(self, obj):
        return format_html(
            '<span style="background:{}; padding: 3px 12px; border-radius: 3px; border: 1px solid #ccc;">&nbsp;</span> {}',
            obj.fill_color, obj.fill_color
        )
    fill_color_preview.short_description = 'Цвет'
