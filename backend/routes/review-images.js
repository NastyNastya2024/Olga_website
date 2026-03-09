/**
 * Роуты для отзывов-скриншотов (фото отзывов для главной страницы)
 */

const express = require('express');
const router = express.Router();
const { loadData, saveData } = require('../utils/data-storage');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

function getReviewImages() {
  const data = loadData('reviewImages');
  return (data.items || []).sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
}

/**
 * GET /api/admin/review-images
 * Список всех отзывов-скриншотов
 */
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    res.json(getReviewImages());
  } catch (error) {
    console.error('Ошибка загрузки отзывов:', error);
    res.status(500).json({ error: 'Ошибка загрузки' });
  }
});

/**
 * POST /api/admin/review-images
 * Добавить отзыв (скриншот) — image_url обязателен
 */
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { image_url } = req.body;
    if (!image_url || typeof image_url !== 'string' || !image_url.trim()) {
      return res.status(400).json({ error: 'URL изображения обязателен' });
    }

    const data = loadData('reviewImages');
    const items = data.items || [];
    const nextId = data.nextId || 1;

    const newItem = {
      id: nextId,
      image_url: image_url.trim(),
      order: nextId,
      created_at: new Date().toISOString(),
    };

    items.push(newItem);
    saveData('reviewImages', { items, nextId: nextId + 1 });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Ошибка добавления отзыва:', error);
    res.status(500).json({ error: 'Ошибка добавления' });
  }
});

/**
 * DELETE /api/admin/review-images/:id
 * Удалить отзыв
 */
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = loadData('reviewImages');
    const items = (data.items || []).filter(item => item.id !== id);

    saveData('reviewImages', { items, nextId: data.nextId || 1 });
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления отзыва:', error);
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

module.exports = router;
