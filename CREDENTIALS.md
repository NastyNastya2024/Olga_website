# Учетные данные по умолчанию

## Админ-панель

**Email:** `admin@example.com`  
**Пароль:** `admin123`

⚠️ **ВАЖНО:** Это тестовые учетные данные! В production окружении обязательно измените пароль!

## База данных PostgreSQL

**Host:** `localhost`  
**Port:** `5432`  
**Database:** `olga_website`  
**User:** `postgres`  
**Password:** `postgres`

## MinIO (S3)

**Endpoint:** `http://localhost:9000`  
**Console:** `http://localhost:9001`  
**Access Key:** `minioadmin`  
**Secret Key:** `minioadmin`

## Как изменить пароль админа

### Вариант 1: Через SQL

```sql
-- Подключитесь к базе данных
psql -U postgres -d olga_website

-- Обновите пароль (замените NEW_PASSWORD_HASH на хэш нового пароля)
UPDATE users SET password = 'NEW_PASSWORD_HASH' WHERE email = 'admin@example.com';
```

### Вариант 2: Генерация нового хэша

Используйте Node.js скрипт для генерации bcrypt хэша:

```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('ваш_новый_пароль', 10);
console.log(hash);
```

Затем обновите пароль в базе данных используя полученный хэш.

## Создание нового пользователя

```sql
INSERT INTO users (email, password, name, role, status) 
VALUES (
    'user@example.com',
    '$2a$10$...', -- bcrypt хэш пароля
    'User Name',
    'student', -- или 'admin'
    'active'
);
```
