/**
 * Простой dev-сервер для разработки с поддержкой SPA
 * Используется для разработки фронтенда без настройки Apache/Nginx
 * 
 * Запуск: node backend/dev-server.js
 * Или: npm run dev:server (если добавить в package.json)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.DEV_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы для публичной части (корень сайта)
app.use('/', express.static(path.join(__dirname, '../public')));

// Статические файлы для админ-панели
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Статические файлы для shared ресурсов
app.use('/shared', express.static(path.join(__dirname, '../shared')));

// SPA Fallback для админ-панели
// ВСЕ запросы к /admin/* возвращают index.html
// ВАЖНО: Этот маршрут должен быть ПОСЛЕ статических файлов
app.get('/admin/*', (req, res) => {
  // Проверяем, не запрашивается ли статический файл
  const requestedPath = req.path;
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
  const isStaticFile = staticExtensions.some(ext => requestedPath.endsWith(ext));
  
  if (isStaticFile) {
    // Если это статический файл, отдаем его (express.static уже обработал)
    return res.status(404).send('File not found');
  }
  
  // Для всех остальных запросов возвращаем index.html
  res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// Fallback для корня
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`\n✨ Dev Server запущен!\n`);
  console.log(`📊 Админ-панель: http://localhost:${PORT}/admin`);
  console.log(`🌐 Публичный сайт: http://localhost:${PORT}`);
  console.log(`\n💡 Теперь обновление страницы (F5) работает корректно!\n`);
});
