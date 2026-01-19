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
const uploadRoutes = require('./routes/upload');
const { router: videosRoutes, getVideos } = require('./routes/videos');
const publicVideosRoutes = require('./routes/public-videos');
const { router: toursRoutes, getTours } = require('./routes/tours');
const publicToursRoutes = require('./routes/public-tours');
const { router: blogRoutes, getPosts } = require('./routes/blog');
const publicBlogRoutes = require('./routes/public-blog');
const { router: reviewsRoutes, getReviews } = require('./routes/reviews');
const publicReviewsRoutes = require('./routes/public-reviews');
const clubPricesRoutes = require('./routes/club-prices');
const usersRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.DEV_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настраиваем публичные роуты
publicVideosRoutes.setVideosGetter(getVideos);
publicToursRoutes.setToursGetter(getTours);
publicBlogRoutes.setPostsGetter(getPosts);
publicReviewsRoutes.setReviewsGetter(getReviews);

// API роуты (должны быть ДО статических файлов)
app.use('/api/upload', uploadRoutes);
app.use('/api/admin/auth', authRoutes);
app.use('/api/admin/videos', videosRoutes);
app.use('/api/public/videos', publicVideosRoutes);
app.use('/api/admin/tours', toursRoutes);
app.use('/api/public/tours', publicToursRoutes);
app.use('/api/admin/blog', blogRoutes);
app.use('/api/public/blog', publicBlogRoutes);
app.use('/api/admin/reviews', reviewsRoutes);
app.use('/api/public/reviews', publicReviewsRoutes);
app.use('/api/admin/club/prices', clubPricesRoutes);
app.use('/api/admin/users', usersRoutes);

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

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Dev Server is running',
  });
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
  console.log(`📤 API для загрузки файлов: http://localhost:${PORT}/api/upload`);
  console.log(`\n💡 Теперь обновление страницы (F5) работает корректно!\n`);
});
