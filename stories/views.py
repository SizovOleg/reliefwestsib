from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Page


def page_editor(request, page_id):
    page = get_object_or_404(Page, id=page_id)
    return render(request, 'stories/editor.html', {
        'page': page, 
        'content_json': json.dumps(page.content)
    })


@csrf_exempt
def page_save(request, page_id):
    if request.method == 'POST':
        page = get_object_or_404(Page, id=page_id)
        try:
            data = json.loads(request.body)
            page.content = data.get('content', {})
            page.title = data.get('title', page.title)
            page.subtitle = data.get('subtitle', page.subtitle)
            page.save()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'POST required'})


def page_view(request, slug):
    page = get_object_or_404(Page, slug=slug, is_published=True)
    return render(request, 'stories/page.html', {'page': page})


def home_view(request):
    page = Page.objects.filter(page_type='home', is_published=True).first()
    return render(request, 'stories/page.html', {'page': page})


def pages_api(request):
    """API для получения меню и страниц"""
    pages = Page.objects.filter(is_published=True).values(
        'id', 'title', 'slug', 'page_type', 'menu_position', 'menu_order', 'relief_category'
    )
    return JsonResponse({'pages': list(pages)})
