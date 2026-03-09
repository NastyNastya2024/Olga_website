/**
 * Express сервер с интеграцией S3 и поддержкой SPA
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const uploadRoutes = require('./routes/upload');
const { router: videosRoutes, getVideos } = require('./routes/videos');
const publicVideosRoutes = require('./routes/public-videos');
const publicHeroRoutes = require('./routes/public-hero');
const { router: toursRoutes, getTours } = require('./routes/tours');
const publicToursRoutes = require('./routes/public-tours');
const { router: blogRoutes, getPosts } = require('./routes/blog');
const publicBlogRoutes = require('./routes/public-blog');
const { router: reviewsRoutes, getReviews } = require('./routes/reviews');
const publicReviewsRoutes = require('./routes/public-reviews');
const clubPricesRoutes = require('./routes/club-prices');
const { router: clubEventsRoutes, getEvents } = require('./routes/club-events');
const publicClubEventsRoutes = require('./routes/public-club-events');
const lessonTariffsRoutes = require('./routes/lesson-tariffs');
const publicClubTariffsRoutes = require('./routes/public-club-tariffs');
const pricingTariffsRoutes = require('./routes/pricing-tariffs');
const publicPricingTariffsRoutes = require('./routes/public-pricing-tariffs');
const usersRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const reviewImagesRoutes = require('./routes/review-images');
const publicReviewImagesRoutes = require('./routes/public-review-images');
const paymentRoutes = require('./routes/payment');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настраиваем публичные роуты
publicVideosRoutes.setVideosGetter(getVideos);
publicToursRoutes.setToursGetter(getTours);
publicBlogRoutes.setPostsGetter(getPosts);
publicReviewsRoutes.setReviewsGetter(getReviews);
if (publicClubEventsRoutes.setEventsGetter) {
    publicClubEventsRoutes.setEventsGetter(getEvents);
}

// API роуты (должны быть ДО статических файлов)
app.use('/api/upload', uploadRoutes);
app.use('/api/admin/auth', authRoutes);
app.use('/api/admin/videos', videosRoutes);
app.use('/api/public/videos', publicVideosRoutes);
app.use('/api/public/hero', publicHeroRoutes);
app.use('/api/admin/tours', toursRoutes);
app.use('/api/public/tours', publicToursRoutes);
app.use('/api/admin/blog', blogRoutes);
app.use('/api/public/blog', publicBlogRoutes);
app.use('/api/admin/reviews', reviewsRoutes);
app.use('/api/public/reviews', publicReviewsRoutes);
app.use('/api/admin/club/prices', clubPricesRoutes);
app.use('/api/admin/club/events', clubEventsRoutes);
console.log('✅ Роут /api/admin/club/events зарегистрирован');
app.use('/api/public/club/events', publicClubEventsRoutes);
app.use('/api/admin/club/lesson-tariffs', lessonTariffsRoutes);
app.use('/api/public/club/tariffs', publicClubTariffsRoutes);
app.use('/api/admin/pricing-tariffs', pricingTariffsRoutes);
app.use('/api/public/pricing-tariffs', publicPricingTariffsRoutes);
app.use('/api/admin/users', usersRoutes);
app.use('/api/admin/chat', chatRoutes);
app.use('/api/admin/review-images', reviewImagesRoutes);
app.use('/api/public/review-images', publicReviewImagesRoutes);
app.use('/api/payment', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
  });
});

// Статические файлы для видео (должно быть ДО других маршрутов)
app.use('/video', express.static(path.join(__dirname, '../video'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.mp4')) {
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Accept-Ranges', 'bytes');
        }
    }
}));

// Статические файлы для изображений
app.use('/img', express.static(path.join(__dirname, '../img')));

// Статические файлы для публичной части сайта (корень сайта)
app.use('/', express.static(path.join(__dirname, '../public')));

// Статические файлы для админ-панели (CSS, JS, изображения)
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Статические файлы для shared ресурсов
app.use('/shared', express.static(path.join(__dirname, '../shared')));

// SPA Fallback для админ-панели
// ВСЕ запросы к /admin/* должны возвращать index.html
// JS-роутер сам решит, что рендерить
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

// Fallback для корня (только для не-API запросов)
app.get('*', (req, res) => {
  // Не обрабатываем API запросы через fallback
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // Если запрос не к API и не к статическим файлам, отдаем публичную страницу
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📁 S3 endpoint: ${process.env.S3_ENDPOINT || 'http://localhost:9000'}`);
  console.log(`🌐 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`📄 Public site: http://localhost:${PORT}`);
});
