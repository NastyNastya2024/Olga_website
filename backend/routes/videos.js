/**
 * Роуты для работы с видео
 */

const express = require('express');
const router = express.Router();

// Временное хранилище видео (в реальном проекте использовать БД)
let videos = [];
let nextId = 1;

// Функция для получения всех видео (для публичного роута)
const getVideos = () => videos;

/**
 * GET /api/admin/videos
 * Получить список всех видео
 */
router.get('/', (req, res) => {
  res.json(videos);
});

/**
 * GET /api/admin/videos/:id
 * Получить видео по ID
 */
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const video = videos.find(v => v.id === id);
  
  if (!video) {
    return res.status(404).json({ error: 'Видео не найдено' });
  }
  
  res.json(video);
});

/**
 * POST /api/admin/videos
 * Создать новое видео
 */
router.post('/', (req, res) => {
  const { title, description, video_url, status, access_type } = req.body;
  
  if (!title || !video_url) {
    return res.status(400).json({ error: 'Название и URL видео обязательны' });
  }
  
  const newVideo = {
    id: nextId++,
    title,
    description: description || '',
    video_url,
    status: status || 'published',
    access_type: access_type || 'open',
    category: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  videos.push(newVideo);
  
  res.status(201).json(newVideo);
});

/**
 * PUT /api/admin/videos/:id
 * Обновить видео
 */
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const videoIndex = videos.findIndex(v => v.id === id);
  
  if (videoIndex === -1) {
    return res.status(404).json({ error: 'Видео не найдено' });
  }
  
  const { title, description, video_url, status, access_type } = req.body;
  
  videos[videoIndex] = {
    ...videos[videoIndex],
    title: title || videos[videoIndex].title,
    description: description !== undefined ? description : videos[videoIndex].description,
    video_url: video_url || videos[videoIndex].video_url,
    status: status || videos[videoIndex].status,
    access_type: access_type || videos[videoIndex].access_type,
    updated_at: new Date().toISOString(),
  };
  
  res.json(videos[videoIndex]);
});

/**
 * DELETE /api/admin/videos/:id
 * Удалить видео
 */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const videoIndex = videos.findIndex(v => v.id === id);
  
  if (videoIndex === -1) {
    return res.status(404).json({ error: 'Видео не найдено' });
  }
  
  videos.splice(videoIndex, 1);
  
  res.json({ success: true, message: 'Видео удалено' });
});

module.exports = { router, getVideos };
