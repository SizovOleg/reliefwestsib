from django.contrib import admin
from django.utils.html import format_html
from .models import Page


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ('title', 'page_type', 'menu_position', 'is_published', 'updated_at', 'edit_button')
    list_filter = ('is_published', 'page_type', 'menu_position')
    list_editable = ('is_published', 'menu_position')
    search_fields = ('title', 'subtitle')
    prepopulated_fields = {'slug': ('title',)}
    
    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'subtitle', 'page_type')
        }),
        ('Категория', {
            'fields': ('relief_category', 'parent'),
            'classes': ('collapse',),
        }),
        ('Меню', {
            'fields': ('menu_position', 'menu_order')
        }),
        ('Обложка', {
            'fields': ('cover_image',),
            'classes': ('collapse',),
        }),
        ('Публикация', {
            'fields': ('is_published', 'author')
        }),
        ('SEO', {
            'fields': ('meta_description',),
            'classes': ('collapse',),
        }),
    )
    
    def edit_button(self, obj):
        return format_html(
            '<a href="/page-editor/{}/" target="_blank" style="padding: 5px 10px; background: #5a8fa8; color: white; text-decoration: none; border-radius: 3px;">Редактор</a>',
            obj.id
        )
    edit_button.short_description = 'Редактор'
