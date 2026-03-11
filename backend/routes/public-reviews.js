/**
 * Публичные роуты для отзывов (только опубликованные)
 */

const express = require('express');
const { transformMediaUrls } = require('../utils/transform-media-urls');
const router = express.Router();

let getReviews = () => [];

router.setReviewsGetter = (getter) => {
  getReviews = getter;
};

/**
 * GET /api/public/reviews
 * Получить список опубликованных отзывов
 */
router.get('/', (req, res) => {
  try {
    const allReviews = getReviews();
    
    // Фильтруем только опубликованные отзывы
    const publishedReviews = allReviews.filter(review => 
      review.status === 'published'
    );
    
    // Сортируем по дате создания (новые сначала)
    publishedReviews.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB - dateA;
    });
    
    res.json(transformMediaUrls(publishedReviews));
  } catch (error) {
    console.error('Ошибка получения публичных отзывов:', error);
    res.status(500).json({ error: 'Ошибка загрузки отзывов' });
  }
});

module.exports = router;
