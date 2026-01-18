# Решение проблем

## Ошибка "Failed to fetch" при входе в админку

### Причина
Backend сервер не запущен или недоступен на порту 5000.

### Решение

1. **Запустите backend сервер:**

```bash
cd backend
npm install  # если еще не установлены зависимости
npm start
# или для разработки
npm run dev
```

2. **Проверьте, что сервер запущен:**

Откройте в браузере: http://localhost:5000/health

Должен вернуться ответ: `{"status":"ok"}`

3. **Проверьте настройки CORS в backend:**

Убедитесь, что в `backend/index.js` включен CORS:

```javascript
app.use(cors());
```

4. **Проверьте порт:**

Убедитесь, что backend запущен на порту 5000 (или измените `API_BASE_URL` в `shared/scripts/api.js`).

### Альтернативное решение

Если вы открываете HTML файлы напрямую через `file://`, браузер может блокировать запросы к `localhost`. 

**Вариант 1:** Используйте локальный веб-сервер:

```bash
# Python 3
python3 -m http.server 8000

# Или Node.js
npx http-server -p 8000
```

Затем откройте: http://localhost:8000/admin/index.html

**Вариант 2:** Настройте proxy в backend для статических файлов.

## Другие распространенные проблемы

### База данных не подключена

**Ошибка:** "Connection refused" или "ECONNREFUSED"

**Решение:**
1. Убедитесь, что PostgreSQL запущен через Docker:
```bash
docker-compose up -d postgres
```

2. Проверьте подключение:
```bash
docker exec -it olga_postgres psql -U postgres -d olga_website
```

### Пароль не работает

**Решение:**
1. Проверьте, что пользователь создан в базе:
```sql
SELECT email, role FROM users WHERE email = 'admin@example.com';
```

2. Если пользователя нет, выполните seeds:
```bash
psql -U postgres -d olga_website -f database/seeds/001_initial_data.sql
```

3. Если нужно сбросить пароль, используйте скрипт:
```bash
node scripts/generate-password-hash.js новый_пароль
```

### CORS ошибки

**Ошибка:** "Access-Control-Allow-Origin" в консоли браузера

**Решение:**
Убедитесь, что в backend включен CORS и разрешены нужные источники.

### Страница не загружается (SPA)

**Решение:**
1. Убедитесь, что открываете `admin/index.html` (не другие HTML файлы)
2. Проверьте консоль браузера на ошибки JavaScript
3. Убедитесь, что все скрипты загружаются правильно
