#!/bin/bash
cd /opt/geoportal_admin
source /opt/geodjango/bin/activate

# Обновляем requirements на случай новых пакетов
pip freeze > requirements.txt

# Добавляем изменения
git add .

# Коммит с датой (только если есть изменения)
git diff --cached --quiet || git commit -m "Auto backup: $(date '+%Y-%m-%d %H:%M')"

# Отправляем на GitHub
git push origin master
