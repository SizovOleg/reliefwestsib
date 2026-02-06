# ReliefWestSib — Геопортал ледниковых систем Западной Сибири

Веб-ГИС платформа для визуализации и анализа геоморфологических данных плейстоценовых оледенений Западно-Сибирской равнины.

## Стек технологий

### Backend
- **Django 5** — основной фреймворк
- **Wagtail 6** — CMS для управления контентом и геоисториями
- **GeoServer** — публикация WMS/WFS слоёв
- **PostgreSQL + PostGIS** — хранение геоданных
- **Celery + Redis** — фоновые задачи
- **Nginx + Gunicorn** — production сервер

### Frontend (geoportal/)
- **React 19** — UI библиотека
- **Ant Design 6** — компоненты интерфейса
- **Zustand** — управление состоянием
- **React-Leaflet** — картографический движок
- **Vite** — сборщик

## Структура проекта
```
/opt/geoportal_admin/
├── geoportal_admin/     # Django settings
├── home/                # Wagtail home app
├── stories/             # Геоистории (StoryMap)
├── layers/              # Управление слоями GeoServer
│   ├── models.py        # Layer, FeatureContent, LayerStyle
│   ├── views.py         # API endpoints
│   ├── geoserver_api.py # Интеграция с GeoServer
│   └── gdrive_utils.py  # Google Drive галереи
├── geoportal/           # React фронтенд
│   ├── src/
│   │   ├── main.jsx           # Entry point + ConfigProvider
│   │   ├── App.jsx            # Layout (Header, Sider, Content)
│   │   ├── config.js          # API, basemaps, defaults
│   │   ├── store/index.js     # Zustand store
│   │   ├── components/
│   │   │   ├── MapView.jsx    # React-Leaflet карта
│   │   │   ├── MapControls.jsx # Basemap, coords, legend
│   │   │   ├── Sidebar.jsx    # Tabs + Search
│   │   │   ├── LayerPanel.jsx # Список слоёв
│   │   │   ├── FeatureInfo.jsx # Информация об объекте
│   │   │   └── AttrTable.jsx  # Таблица атрибутов (Drawer)
│   │   └── styles/index.css   # Minimal overrides
│   └── dist/            # Production build
├── config/              # Nginx, Gunicorn configs
└── scripts/             # Утилиты
```

## API Endpoints

| Endpoint | Описание |
|----------|----------|
| `/api/projects/` | Список проектов |
| `/api/layers/` | Список слоёв с настройками стилей |
| `/api/features/{layer_slug}/{feature_id}/` | Контент объекта (описание, галерея) |
| `/geoserver/wms` | WMS сервис |
| `/geoserver/wfs` | WFS сервис |

## Деплой
```bash
# Backend
cd /opt/geoportal_admin
source venv/bin/activate
python manage.py migrate
python manage.py collectstatic

# Frontend
cd geoportal
npm install
npm run build
cp -r dist/* /var/www/html/

# Services
sudo systemctl restart gunicorn nginx
```

## Лицензия

MIT
