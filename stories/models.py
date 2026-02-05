from django.db import models
from django.utils.text import slugify


class Page(models.Model):
    """Универсальная страница сайта"""
    title = models.CharField('Название', max_length=200)
    slug = models.SlugField('URL-адрес', max_length=200, unique=True, blank=True)
    subtitle = models.CharField('Подзаголовок', max_length=500, blank=True)
    cover_image = models.ImageField('Обложка', upload_to='pages/covers/', blank=True, null=True)
    
    # Контент в формате Quill JSON
    content = models.JSONField('Контент', default=dict, blank=True)
    
    # Тип страницы
    PAGE_TYPES = [
        ('home', 'Главная страница'),
        ('page', 'Обычная страница'),
        ('story', 'Геоистория'),
        ('category', 'Раздел рельефа'),
    ]
    page_type = models.CharField('Тип страницы', max_length=20, choices=PAGE_TYPES, default='page')
    
    # Категория рельефа (для type=category)
    RELIEF_CATEGORIES = [
        ('', '---'),
        ('glacial', 'Ледниковый рельеф'),
        ('fluvial', 'Флювиальный рельеф'),
        ('aeolian', 'Эоловый рельеф'),
        ('cryogenic', 'Криогенный рельеф'),
    ]
    relief_category = models.CharField('Категория рельефа', max_length=50, choices=RELIEF_CATEGORIES, blank=True)
    
    # Меню
    MENU_POSITIONS = [
        ('', 'Не в меню'),
        ('main', 'Главное меню'),
        ('relief', 'Подменю "Рельеф"'),
        ('footer', 'Футер'),
    ]
    menu_position = models.CharField('Позиция в меню', max_length=20, choices=MENU_POSITIONS, blank=True)
    menu_order = models.IntegerField('Порядок в меню', default=0)
    
    # Родительская страница (для подстраниц)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, 
                               related_name='children', verbose_name='Родительская страница')
    
    # Мета
    author = models.CharField('Автор', max_length=200, blank=True)
    created_at = models.DateTimeField('Создано', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлено', auto_now=True)
    is_published = models.BooleanField('Опубликовано', default=False)
    
    # SEO
    meta_description = models.TextField('META описание', blank=True)
    
    class Meta:
        verbose_name = 'Страница'
        verbose_name_plural = 'Страницы'
        ordering = ['menu_order', 'title']
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title, allow_unicode=True)
            slug = base_slug
            n = 1
            while Page.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)
    
    def get_absolute_url(self):
        if self.page_type == 'home':
            return '/'
        return f'/p/{self.slug}/'
