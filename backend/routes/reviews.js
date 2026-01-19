/**
 * Роуты для работы с отзывами клуба
 */

const express = require('express');
const router = express.Router();

// Временное хранилище отзывов (в реальном проекте использовать БД)
let reviews = [];
let nextId = 1;

// Функция для получения всех отзывов (для публичного роута)
const getReviews = () => reviews;

/**
 * GET /api/admin/reviews
 * Получить список всех отзывов
 */
router.get('/', (req, res) => {
  res.json(reviews);
});

/**
 * GET /api/admin/reviews/:id
 * Получить отзыв по ID
 */
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const review = reviews.find(r => r.id === id);
  
  if (!review) {
    return res.status(404).json({ error: 'Отзыв не найден' });
  }
  
  res.json(review);
});

/**
 * POST /api/admin/reviews
 * Создать новый отзыв
 */
router.post('/', (req, res) => {
  const { author_name, author_photo, rating, text, status } = req.body;
  
  if (!author_name || !text) {
    return res.status(400).json({ error: 'Имя автора и текст отзыва обязательны' });
  }
  
  const newReview = {
    id: nextId++,
    author_name,
    author_photo: author_photo || null,
    rating: rating ? parseInt(rating) : 5,
    text,
    status: status || 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  reviews.push(newReview);
  
  res.status(201).json(newReview);
});

/**
 * PUT /api/admin/reviews/:id
 * Обновить отзыв
 */
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const reviewIndex = reviews.findIndex(r => r.id === id);
  
  if (reviewIndex === -1) {
    return res.status(404).json({ error: 'Отзыв не найден' });
  }
  
  const { author_name, author_photo, rating, text, status } = req.body;
  
  reviews[reviewIndex] = {
    ...reviews[reviewIndex],
    author_name: author_name || reviews[reviewIndex].author_name,
    author_photo: author_photo !== undefined ? author_photo : reviews[reviewIndex].author_photo,
    rating: rating !== undefined ? parseInt(rating) : reviews[reviewIndex].rating,
    text: text || reviews[reviewIndex].text,
    status: status || reviews[reviewIndex].status,
    updated_at: new Date().toISOString(),
  };
  
  res.json(reviews[reviewIndex]);
});

/**
 * DELETE /api/admin/reviews/:id
 * Удалить отзыв
 */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const reviewIndex = reviews.findIndex(r => r.id === id);
  
  if (reviewIndex === -1) {
    return res.status(404).json({ error: 'Отзыв не найден' });
  }
  
  reviews.splice(reviewIndex, 1);
  
  res.json({ success: true, message: 'Отзыв удален' });
});

module.exports = { router, getReviews };
