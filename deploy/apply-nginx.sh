#!/bin/bash
# Применяет конфиг Nginx из репозитория (включая client_max_body_size 20G)
# Запуск: ./deploy/apply-nginx.sh
# Требует sudo для копирования в /etc/nginx/

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
NGINX_TEMPLATE="$PROJECT_DIR/deploy/nginx-olga-website.conf"

if [ ! -f "$NGINX_TEMPLATE" ]; then
    echo "Ошибка: файл $NGINX_TEMPLATE не найден"
    exit 1
fi

# Подставляем реальный путь к проекту (на случай другого пользователя)
PROJECT_ROOT="$(dirname "$PROJECT_DIR")"
CURRENT_USER="$(basename "$PROJECT_ROOT")"
echo "Путь к проекту: $PROJECT_DIR"
echo "Пользователь: $CURRENT_USER"

# Создаём конфиг с правильным путём (root должен быть .../public)
sed "s|/home/anastkomarova/olga-website|$PROJECT_DIR|g" "$NGINX_TEMPLATE" > /tmp/olga-website-nginx.conf

# Проверяем, что root содержит /public
if ! grep -q "root.*olga-website/public" /tmp/olga-website-nginx.conf; then
    echo "ОШИБКА: root в конфиге должен указывать на .../public"
    grep "root" /tmp/olga-website-nginx.conf || true
    exit 1
fi
echo "Проверка root: $(grep 'root.*public' /tmp/olga-website-nginx.conf | head -1)"

echo "Копирование конфига Nginx..."
sudo cp /tmp/olga-website-nginx.conf /etc/nginx/sites-available/olga-website

# Убеждаемся, что конфиг включён
sudo ln -sf /etc/nginx/sites-available/olga-website /etc/nginx/sites-enabled/olga-website 2>/dev/null || true

# Отключаем default site, чтобы наш конфиг обрабатывал все запросы (в т.ч. по IP)
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

echo "Проверка конфигурации..."
sudo nginx -t

echo "Перезагрузка Nginx..."
sudo systemctl reload nginx

echo "Готово. client_max_body_size 20G применён."
echo ""
echo "Проверка: файл videos.html должен быть по пути $PROJECT_DIR/public/videos.html"
echo "Если 404 сохраняется: sudo nginx -T 2>/dev/null | grep -E 'root|videos'"
