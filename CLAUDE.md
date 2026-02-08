# ReliefWestSib - Геопортал ледниковых систем Западной Сибири

## О проекте

Научный геопортал для исследования ледниковых систем и границ плейстоценового оледенения Западно-Сибирской равнины. Сочетает web-GIS функциональность с CMS для презентации научных данных.

**URL:** https://reliefwestsib.ru/geoportal/

## Технологический стек

### Backend
- Django 5 + GeoDjango
- Wagtail CMS
- PostgreSQL + PostGIS
- GeoServer (WMS/WFS)

### Frontend
- React 19 + Vite
- Ant Design 6
- Zustand (state management)
- React-Leaflet
- Turf.js (геоаналитика)

## Структура проекта

```
/opt/geoportal_admin/           # Корень на сервере
├── geoportal/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapView.jsx     # Карта React-Leaflet
│   │   │   ├── MapControls.jsx # Basemap, coords, legend, измерения
│   │   │   ├── Sidebar.jsx     # Tabs + Search
│   │   │   ├── LayerPanel.jsx  # Список слоёв + download
│   │   │   ├── FeatureInfo.jsx # Информация об объекте + галерея
│   │   │   └── AttrTable.jsx   # Таблица атрибутов (плавающее окно)
│   │   ├── store/
│   │   │   └── index.js        # Zustand store
│   │   ├── styles/
│   │   │   └── index.css       # Минимальные CSS (Ant Design делает основное)
│   │   ├── config.js           # API endpoints, basemaps
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── layers/                     # Django app для слоёв
├── geoportal_admin/            # Django settings
├── manage.py
└── staticfiles/
```

## Сервер

**IP:** 188.120.229.244
**Hostname:** kabanin.fvds.ru
**OS:** Ubuntu 24
**RAM:** 4GB
**Python venv:** /opt/geodjango/

### Порты

| Порт | Сервис |
|------|--------|
| 8000 | reliefwestsib (Django/Wagtail) |
| 8080 | GeoServer |
| 8001 | oilgascity backend |
| 8003 | oilgascity-wagtail |

### Systemd сервисы

```bash
# Статус
systemctl status gunicorn

# Перезапуск
systemctl restart gunicorn
```

### Важные пути на сервере

| Путь | Описание |
|------|----------|
| /opt/geoportal_admin/ | Django проект |
| /var/www/html/geoportal/ | Скомпилированный frontend |
| /var/www/html/tiles/dem3/ | Тайлы рельефа DEM |
| /etc/nginx/sites-available/reliefwestsib | Nginx конфиг |
| /opt/geodjango/ | Python venv |

## Конфигурация

### config.js - Basemaps

```javascript
export const BASEMAPS = {
    osm: {
        name: 'OpenStreetMap',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
    },
    satellite: {
        name: 'Спутник',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri',
    },
    topo: {
        name: 'Топокарта',
        url: 'https://reliefwestsib.ru/tiles/topo/{z}/{x}/{y}',
        attribution: '© Генштаб',
    },
    dem: {
        name: 'Рельеф',
        url: 'https://reliefwestsib.ru/tiles/dem3/{z}/{x}/{y}.png',
        attribution: '© TanDEM-X',
    },
};
```

### store/index.js - Важные настройки

```javascript
// Светлая тема по умолчанию
darkTheme: localStorage.getItem('geoportal-theme') === 'dark',

// Получение featureId (НЕ использовать props.id — там строковый ID типа "2017_15")
const featureId = props.gid || feature.id?.split('.').pop();
```

### Nginx - топокарта прокси

Топокарта загружается через nginx прокси (настроено на сервере):
```nginx
location /tiles/topo/ {
    proxy_pass http://88.99.52.156/tmg/;
    proxy_set_header Referer "";
    proxy_set_header Host 88.99.52.156;
}
```

## Деплой

### Из локальной разработки на сервер

```bash
# 1. Локально - commit и push
git add -A
git commit -m "описание изменений"
git push origin master

# 2. На сервере - pull и сборка
ssh root@188.120.229.244
cd /opt/geoportal_admin
git pull
cd geoportal
npm install
npm run build
cp -r dist/assets /var/www/html/geoportal/
cp dist/index.html /var/www/html/geoportal/
```

### Быстрый деплой (одна команда на сервере)

```bash
cd /opt/geoportal_admin && git pull && cd geoportal && npm install && npm run build && cp -r dist/assets /var/www/html/geoportal/ && cp dist/index.html /var/www/html/geoportal/
```

## API Endpoints

| Endpoint | Описание |
|----------|----------|
| /api/projects/ | Список проектов |
| /api/layers/ | Слои с стилями |
| /api/features/{layer_slug}/{feature_id}/ | Контент объекта (описание, галерея) |
| /geoserver/wms | WMS сервис |
| /geoserver/wfs | WFS сервис |

## Известные особенности

1. **featureId** — в GeoServer WFS поле `id` в properties содержит строковый идентификатор (например "2017_15"), а не числовой ID. Реальный ID нужно брать из `feature.id.split('.').pop()`.

2. **Топокарта** — загружается через nginx прокси, т.к. прямой запрос к 88.99.52.156 блокируется mixed content (HTTPS → HTTP).

3. **Тайлы DEM** — путь `/tiles/dem3/`, 9.2 ГБ PNG с отмывкой рельефа.

4. **Тема** — по умолчанию светлая. Хранится в `localStorage.getItem('geoportal-theme')`.

## Функционал таблицы атрибутов (AttrTable.jsx)

- Плавающее окно (react-rnd) — перетаскивание, ресайз
- Изменяемая ширина колонок (react-resizable)
- Кнопка "Приблизить" к объекту (flyTo / fitBounds)
- Подсветка выбранного объекта на карте (жёлтый стиль)
- Поиск по атрибутам
- Сортировка колонок
- Пагинация

## Стили CSS

Ant Design обрабатывает 95% стилей через ConfigProvider. В `styles/index.css` только:
- Позиционирование контролов карты
- Галерея фото
- Сглаживание тайлов
- Скроллбары

```css
/* Сглаживание тайлов */
.leaflet-tile {
    image-rendering: auto;
    image-rendering: smooth;
    -webkit-backface-visibility: hidden;
}
```

## Команды диагностики

```bash
# Проверить gunicorn
ps aux | grep gunicorn

# Логи Django
journalctl -u gunicorn -f

# Логи nginx
tail -f /var/log/nginx/error.log

# Проверить nginx конфиг
nginx -t

# Перезапустить nginx
systemctl reload nginx
```

## Контакты

**GitHub:** https://github.com/SizovOleg/reliefwestsib
**Автор:** Sizov Oleg
