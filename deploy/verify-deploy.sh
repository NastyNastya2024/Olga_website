#!/bin/bash
# Проверка деплоя — запустите на сервере после git pull
# ./deploy/verify-deploy.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(dirname "$PROJECT_DIR")"

echo "=== Проверка деплоя Olga Website ==="
echo ""

# 1. Путь к проекту
echo "1. Путь к проекту: $PROJECT_DIR"
echo "   (Nginx должен использовать этот путь + /public для статики)"
echo ""

# 2. Существуют ли ключевые файлы
echo "2. Проверка файлов:"
for f in "public/videos.html" "public/index.html" "admin/index.html" "shared/scripts/api.js" "backend/index.js"; do
    if [ -f "$PROJECT_DIR/$f" ]; then
        echo "   ✓ $f"
    else
        echo "   ✗ $f — НЕ НАЙДЕН!"
    fi
done
echo ""

# 3. Путь для Nginx (должен совпадать с deploy/nginx-olga-website.conf)
USER_HOME=$(eval echo ~)
EXPECTED_ROOT="$USER_HOME/olga-website"
echo "3. Ожидаемый root для Nginx: $EXPECTED_ROOT/public"
if [ "$PROJECT_DIR" = "$EXPECTED_ROOT" ]; then
    echo "   ✓ Путь совпадает"
else
    echo "   ⚠ Путь отличается! Текущий: $PROJECT_DIR"
    echo "   Обновите пути в deploy/nginx-olga-website.conf"
fi
echo ""

# 4. Backend
echo "4. Backend (PM2):"
if command -v pm2 &> /dev/null; then
    pm2 list 2>/dev/null | grep -E "olga|online|stopped" || echo "   PM2 не запущен или olga-backend не найден"
else
    echo "   PM2 не установлен"
fi
echo ""

# 5. API
echo "5. Проверка API:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health 2>/dev/null | grep -q 200; then
    echo "   ✓ http://localhost:5000/health — OK"
else
    echo "   ✗ Backend не отвечает на порту 5000"
fi
echo ""

echo "=== Если 404 на videos.html ==="
echo "1. Проверьте файл: ls -la $PROJECT_DIR/public/videos.html"
echo "2. Права для nginx (www-data): ls -la $PROJECT_DIR/public/ | head -5"
echo "3. Запустите: ./deploy/apply-nginx.sh"
echo "4. Проверьте активный конфиг: sudo nginx -T 2>/dev/null | grep -A2 'root.*public'"
echo ""
