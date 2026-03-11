#!/bin/bash
# Применяет конфиг Nginx из репозитория (включая client_max_body_size 20G)
# Запуск: ./deploy/apply-nginx.sh
# Требует sudo для копирования в /etc/nginx/

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
NGINX_CONF="$PROJECT_DIR/deploy/nginx-olga-website.conf"

if [ ! -f "$NGINX_CONF" ]; then
    echo "Ошибка: файл $NGINX_CONF не найден"
    exit 1
fi

echo "Копирование конфига Nginx..."
sudo cp "$NGINX_CONF" /etc/nginx/sites-available/olga-website

echo "Проверка конфигурации..."
sudo nginx -t

echo "Перезагрузка Nginx..."
sudo systemctl reload nginx

echo "Готово. client_max_body_size 20G применён."
