# Пошаговый план деплоя проекта на Selectel

## Подготовка

### 1. Регистрация и создание сервера в Selectel

1. Зарегистрируйтесь на [selectel.ru](https://selectel.ru)
2. Перейдите в раздел **Облачные платформы** → **Виртуальные серверы**
3. Создайте новый сервер:
   - **ОС**: Ubuntu 22.04 LTS (рекомендуется)
   - **Конфигурация**: минимум 2 CPU, 4 GB RAM, 20 GB SSD
   - **Регион**: выберите ближайший к вашей аудитории
   - **Сеть**: создайте новую сеть или используйте существующую
   - **Публичный IP**: включите автоматическое выделение

### 2. Подключение к серверу

После создания сервера вы получите:
- IP-адрес сервера
- Логин (обычно `root`)
- Пароль (или SSH-ключ)

**Подключение через SSH:**
```bash
ssh root@YOUR_SERVER_IP
```

Если используете SSH-ключ:
```bash
ssh -i /path/to/your/key.pem root@YOUR_SERVER_IP
```

---

## Установка необходимого ПО

### 3. Обновление системы

```bash
apt update && apt upgrade -y
```

### 4. Установка Node.js

```bash
# Установка Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверка версии
node --version
npm --version
```

### 5. Установка PostgreSQL

```bash
# Установка PostgreSQL
apt install -y postgresql postgresql-contrib

# Запуск и автозапуск
systemctl start postgresql
systemctl enable postgresql

# Создание базы данных и пользователя
sudo -u postgres psql << EOF
CREATE DATABASE olga_website;
CREATE USER olga_user WITH PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE olga_website TO olga_user;
\q
EOF
```

**Важно**: Замените `YOUR_SECURE_PASSWORD` на надежный пароль!

### 6. Установка MinIO (S3-совместимое хранилище)

```bash
# Создание директории для MinIO
mkdir -p /opt/minio/data
mkdir -p /opt/minio/config

# Скачивание MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
mv minio /usr/local/bin/

# Создание пользователя для MinIO
useradd -r -s /bin/false minio-user
chown -R minio-user:minio-user /opt/minio

# Создание systemd сервиса
cat > /etc/systemd/system/minio.service << 'EOF'
[Unit]
Description=MinIO Object Storage
After=network.target

[Service]
Type=simple
User=minio-user
Group=minio-user
Environment="MINIO_ROOT_USER=YOUR_MINIO_ACCESS_KEY"
Environment="MINIO_ROOT_PASSWORD=YOUR_MINIO_SECRET_KEY"
ExecStart=/usr/local/bin/minio server /opt/minio/data --console-address ":9001"
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Замена ключей доступа (ВАЖНО: используйте надежные ключи!)
sed -i 's/YOUR_MINIO_ACCESS_KEY/your-access-key-here/g' /etc/systemd/system/minio.service
sed -i 's/YOUR_MINIO_SECRET_KEY/your-secret-key-here/g' /etc/systemd/system/minio.service

# Запуск MinIO
systemctl daemon-reload
systemctl start minio
systemctl enable minio

# Проверка статуса
systemctl status minio
```

**Доступ к MinIO Console**: `http://YOUR_SERVER_IP:9001`

### 7. Установка Nginx

```bash
apt install -y nginx

# Запуск и автозапуск
systemctl start nginx
systemctl enable nginx
```

### 8. Установка PM2 (менеджер процессов Node.js)

```bash
npm install -g pm2
```

---

## Настройка проекта

### 9. Клонирование проекта на сервер

```bash
# Установка Git (если не установлен)
apt install -y git

# Клонирование репозитория
cd /opt
git clone YOUR_REPOSITORY_URL olga-website
cd olga-website

# Или загрузка через SCP с локальной машины:
# scp -r /path/to/local/project root@YOUR_SERVER_IP:/opt/olga-website
```

### 10. Настройка переменных окружения

```bash
cd /opt/olga-website/backend

# Создание файла .env
cat > .env << EOF
# База данных
DB_HOST=localhost
DB_PORT=5432
DB_NAME=olga_website
DB_USER=olga_user
DB_PASSWORD=YOUR_SECURE_PASSWORD

# JWT секрет (сгенерируйте случайную строку)
JWT_SECRET=YOUR_JWT_SECRET_HERE

# S3/MinIO настройки
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=your-access-key-here
S3_SECRET_KEY=your-secret-key-here
S3_BUCKET=olga-website-media
S3_REGION=us-east-1
S3_USE_SSL=false

# Порт сервера
PORT=3000

# Режим (production)
NODE_ENV=production
EOF
```

**Важно**: Замените все значения на реальные!

### 11. Инициализация базы данных

```bash
cd /opt/olga-website

# Запуск миграций
psql -U olga_user -d olga_website -f database/init.sql
psql -U olga_user -d olga_website -f database/migrations/001_initial_schema.sql

# Загрузка начальных данных (опционально)
psql -U olga_user -d olga_website -f database/seeds/001_initial_data.sql
```

### 12. Установка зависимостей и сборка

```bash
cd /opt/olga-website/backend
npm install --production

# Если есть frontend сборка
cd /opt/olga-website
npm install --production
```

### 13. Настройка MinIO bucket

1. Откройте MinIO Console: `http://YOUR_SERVER_IP:9001`
2. Войдите с учетными данными из `.env`
3. Создайте bucket с именем `olga-website-media`
4. Настройте политику доступа (Public Read для медиафайлов)

---

## Настройка Nginx

### 14. Создание конфигурации Nginx

```bash
cat > /etc/nginx/sites-available/olga-website << 'EOF'
# Редирект HTTP на HTTPS (после настройки SSL)
server {
    listen 80;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;
    
    # Временно - редирект на HTTPS будет после настройки SSL
    return 301 https://$server_name$request_uri;
}

# HTTPS конфигурация
server {
    listen 443 ssl http2;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;

    # SSL сертификаты (будут настроены в следующем шаге)
    ssl_certificate /etc/letsencrypt/live/YOUR_DOMAIN.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN.com/privkey.pem;

    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Логи
    access_log /var/log/nginx/olga-website-access.log;
    error_log /var/log/nginx/olga-website-error.log;

    # Максимальный размер загружаемых файлов
    client_max_body_size 100M;

    # Публичная часть (статичные файлы)
    location / {
        root /opt/olga-website/public;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # Админ-панель
    location /admin {
        alias /opt/olga-website/admin;
        try_files $uri $uri/ /admin/index.html;
    }

    # Общие ресурсы
    location /shared {
        alias /opt/olga-website/shared;
    }

    # Изображения
    location /img {
        alias /opt/olga-website/img;
    }

    # API бэкенда
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # MinIO (для доступа к медиафайлам)
    location /media {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Замените YOUR_DOMAIN.com на ваш домен
sed -i 's/YOUR_DOMAIN.com/your-domain.com/g' /etc/nginx/sites-available/olga-website

# Активация конфигурации
ln -s /etc/nginx/sites-available/olga-website /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
nginx -t

# Перезагрузка Nginx
systemctl reload nginx
```

### 15. Настройка SSL (Let's Encrypt)

```bash
# Установка Certbot
apt install -y certbot python3-certbot-nginx

# Получение сертификата (замените на ваш домен и email)
certbot --nginx -d your-domain.com -d www.your-domain.com --email your-email@example.com --agree-tos --non-interactive

# Автоматическое обновление сертификата
certbot renew --dry-run
```

---

## Запуск приложения

### 16. Запуск бэкенда через PM2

```bash
cd /opt/olga-website/backend

# Запуск приложения
pm2 start index.js --name olga-backend

# Сохранение конфигурации PM2
pm2 save

# Настройка автозапуска при перезагрузке сервера
pm2 startup
# Выполните команду, которую выведет PM2
```

### 17. Проверка работы

```bash
# Проверка статуса PM2
pm2 status

# Проверка логов
pm2 logs olga-backend

# Проверка работы API
curl http://localhost:3000/api/public/hero

# Проверка работы Nginx
curl http://localhost
```

---

## Настройка файрвола

### 18. Настройка UFW (Uncomplicated Firewall)

```bash
# Разрешение SSH
ufw allow 22/tcp

# Разрешение HTTP и HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Разрешение MinIO (только для внутреннего доступа)
# Не открывайте порт 9000 и 9001 публично!

# Включение файрвола
ufw enable

# Проверка статуса
ufw status
```

---

## Дополнительные настройки

### 19. Настройка резервного копирования

```bash
# Создание скрипта бэкапа
cat > /opt/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Бэкап базы данных
pg_dump -U olga_user olga_website > $BACKUP_DIR/db_$DATE.sql

# Бэкап файлов проекта
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /opt/olga-website

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

chmod +x /opt/backup.sh

# Добавление в cron (ежедневно в 2:00)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup.sh") | crontab -
```

### 20. Мониторинг

```bash
# Установка мониторинга PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Проверка деплоя

### 21. Финальная проверка

1. **Проверка домена**: Откройте `https://your-domain.com` в браузере
2. **Проверка API**: `https://your-domain.com/api/public/hero`
3. **Проверка админ-панели**: `https://your-domain.com/admin`
4. **Проверка загрузки файлов**: Попробуйте загрузить видео через админ-панель

---

## Полезные команды

### Управление приложением

```bash
# Просмотр логов
pm2 logs olga-backend

# Перезапуск
pm2 restart olga-backend

# Остановка
pm2 stop olga-backend

# Удаление из PM2
pm2 delete olga-backend
```

### Управление Nginx

```bash
# Перезагрузка конфигурации
systemctl reload nginx

# Проверка конфигурации
nginx -t

# Просмотр логов
tail -f /var/log/nginx/olga-website-error.log
```

### Управление базой данных

```bash
# Подключение к БД
psql -U olga_user -d olga_website

# Бэкап БД
pg_dump -U olga_user olga_website > backup.sql

# Восстановление БД
psql -U olga_user -d olga_website < backup.sql
```

---

## Решение проблем

### Проблема: Приложение не запускается

```bash
# Проверка логов PM2
pm2 logs olga-backend --lines 100

# Проверка переменных окружения
cd /opt/olga-website/backend
cat .env

# Проверка подключения к БД
psql -U olga_user -d olga_website -c "SELECT 1;"
```

### Проблема: Nginx возвращает 502 Bad Gateway

```bash
# Проверка, запущен ли бэкенд
pm2 status

# Проверка порта
netstat -tlnp | grep 3000

# Проверка логов Nginx
tail -f /var/log/nginx/olga-website-error.log
```

### Проблема: Не загружаются файлы

```bash
# Проверка MinIO
systemctl status minio

# Проверка доступа к MinIO
curl http://localhost:9000/minio/health/live

# Проверка bucket
# Откройте MinIO Console: http://YOUR_SERVER_IP:9001
```

---

## Безопасность

### Рекомендации по безопасности

1. **Измените пароли по умолчанию**
2. **Используйте SSH-ключи вместо паролей**
3. **Настройте fail2ban для защиты от брутфорса**
4. **Регулярно обновляйте систему**: `apt update && apt upgrade`
5. **Не открывайте порты MinIO (9000, 9001) публично**
6. **Используйте сильные пароли для БД и MinIO**
7. **Настройте регулярные бэкапы**

---

## Следующие шаги

1. Настройте DNS записи для вашего домена (A-запись на IP сервера)
2. Настройте мониторинг (например, UptimeRobot)
3. Настройте автоматические обновления безопасности
4. Настройте CDN для статических файлов (опционально)
5. Настройте резервное копирование в облачное хранилище

---

## Контакты и поддержка

- Документация Selectel: https://docs.selectel.com
- Поддержка Selectel: support@selectel.ru
