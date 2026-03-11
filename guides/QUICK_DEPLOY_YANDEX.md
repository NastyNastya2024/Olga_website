# 🚀 Быстрый деплой на Yandex Cloud

## Ваша ВМ

- **IP**: 158.160.192.242
- **Пользователь**: admin
- **ОС**: Ubuntu 24.04 LTS
- **Конфигурация**: 2 vCPU, 4 GB RAM, 20 GB SSD

## Быстрый старт

### 1. Подключитесь к серверу

```bash
ssh -l admin 158.160.192.242
```

### 2. Загрузите проект на сервер

**Вариант A: Через Git**
```bash
cd ~
git clone YOUR_REPOSITORY_URL olga-website
cd olga-website
```

**Вариант B: Через SCP (с локальной машины)**
```bash
scp -r /Users/a1/Documents/GitHub/Olga_website admin@158.160.192.242:~/olga-website
```

### 3. Запустите скрипт автоматической установки

```bash
cd ~/olga-website
chmod +x scripts/deploy-yandex-cloud.sh
./scripts/deploy-yandex-cloud.sh
```

### 4. Настройте переменные окружения

```bash
cd ~/olga-website/backend

# Создайте .env файл
nano .env
```

Вставьте следующее содержимое (замените пароли!):

```env
# База данных
DB_HOST=localhost
DB_PORT=5432
DB_NAME=olga_website
DB_USER=olga_user
DB_PASSWORD=ВАШ_ПАРОЛЬ_БД

# JWT секрет
JWT_SECRET=$(openssl rand -base64 32)

# S3/MinIO настройки
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_BUCKET=olga-media
S3_REGION=us-east-1
S3_USE_SSL=false

# Порт сервера
PORT=5000

# Режим
NODE_ENV=production
```

### 5. Примените миграции базы данных

```bash
cd ~/olga-website
sudo -u postgres psql -d olga_website -f database/init.sql
```

### 6. Установите зависимости и запустите приложение

```bash
cd ~/olga-website/backend
npm install --production

# Запуск через PM2
pm2 start index.js --name olga-backend
pm2 save
pm2 startup  # Выполните команду, которую выведет PM2
```

### 7. Настройте Nginx

```bash
sudo tee /etc/nginx/sites-available/olga-website > /dev/null << 'EOF'
server {
    listen 80;
    server_name 158.160.192.242;

    client_max_body_size 20G;

    location / {
        root /home/admin/olga-website/public;
        try_files $uri $uri/ /index.html;
    }

    location /admin {
        alias /home/admin/olga-website/admin;
        try_files $uri $uri/ /admin/index.html;
    }

    location /shared {
        alias /home/admin/olga-website/shared;
    }

    location /img {
        alias /home/admin/olga-website/img;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/olga-website /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 8. Проверьте работу

Откройте в браузере:
- **Сайт**: http://158.160.192.242
- **Админ-панель**: http://158.160.192.242/admin
- **MinIO Console**: http://158.160.192.242:9001

## Обновление после git pull (включая Nginx)

Конфиг Nginx хранится в репозитории. После `git pull` примените его одной командой:

```bash
cd ~/olga-website
./deploy/apply-nginx.sh
```

Скрипт скопирует `deploy/nginx-olga-website.conf` (с `client_max_body_size 20G`) в Nginx и перезагрузит его. Ручное редактирование не нужно.

---

## Полезные команды

```bash
# Просмотр логов приложения
pm2 logs olga-backend

# Перезапуск приложения
pm2 restart olga-backend

# Статус приложения
pm2 status

# Логи Nginx
sudo tail -f /var/log/nginx/olga-website-error.log
```

## Полная инструкция

Для подробной инструкции со всеми шагами и решением проблем см.:
**guides/DEPLOY_YANDEX_CLOUD.md**
