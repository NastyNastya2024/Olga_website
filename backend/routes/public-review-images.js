/**
 * Публичный API для отзывов-скриншотов (главная страница)
 */

const express = require('express');
const router = express.Router();
const { loadData } = require('../utils/data-storage');
const { transformMediaUrls } = require('../utils/transform-media-urls');

/**
 * GET /api/public/review-images
 * Список отзывов-скриншотов для главной
 */
router.get('/', (req, res) => {
  try {
    const data = loadData('reviewImages');
    const items = (data.items || []).sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
    res.json(transformMediaUrls(items));
  } catch (error) {
    console.error('Ошибка загрузки отзывов:', error);
    res.status(500).json({ error: 'Ошибка загрузки' });
  }
});

module.exports = router;
