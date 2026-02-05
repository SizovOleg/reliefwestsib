from django.db import models
from wagtail.models import Page
from wagtail.fields import RichTextField, StreamField
from wagtail.admin.panels import FieldPanel
from wagtail.blocks import (
    CharBlock, RichTextBlock, TextBlock, URLBlock,
    StructBlock, ListBlock, PageChooserBlock
)
from wagtail.images.blocks import ImageChooserBlock
from wagtail.embeds.blocks import EmbedBlock


# Кастомные блоки
class HeroBlock(StructBlock):
    title = CharBlock(label="Заголовок")
    subtitle = TextBlock(label="Подзаголовок", required=False)
    background_image = ImageChooserBlock(label="Фоновое изображение", required=False)
    
    class Meta:
        template = 'blocks/hero_block.html'
        icon = 'image'
        label = 'Hero секция'


class MapBlock(StructBlock):
    title = CharBlock(label="Заголовок", required=False)
    map_url = URLBlock(label="URL карты", default="/geoportal/")
    height = CharBlock(label="Высота", default="500px")
    
    class Meta:
        template = 'blocks/map_block.html'
        icon = 'site'
        label = 'Карта'


class CardBlock(StructBlock):
    title = CharBlock(label="Заголовок")
    text = TextBlock(label="Описание", required=False)
    image = ImageChooserBlock(label="Изображение", required=False)
    link = PageChooserBlock(label="Ссылка на страницу", required=False)
    external_link = URLBlock(label="Внешняя ссылка", required=False)
    
    class Meta:
        template = 'blocks/card_block.html'
        icon = 'doc-full'
        label = 'Карточка'


class CardsGridBlock(StructBlock):
    title = CharBlock(label="Заголовок секции", required=False)
    cards = ListBlock(CardBlock(), label="Карточки")
    
    class Meta:
        template = 'blocks/cards_grid_block.html'
        icon = 'grip'
        label = 'Сетка карточек'


class GalleryBlock(StructBlock):
    title = CharBlock(label="Заголовок", required=False)
    images = ListBlock(ImageChooserBlock(), label="Изображения")
    
    class Meta:
        template = 'blocks/gallery_block.html'
        icon = 'image'
        label = 'Галерея'


# Главная страница
class HomePage(Page):
    # Можно добавить специфичные поля для главной
    
    content = StreamField([
        ('hero', HeroBlock()),
        ('text', RichTextBlock(label="Текст")),
        ('map', MapBlock()),
        ('cards_grid', CardsGridBlock()),
        ('gallery', GalleryBlock()),
        ('embed', EmbedBlock(label="Видео/Embed")),
    ], use_json_field=True, blank=True, verbose_name="Контент")
    
    content_panels = Page.content_panels + [
        FieldPanel('content'),
    ]
    
    class Meta:
        verbose_name = "Главная страница"


# Обычная страница (статья, о равнине, об авторе и т.д.)
class ContentPage(Page):
    subtitle = models.CharField("Подзаголовок", max_length=255, blank=True)
    
    content = StreamField([
        ('text', RichTextBlock(label="Текст")),
        ('image', ImageChooserBlock(label="Изображение")),
        ('map', MapBlock()),
        ('gallery', GalleryBlock()),
        ('embed', EmbedBlock(label="Видео/Embed")),
        ('cards_grid', CardsGridBlock()),
    ], use_json_field=True, blank=True, verbose_name="Контент")
    
    content_panels = Page.content_panels + [
        FieldPanel('subtitle'),
        FieldPanel('content'),
    ]
    
    class Meta:
        verbose_name = "Страница"
        verbose_name_plural = "Страницы"


# Геоистория (с картой сбоку)
class GeoStoryPage(Page):
    subtitle = models.CharField("Подзаголовок", max_length=255, blank=True)
    cover_image = models.ForeignKey(
        'wagtailimages.Image',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='+',
        verbose_name="Обложка"
    )
    
    content = StreamField([
        ('text', RichTextBlock(label="Текст")),
        ('image', ImageChooserBlock(label="Изображение")),
        ('map', MapBlock()),
        ('gallery', GalleryBlock()),
    ], use_json_field=True, blank=True, verbose_name="Контент")
    
    content_panels = Page.content_panels + [
        FieldPanel('subtitle'),
        FieldPanel('cover_image'),
        FieldPanel('content'),
    ]
    
    class Meta:
        verbose_name = "Геоистория"
        verbose_name_plural = "Геоистории"


# Страница публикаций
class PublicationsIndexPage(Page):
    intro = RichTextField("Введение", blank=True)
    
    content_panels = Page.content_panels + [
        FieldPanel('intro'),
    ]
    
    class Meta:
        verbose_name = "Список публикаций"


class Publication(models.Model):
    """Модель публикации (не страница, а сниппет)"""
    title = models.CharField("Название", max_length=500)
    authors = models.CharField("Авторы", max_length=500)
    year = models.IntegerField("Год")
    journal = models.CharField("Журнал/Издание", max_length=300, blank=True)
    volume = models.CharField("Том", max_length=50, blank=True)
    pages = models.CharField("Страницы", max_length=50, blank=True)
    doi = models.CharField("DOI", max_length=200, blank=True)
    url = models.URLField("Ссылка", blank=True)
    pdf = models.ForeignKey(
        'wagtaildocs.Document',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='+',
        verbose_name="PDF файл"
    )
    abstract = models.TextField("Аннотация", blank=True)
    
    class Meta:
        verbose_name = "Публикация"
        verbose_name_plural = "Публикации"
        ordering = ['-year', 'authors']
    
    def __str__(self):
        return f"{self.authors} ({self.year}). {self.title}"
