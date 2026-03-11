#!/bin/bash
# Настройка CORS для бакета olga-website-media в Yandex Object Storage
# Требует: AWS CLI (apt install awscli) и ключи из backend/.env
#
# Запуск: ./deploy/apply-cors.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/backend/.env"
CORS_FILE="$SCRIPT_DIR/cors.json"

if [ ! -f "$ENV_FILE" ]; then
    echo "Ошибка: не найден $ENV_FILE"
    echo "Добавьте S3_ACCESS_KEY и S3_SECRET_KEY в backend/.env"
    exit 1
fi

# Загружаем ключи из .env
source "$ENV_FILE" 2>/dev/null || true

if [ -z "$S3_ACCESS_KEY" ] || [ -z "$S3_SECRET_KEY" ]; then
    echo "Ошибка: S3_ACCESS_KEY и S3_SECRET_KEY должны быть в backend/.env"
    exit 1
fi

# Проверяем AWS CLI
if ! command -v aws &> /dev/null; then
    echo "Установите AWS CLI: sudo apt install awscli"
    exit 1
fi

echo "Применяю CORS к бакету olga-website-media..."

AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" \
AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
aws s3api put-bucket-cors \
    --bucket olga-website-media \
    --cors-configuration file://"$CORS_FILE" \
    --endpoint-url https://storage.yandexcloud.net

echo "Готово. CORS применён."
