# Пошаговый план деплоя проекта на Yandex Cloud

## Информация о вашей ВМ

- **IP адрес**: 158.160.192.242
- **Пользователь**: admin
- **ОС**: Ubuntu 24.04 LTS
- **Конфигурация**: 2 vCPU, 4 GB RAM, 20 GB SSD
- **Зона доступности**: ru-central1-d

## Подключение к серверу

### ⚠️ Если получаете ошибку "Permission denied (publickey)"

Сначала настройте SSH-ключ. См. подробную инструкцию: **`guides/SSH_SETUP_YANDEX.md`**

**Быстрое решение:**

1. Создайте SSH-ключ:
```bash
cd /Users/a1/Documents/GitHub/Olga_website
./scripts/setup-ssh-key.sh
```

2. Скопируйте показанный публичный ключ

3. Добавьте ключ в Yandex Cloud Console:
   - Откройте https://console.cloud.yandex.ru
   - Compute Cloud → Виртуальные машины
   - Выберите вашу ВМ → SSH-ключи → Добавить SSH-ключ

4. Подключитесь:
```bash
ssh -i ~/.ssh/yandex_cloud admin@158.160.192.242
```

### Подключение после настройки ключа

```bash
ssh -i ~/.ssh/yandex_cloud admin@158.160.192.242
```

Или если настроили SSH config:
```bash
ssh yandex-olga
```

---

## Шаг 1: Обновление системы

```bash
sudo apt update && sudo apt upgrade -y
```

---

## Шаг 2: Установка Node.js

```bash
# Установка Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Проверка версии
node --version
npm --version
```

Ожидаемый результат: Node.js v20.x.x, npm 10.x.x

---

## Шаг 3: Установка PostgreSQL

```bash
# Установка PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Запуск и автозапуск
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Создание базы данных и пользователя
sudo -u postgres psql << EOF
CREATE DATABASE olga_website;
CREATE USER olga_user WITH PASSWORD 'YOUR_SECURE_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE olga_website TO olga_user;
ALTER USER olga_user CREATEDB;
\q
EOF
```

**⚠️ ВАЖНО**: Замените `YOUR_SECURE_PASSWORD_HERE` на надежный пароль! Сохраните его, он понадобится для настройки `.env` файла.

---

## Шаг 4: Установка Docker и Docker Compose

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавление пользователя admin в группу docker
sudo usermod -aG docker admin

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Проверка установки
docker --version
docker-compose --version
```

**Примечание**: После добавления в группу docker нужно переподключиться к SSH или выполнить `newgrp docker`.

---

## Шаг 5: Установка MinIO через Docker Compose

```bash
# Переходим в домашнюю директорию
cd ~

# Создаем директорию для проекта (если еще не создана)
mkdir -p ~/olga-website
cd ~/olga-website

# Создаем docker-compose.yml для MinIO
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
      - "9000:9000"  # S3 API
      - "9001:9001"  # MinIO Console
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

# Запуск MinIO
docker-compose up -d

# Проверка статуса
docker-compose ps
```

**⚠️ ВАЖНО**: В production измените пароли MinIO (`minioadmin123` на более надежный)!

**Доступ к MinIO Console**: `http://158.160.192.242:9001`
- Username: `minioadmin`
- Password: `minioadmin123`

---

## Шаг 6: Загрузка проекта на сервер

### Вариант A: Через Git (если проект в репозитории)

```bash
# Установка Git
sudo apt install -y git

# Клонирование репозитория
cd ~
git clone YOUR_REPOSITORY_URL olga-website
cd olga-website
```

### Вариант B: Через SCP с локальной машины

На вашем локальном компьютере выполните:

```bash
# Из директории проекта
scp -r /Users/a1/Documents/GitHub/Olga_website admin@158.160.192.242:~/olga-website
```

Затем на сервере:

```bash
cd ~/olga-website
```

---

## Шаг 7: Настройка переменных окружения

```bash
cd ~/olga-website/backend

# Создание файла .env
cat > .env << EOF
# База данных
DB_HOST=localhost
DB_PORT=5432
DB_NAME=olga_website
DB_USER=olga_user
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE

# JWT секрет (сгенерируйте случайную строку)
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

# Режим (production)
NODE_ENV=production
EOF

# Проверка содержимого
cat .env
```

**⚠️ ВАЖНО**: 
- Замените `YOUR_SECURE_PASSWORD_HERE` на пароль, который вы использовали при создании пользователя PostgreSQL
- Сохраните JWT_SECRET в безопасном месте

---

## Шаг 8: Инициализация базы данных

```bash
cd ~/olga-website

# Применение миграций
sudo -u postgres psql -d olga_website -f database/init.sql

# Если есть дополнительные миграции
if [ -f "database/migrations/001_initial_schema.sql" ]; then
    sudo -u postgres psql -d olga_website -f database/migrations/001_initial_schema.sql
fi

# Если есть начальные данные (опционально)
if [ -f "database/seeds/001_initial_data.sql" ]; then
    sudo -u postgres psql -d olga_website -f database/seeds/001_initial_data.sql
fi

# Проверка подключения
sudo -u postgres psql -d olga_website -c "\dt"
```

---

## Шаг 9: Установка зависимостей

```bash
cd ~/olga-website/backend

# Установка зависимостей
npm install --production

# Проверка установки
npm list --depth=0
```

---

## Шаг 10: Установка PM2 (менеджер процессов)

```bash
# Установка PM2 глобально
sudo npm install -g pm2

# Проверка установки
pm2 --version
```

---

## Шаг 11: Запуск приложения через PM2

```bash
cd ~/olga-website/backend

# Запуск приложения
pm2 start index.js --name olga-backend

# Сохранение конфигурации PM2
pm2 save

# Настройка автозапуска при перезагрузке сервера
pm2 startup
# Выполните команду, которую выведет PM2 (обычно что-то вроде: sudo env PATH=... pm2 startup systemd -u admin --hp /home/admin)

# Проверка статуса
pm2 status
pm2 logs olga-backend --lines 50
```

---

## Шаг 12: Установка и настройка Nginx

```bash
# Установка Nginx
sudo apt install -y nginx

# Создание конфигурации для сайта
sudo tee /etc/nginx/sites-available/olga-website > /dev/null << 'EOF'
server {
    listen 80;
    server_name 158.160.192.242;

    # Максимальный размер загружаемых файлов
    client_max_body_size 500M;

    # Логи
    access_log /var/log/nginx/olga-website-access.log;
    error_log /var/log/nginx/olga-website-error.log;

    # Публичная часть (статичные файлы)
    location / {
        root /home/admin/olga-website/public;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # Админ-панель
    location /admin {
        alias /home/admin/olga-website/admin;
        try_files $uri $uri/ /admin/index.html;
    }

    # Общие ресурсы
    location /shared {
        alias /home/admin/olga-website/shared;
    }

    # Изображения
    location /img {
        alias /home/admin/olga-website/img;
    }

    # Видео (если есть локальная папка)
    location /video {
        alias /home/admin/olga-website/video;
    }

    # API бэкенда
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # MinIO (для доступа к медиафайлам через Nginx)
    location /media {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/olga-website /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t

# Перезагрузка Nginx
sudo systemctl reload nginx
sudo systemctl enable nginx

# Проверка статуса
sudo systemctl status nginx
```

---

## Шаг 13: Настройка файрвола

```bash
# Установка UFW (если не установлен)
sudo apt install -y ufw

# Разрешение SSH
sudo ufw allow 22/tcp

# Разрешение HTTP и HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Включение файрвола
sudo ufw --force enable

# Проверка статуса
sudo ufw status
```

**⚠️ ВАЖНО**: Не открывайте порты MinIO (9000, 9001) публично! Они должны быть доступны только локально.

---

## Шаг 14: Проверка работы

### Проверка PM2

```bash
pm2 status
pm2 logs olga-backend --lines 20
```

### Проверка API

```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/public/videos
```

### Проверка через браузер

Откройте в браузере:
- **Публичный сайт**: http://158.160.192.242
- **Админ-панель**: http://158.160.192.242/admin
- **API Health**: http://158.160.192.242/api/public/videos
- **MinIO Console**: http://158.160.192.242:9001

---

## Шаг 15: Настройка SSL (опционально, но рекомендуется)

Если у вас есть домен, настройте SSL через Let's Encrypt:

```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение сертификата (замените на ваш домен)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com --email your-email@example.com --agree-tos --non-interactive

# Автоматическое обновление сертификата
sudo certbot renew --dry-run
```

После настройки SSL обновите конфигурацию Nginx для использования HTTPS.

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

# Мониторинг
pm2 monit
```

### Управление Nginx

```bash
# Перезагрузка конфигурации
sudo systemctl reload nginx

# Проверка конфигурации
sudo nginx -t

# Просмотр логов
sudo tail -f /var/log/nginx/olga-website-error.log
sudo tail -f /var/log/nginx/olga-website-access.log
```

### Управление базой данных

```bash
# Подключение к БД
sudo -u postgres psql -d olga_website

# Бэкап БД
sudo -u postgres pg_dump olga_website > ~/backup_$(date +%Y%m%d).sql

# Восстановление БД
sudo -u postgres psql -d olga_website < ~/backup.sql
```

### Управление MinIO

```bash
# Просмотр логов
docker logs olga_minio

# Перезапуск
cd ~/olga-website
docker-compose restart minio

# Остановка
docker-compose stop minio

# Запуск
docker-compose start minio
```

---

## Решение проблем

### Проблема: Приложение не запускается

```bash
# Проверка логов PM2
pm2 logs olga-backend --lines 100

# Проверка переменных окружения
cd ~/olga-website/backend
cat .env

# Проверка подключения к БД
sudo -u postgres psql -d olga_website -c "SELECT 1;"

# Проверка порта
sudo netstat -tlnp | grep 5000
```

### Проблема: Nginx возвращает 502 Bad Gateway

```bash
# Проверка, запущен ли бэкенд
pm2 status

# Проверка порта
sudo netstat -tlnp | grep 5000

# Проверка логов Nginx
sudo tail -f /var/log/nginx/olga-website-error.log

# Проверка логов PM2
pm2 logs olga-backend
```

### Проблема: Не загружаются файлы

```bash
# Проверка MinIO
docker ps | grep minio
docker logs olga_minio

# Проверка доступа к MinIO
curl http://localhost:9000/minio/health/live

# Проверка bucket через MinIO Console
# Откройте: http://158.160.192.242:9001
```

### Проблема: Ошибка прав доступа

```bash
# Проверка прав на директории
ls -la ~/olga-website

# Исправление прав (если нужно)
sudo chown -R admin:admin ~/olga-website
chmod -R 755 ~/olga-website
```

---

## Настройка резервного копирования

```bash
# Создание скрипта бэкапа
cat > ~/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/admin/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Бэкап базы данных
sudo -u postgres pg_dump olga_website > $BACKUP_DIR/db_$DATE.sql

# Бэкап файлов проекта
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /home/admin/olga-website --exclude='node_modules' --exclude='.git'

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x ~/backup.sh

# Добавление в cron (ежедневно в 2:00)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/admin/backup.sh") | crontab -
```

---

## Безопасность

### Рекомендации по безопасности

1. **Измените пароли по умолчанию**
   - PostgreSQL пароль пользователя `olga_user`
   - MinIO root пароль (`minioadmin123`)

2. **Используйте SSH-ключи вместо паролей**

3. **Настройте fail2ban для защиты от брутфорса**
   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

4. **Регулярно обновляйте систему**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

5. **Не открывайте порты MinIO (9000, 9001) публично**

6. **Используйте сильные пароли для БД и MinIO**

7. **Настройте регулярные бэкапы**

---

## Мониторинг

### Настройка PM2 мониторинга логов

```bash
# Установка модуля ротации логов
pm2 install pm2-logrotate

# Настройка
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## Следующие шаги

1. ✅ Настройте DNS записи для вашего домена (A-запись на IP 158.160.192.242)
2. ✅ Настройте SSL сертификат через Let's Encrypt
3. ✅ Настройте мониторинг (например, UptimeRobot)
4. ✅ Настройте автоматические обновления безопасности
5. ✅ Настройте резервное копирование в Yandex Object Storage (опционально)

---

## Контакты и поддержка

- Документация Yandex Cloud: https://cloud.yandex.ru/docs
- Поддержка Yandex Cloud: https://cloud.yandex.ru/support

---

## Быстрая проверка деплоя

Выполните эти команды для проверки всех компонентов:

```bash
# Проверка Node.js
node --version

# Проверка PostgreSQL
sudo systemctl status postgresql

# Проверка MinIO
docker ps | grep minio

# Проверка PM2
pm2 status

# Проверка Nginx
sudo systemctl status nginx

# Проверка API
curl http://localhost:5000/health

# Проверка через браузер
echo "Откройте: http://158.160.192.242"
```

Все должно работать! 🎉
