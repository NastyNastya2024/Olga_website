#!/bin/bash

# Скрипт для автоматизации деплоя на Yandex Cloud
# Использование: ./deploy-yandex-cloud.sh

set -e  # Остановка при ошибке

echo "🚀 Начало деплоя проекта Olga Website на Yandex Cloud"
echo "=================================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка, что скрипт запущен от имени пользователя admin
if [ "$USER" != "admin" ]; then
    echo -e "${YELLOW}Предупреждение: Рекомендуется запускать от имени пользователя admin${NC}"
fi

# Функция для проверки успешности команды
check_command() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
        exit 1
    fi
}

# Шаг 1: Обновление системы
echo ""
echo "📦 Шаг 1: Обновление системы..."
sudo apt update && sudo apt upgrade -y
check_command "Система обновлена"

# Шаг 2: Установка Node.js
echo ""
echo "📦 Шаг 2: Установка Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    check_command "Node.js установлен"
else
    echo -e "${GREEN}✓${NC} Node.js уже установлен ($(node --version))"
fi

# Шаг 3: Установка PostgreSQL
echo ""
echo "📦 Шаг 3: Установка PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    check_command "PostgreSQL установлен и запущен"
else
    echo -e "${GREEN}✓${NC} PostgreSQL уже установлен"
fi

# Создание базы данных (если не существует)
echo ""
echo "📦 Создание базы данных..."
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='olga_website'")
if [ "$DB_EXISTS" != "1" ]; then
    read -sp "Введите пароль для пользователя olga_user: " DB_PASSWORD
    echo ""
    sudo -u postgres psql << EOF
CREATE DATABASE olga_website;
CREATE USER olga_user WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE olga_website TO olga_user;
ALTER USER olga_user CREATEDB;
\q
EOF
    check_command "База данных создана"
    echo "⚠️  Сохраните пароль базы данных: $DB_PASSWORD"
else
    echo -e "${GREEN}✓${NC} База данных уже существует"
fi

# Шаг 4: Установка Docker
echo ""
echo "📦 Шаг 4: Установка Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker admin
    check_command "Docker установлен"
    echo -e "${YELLOW}⚠️  Переподключитесь к SSH для применения изменений группы docker${NC}"
else
    echo -e "${GREEN}✓${NC} Docker уже установлен ($(docker --version))"
fi

# Установка Docker Compose
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    check_command "Docker Compose установлен"
else
    echo -e "${GREEN}✓${NC} Docker Compose уже установлен"
fi

# Шаг 5: Настройка MinIO
echo ""
echo "📦 Шаг 5: Настройка MinIO..."
cd ~
if [ ! -f "docker-compose.yml" ]; then
    cat > docker-compose.yml << 'EOF'
services:
  minio:
    image: minio/minio:latest
    container_name: olga_minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    restart: unless-stopped
    networks:
      - olga_network

  minio-setup:
    image: minio/mc:latest
    container_name: olga_minio_setup
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      sleep 5;
      mc alias set myminio http://minio:9000 minioadmin minioadmin123;
      mc mb myminio/olga-media --ignore-existing;
      mc anonymous set download myminio/olga-media;
      exit 0;
      "
    networks:
      - olga_network

volumes:
  minio_data:
    driver: local

networks:
  olga_network:
    driver: bridge
EOF
    check_command "docker-compose.yml создан"
fi

# Запуск MinIO
if ! docker ps | grep -q olga_minio; then
    docker-compose up -d
    check_command "MinIO запущен"
else
    echo -e "${GREEN}✓${NC} MinIO уже запущен"
fi

# Шаг 6: Установка PM2
echo ""
echo "📦 Шаг 6: Установка PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    check_command "PM2 установлен"
else
    echo -e "${GREEN}✓${NC} PM2 уже установлен"
fi

# Шаг 7: Установка Nginx
echo ""
echo "📦 Шаг 7: Установка Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl enable nginx
    check_command "Nginx установлен"
else
    echo -e "${GREEN}✓${NC} Nginx уже установлен"
fi

# Шаг 8: Настройка файрвола
echo ""
echo "📦 Шаг 8: Настройка файрвола..."
if ! command -v ufw &> /dev/null; then
    sudo apt install -y ufw
fi

# Проверка правил файрвола
if ! sudo ufw status | grep -q "22/tcp"; then
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
    check_command "Файрвол настроен"
else
    echo -e "${GREEN}✓${NC} Файрвол уже настроен"
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Базовая установка завершена!${NC}"
echo ""
echo "Следующие шаги:"
echo "1. Загрузите проект на сервер (через git clone или scp)"
echo "2. Настройте файл .env в директории backend/"
echo "3. Примените миграции базы данных"
echo "4. Установите зависимости: cd ~/olga-website/backend && npm install"
echo "5. Запустите приложение: pm2 start index.js --name olga-backend"
echo "6. Настройте Nginx (см. guides/DEPLOY_YANDEX_CLOUD.md)"
echo ""
echo "Подробная инструкция: guides/DEPLOY_YANDEX_CLOUD.md"
