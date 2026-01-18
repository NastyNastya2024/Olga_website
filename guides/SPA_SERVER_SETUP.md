# Настройка сервера для SPA админки

## Проблема

При прямом открытии URL типа `/admin/videos` сервер пытается найти файл `videos.html`, которого нет, так как это SPA приложение.

## Решение

### Вариант 1: Использовать правильный URL (рекомендуется)

**Всегда открывайте:** `admin/index.html` или `admin/`

Роутер автоматически обработает маршрут из URL и покажет нужную страницу.

**Примеры:**
- ✅ `http://localhost:5500/admin/index.html` → откроет логин
- ✅ `http://localhost:5500/admin/index.html#/videos` → откроет видео (если используете hash routing)
- ✅ `http://localhost:5500/admin/` → откроет логин

### Вариант 2: Настроить сервер для SPA

#### Для Live Server (VS Code)

Создайте файл `.vscode/settings.json`:

```json
{
    "liveServer.settings.port": 5500,
    "liveServer.settings.root": "/admin",
    "liveServer.settings.CustomBrowser": "chrome"
}
```

#### Для Apache

Файл `.htaccess` уже создан в папке `admin/`. Убедитесь, что mod_rewrite включен.

#### Для Nginx

```nginx
location /admin {
    try_files $uri $uri/ /admin/index.html;
}
```

#### Для Node.js Express

```javascript
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});
```

#### Для Python HTTP Server

Используйте простой сервер с обработкой SPA или настройте редирект.

### Вариант 3: Использовать Hash Routing

Если сервер не поддерживает rewrite, можно использовать hash routing:

```javascript
// В router.js изменить:
window.location.hash = '#/videos';
// Вместо:
window.history.pushState({}, '', '/admin/videos');
```

## Текущая настройка

Роутер настроен на обработку путей вида `/admin/videos`. Если вы открываете напрямую такой URL:

1. **Если сервер настроен правильно** → вернет `index.html`, роутер обработает путь
2. **Если сервер не настроен** → получите ошибку "Cannot GET /admin/videos"

## Рекомендация

**Используйте:** `admin/index.html` как точку входа, затем навигация работает через роутер без перезагрузки страницы.
