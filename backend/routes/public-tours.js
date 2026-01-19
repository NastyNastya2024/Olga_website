/**
 * Публичные роуты для туров (только опубликованные)
 */

const express = require('express');
const router = express.Router();

let getTours = () => [];

router.setToursGetter = (getter) => {
  getTours = getter;
};

/**
 * GET /api/public/tours
 * Получить список опубликованных туров
 */
router.get('/', (req, res) => {
  try {
    const allTours = getTours();
    
    // Фильтруем только предстоящие и текущие туры
    const publishedTours = allTours.filter(tour => 
      tour.status === 'upcoming' || tour.status === 'current'
    );
    
    // Сортируем по дате начала
    publishedTours.sort((a, b) => {
      const dateA = a.start_date ? new Date(a.start_date) : new Date(0);
      const dateB = b.start_date ? new Date(b.start_date) : new Date(0);
      return dateA - dateB;
    });
    
    res.json(publishedTours);
  } catch (error) {
    console.error('Ошибка получения публичных туров:', error);
    res.status(500).json({ error: 'Ошибка загрузки туров' });
  }
});

module.exports = router;
