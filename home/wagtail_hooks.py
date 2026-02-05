from wagtail.snippets.models import register_snippet
from wagtail.snippets.views.snippets import SnippetViewSet
from .models import Publication


class PublicationViewSet(SnippetViewSet):
    model = Publication
    icon = "doc-full"
    list_display = ["title", "authors", "year", "journal"]
    list_filter = ["year"]
    search_fields = ["title", "authors", "journal"]


register_snippet(PublicationViewSet)
