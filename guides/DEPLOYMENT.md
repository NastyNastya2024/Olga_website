# Развертывание PostgreSQL и S3

Это руководство поможет вам развернуть PostgreSQL и S3 (MinIO) для проекта.

## Требования

- Docker и Docker Compose установлены на вашей системе
- Порты 5432, 9000, 9001 свободны

## Быстрый старт

### 1. Запуск сервисов

```bash
# Запустить PostgreSQL и MinIO
docker-compose up -d

# Проверить статус
docker-compose ps
```

### 2. Проверка работы сервисов

**PostgreSQL:**
```bash
# Подключиться к базе данных
docker exec -it olga_postgres psql -U postgres -d olga_website

# Или использовать внешний клиент
# Host: localhost
# Port: 5432
# Database: olga_website
# User: postgres
# Password: postgres
```

**MinIO (S3):**
- S3 API: http://localhost:9000
- MinIO Console: http://localhost:9001
- Access Key: `minioadmin`
- Secret Key: `minioadmin`

### 3. Настройка MinIO

1. Откройте MinIO Console: http://localhost:9001
2. Войдите с учетными данными:
   - Username: `minioadmin`
   - Password: `minioadmin`
3. Bucket `olga-media` будет создан автоматически при первом запуске

### 4. Остановка сервисов

```bash
# Остановить сервисы
docker-compose down

# Остановить и удалить данные
docker-compose down -v
```

## Конфигурация

### Переменные окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Отредактируйте `.env` файл с нужными настройками.

### Изменение паролей

**PostgreSQL:**
Измените в `docker-compose.yml`:
```yaml
environment:
  POSTGRES_PASSWORD: ваш_новый_пароль
```

**MinIO:**
Измените в `docker-compose.yml`:
```yaml
environment:
  MINIO_ROOT_USER: ваш_пользователь
  MINIO_ROOT_PASSWORD: ваш_новый_пароль
```

## Использование в приложении

### Подключение к PostgreSQL

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'olga_website',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});
```

### Подключение к S3 (MinIO)

```javascript
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
  secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});
```

## Резервное копирование

### PostgreSQL

```bash
# Создать бэкап
docker exec olga_postgres pg_dump -U postgres olga_website > backup.sql

# Восстановить из бэкапа
docker exec -i olga_postgres psql -U postgres olga_website < backup.sql
```

### MinIO данные

Данные MinIO хранятся в Docker volume `olga_website_minio_data`.

## Мониторинг

### Логи

```bash
# Просмотр логов PostgreSQL
docker-compose logs postgres

# Просмотр логов MinIO
docker-compose logs minio

# Просмотр всех логов
docker-compose logs -f
```

### Health checks

Оба сервиса имеют health checks, которые можно проверить:

```bash
docker inspect olga_postgres | grep Health
docker inspect olga_minio | grep Health
```

## Troubleshooting

### Порт уже занят

Если порт занят, измените маппинг портов в `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"  # Использовать другой внешний порт
```

### Проблемы с правами доступа

Убедитесь, что Docker имеет права на создание volumes:

```bash
sudo chown -R $USER:$USER .
```

### Сброс базы данных

```bash
# Остановить и удалить volumes
docker-compose down -v

# Запустить заново
docker-compose up -d
```

## Production рекомендации

Для production окружения:

1. Измените все пароли по умолчанию
2. Используйте SSL для PostgreSQL
3. Настройте правильные права доступа для MinIO
4. Настройте регулярное резервное копирование
5. Используйте внешний S3 (AWS S3, DigitalOcean Spaces и т.д.) вместо MinIO
6. Настройте мониторинг и алерты
