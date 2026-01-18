# План очистки админ-панели для SPA

## Текущая ситуация

Админка работает как SPA через `index.html`, но остались старые файлы от предыдущей реализации.

## Что нужно удалить

### ❌ Старые HTML файлы (не нужны для SPA):
- `blog.html` - заменен на `/blog` маршрут
- `dashboard.html` - заменен на `/dashboard` маршрут  
- `login.html` - заменен на `/login` маршрут
- `students.html` - заменен на `/students` маршрут
- `tours.html` - заменен на `/tours` маршрут
- `videos.html` - заменен на `/videos` маршрут

### ❌ Старые JS файлы (дублируют функционал из pages/):
- `scripts/blog.js` - функционал в `scripts/pages/blog.js`
- `scripts/dashboard.js` - функционал в `scripts/app.js` (DashboardPage)
- `scripts/login.js` - функционал в `scripts/app.js` (LoginPage)
- `scripts/students.js` - функционал в `scripts/pages/students.js`
- `scripts/tours.js` - функционал в `scripts/pages/tours.js`
- `scripts/videos.js` - функционал в `scripts/pages/videos.js`

## Что оставить

### ✅ Основные файлы SPA:
- `index.html` - единственная точка входа
- `scripts/app.js` - главный файл приложения
- `scripts/router.js` - роутинг
- `scripts/guards.js` - защита маршрутов

### ✅ Модули страниц:
- `scripts/pages/videos.js` - страница видео (с загрузкой файлов)
- `scripts/pages/students.js` - страница учеников
- `scripts/pages/tours.js` - страница туров
- `scripts/pages/blog.js` - страница блога

### ✅ Стили:
- `styles/admin.css` - основные стили
- `styles/modal.css` - стили модальных окон

## Функционал загрузки видео

✅ **Уже реализован** в `scripts/pages/videos.js`:
- Форма загрузки файла через `<input type="file">`
- Прогресс-бар загрузки
- Автоматическое заполнение URL после загрузки
- Интеграция с API `/api/upload`

## После очистки структура будет:

```
admin/
├── index.html              # Единственная точка входа SPA
├── scripts/
│   ├── app.js             # Главный файл приложения
│   ├── router.js           # Роутинг
│   ├── guards.js           # Защита маршрутов
│   └── pages/              # Модули страниц
│       ├── videos.js       # Видео (с загрузкой файлов)
│       ├── students.js    # Ученики
│       ├── tours.js        # Туры
│       └── blog.js         # Блог
├── styles/
│   ├── admin.css          # Основные стили
│   └── modal.css          # Стили модальных окон
└── README.md              # Документация
```

## Преимущества

1. ✅ Чистая структура - только нужные файлы
2. ✅ Один вход - `index.html`
3. ✅ Модульность - каждая страница в отдельном модуле
4. ✅ Загрузка видео работает через SPA
5. ✅ Легче поддерживать и развивать
