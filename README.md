# Relief West Siberia — Геопортал

Научно-образовательный геопортал по геоморфологии Западно-Сибирской равнины.

**URL:** https://reliefwestsib.ru

## Описание

Реконструкция границ плейстоценовых оледенений Западно-Сибирской равнины по геологическим и палеоклиматическим данным. Проект включает интерактивную карту с векторными и растровыми слоями, систему управления контентом и базу публикаций.

## Стек технологий

- **Backend:** Django 6.0 + GeoDjango + Django REST Framework
- **CMS:** Wagtail 7.3
- **Database:** PostgreSQL 16 + PostGIS 3.4
- **GIS Server:** GeoServer 2.26
- **Frontend:** React + Leaflet (собранный билд)
- **Web Server:** Nginx + Gunicorn
- **Task Queue:** Celery + Redis

## Структура проекта
```
/opt/geoportal_admin/
├── geoportal_admin/     # Настройки Django (settings, urls, wsgi)
├── home/                # Wagtail CMS — страницы сайта
│   ├── models.py        # HomePage, ContentPage, GeoStoryPage
│   └── templates/       # Шаблоны страниц и блоков
├── layers/              # GIS-слои и API геопортала
│   ├── models.py        # MapProject, Layer, FeatureContent, LayerStyle
│   ├── views.py         # REST API endpoints
│   ├── serializers.py   # DRF сериализаторы
│   ├── admin.py         # Django Admin для слоёв
│   └── gdrive_utils.py  # Интеграция с Google Drive
├── stories/             # Геоистории (в разработке)
├── media/               # Загруженные файлы (не в Git)
├── staticfiles/         # Собранная статика (не в Git)
├── requirements.txt     # Python зависимости
└── manage.py
```

## Внешние компоненты
```
/var/www/html/index.html  # React-геопортал (Leaflet карта)
/etc/nginx/sites-available/reliefwestsib  # Nginx конфиг
/etc/systemd/system/gunicorn.service      # Systemd сервис
```

## API Endpoints

| Endpoint | Описание |
|----------|----------|
| `GET /api/projects/` | Список картографических проектов |
| `GET /api/projects/<slug>/` | Детали проекта со слоями |
| `GET /api/layers/` | Список опубликованных слоёв |
| `GET /api/layers/<slug>/` | Детали слоя |
| `GET /api/features/<layer_slug>/<feature_id>/` | Контент объекта карты |

## URL структура

| URL | Назначение |
|-----|------------|
| `/` | Главная страница (Wagtail) |
| `/cms/` | Админка Wagtail CMS |
| `/admin/` | Django Admin (слои, стили) |
| `/geoportal/` | Интерактивная карта |
| `/geoserver/` | GeoServer (WMS/WFS) |
| `/api/` | REST API |

## Установка (development)
```bash
# Клонирование
git clone <repo-url>
cd geoportal_admin

# Виртуальное окружение
python3 -m venv venv
source venv/bin/activate

# Зависимости
pip install -r requirements.txt

# База данных (PostgreSQL + PostGIS должны быть установлены)
createdb geoportal
psql geoportal -c "CREATE EXTENSION postgis;"

# Миграции
python manage.py migrate

# Создание суперпользователя
python manage.py createsuperuser

# Запуск
python manage.py runserver
```

## Деплой (production)
```bash
# Сбор статики
python manage.py collectstatic --noinput

# Перезапуск сервисов
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

## Резервное копирование
```bash
# База данных
pg_dump geoportal > backup_$(date +%Y%m%d).sql

# Медиафайлы
tar -czf media_$(date +%Y%m%d).tar.gz /opt/geoportal_admin/media/
```

## Авторы

- Kabanin — разработка, геоданные

## Лицензия

MIT License
