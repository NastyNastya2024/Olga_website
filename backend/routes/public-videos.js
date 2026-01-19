/**
 * Публичные роуты для видео (только опубликованные)
 */

const express = require('express');
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
 */
router.get('/', (req, res) => {
  try {
    const allVideos = getVideos();
    
    // Фильтруем только опубликованные видео с открытым доступом
    const publishedVideos = allVideos.filter(video => 
      video.status === 'published' && video.access_type === 'open'
    );
    
    res.json(publishedVideos);
  } catch (error) {
    console.error('Ошибка получения публичных видео:', error);
    res.status(500).json({ error: 'Ошибка загрузки видео' });
  }
});

module.exports = router;
