/**
 * Публичные роуты для видео (только опубликованные)
 */

const express = require('express');
const { transformMediaUrls } = require('../utils/transform-media-urls');
const router = express.Router();

// Получаем доступ к массиву видео из роута videos
// Это временное решение, в реальном проекте использовать БД
let getVideos = () => [];

// Функция для установки функции получения видео
// Будет вызвана из index.js или dev-server.js
router.setVideosGetter = (getter) => {
  getVideos = getter;
};

/**
 * GET /api/public/videos
 * Получить список опубликованных видео для публичной части
 * Поддерживает фильтрацию по категории через query параметр ?category=blog_1
 */
router.get('/', (req, res) => {
  try {
    const allVideos = getVideos();
    const category = req.query.category;
    
    // Фильтруем только опубликованные с открытым доступом (как в БД по умолчанию)
    let publishedVideos = allVideos.filter(video => {
      const status = video.status != null ? video.status : 'published';
      const access = video.access_type != null ? video.access_type : 'open';
      return status === 'published' && access === 'open';
    });
    
    // Если указана категория, фильтруем по ней
    if (category) {
      publishedVideos = publishedVideos.filter(video => 
        video.category === category
      );
    }
    
    res.json(transformMediaUrls(publishedVideos));
  } catch (error) {
    console.error('Ошибка получения публичных видео:', error);
    res.status(500).json({ error: 'Ошибка загрузки видео' });
  }
});

module.exports = router;
