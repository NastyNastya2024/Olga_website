/**
 * Роуты для работы с турами
 */

const express = require('express');
const router = express.Router();
const { loadData, saveData } = require('../utils/data-storage');

// Загружаем данные из файла при старте
let data = loadData('tours');
let tours = data.items || [];
let nextId = data.nextId || 1;

// Функция для сохранения данных
function persistData() {
  saveData('tours', { items: tours, nextId });
}

// Функция для получения всех туров (для публичного роута)
const getTours = () => tours;

/**
 * GET /api/admin/tours
 * Получить список всех туров
 */
router.get('/', (req, res) => {
  res.json(tours);
});

/**
 * GET /api/admin/tours/:id
 * Получить тур по ID
 */
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const tour = tours.find(t => t.id === id);
  
  if (!tour) {
    return res.status(404).json({ error: 'Тур не найден' });
  }
  
  res.json(tour);
});

/**
 * POST /api/admin/tours
 * Создать новый тур
 */
router.post('/', (req, res) => {
  const { title, description, start_date, end_date, location, program, price, booking_url, status, gallery } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Название тура обязательно' });
  }
  
  const newTour = {
    id: nextId++,
    title,
    description: description || '',
    start_date: start_date || null,
    end_date: end_date || null,
    location: location || '',
    program: program || '',
    price: price ? parseFloat(price) : null,
    booking_url: booking_url || '',
    status: status || 'upcoming',
    gallery: Array.isArray(gallery) ? gallery : [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  tours.push(newTour);
  persistData();
  
  res.status(201).json(newTour);
});

/**
 * PUT /api/admin/tours/:id
 * Обновить тур
 */
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const tourIndex = tours.findIndex(t => t.id === id);
  
  if (tourIndex === -1) {
    return res.status(404).json({ error: 'Тур не найден' });
  }
  
  const { title, description, start_date, end_date, location, program, price, booking_url, status, gallery } = req.body;
  
  tours[tourIndex] = {
    ...tours[tourIndex],
    title: title || tours[tourIndex].title,
    description: description !== undefined ? description : tours[tourIndex].description,
    start_date: start_date !== undefined ? start_date : tours[tourIndex].start_date,
    end_date: end_date !== undefined ? end_date : tours[tourIndex].end_date,
    location: location !== undefined ? location : tours[tourIndex].location,
    program: program !== undefined ? program : tours[tourIndex].program,
    price: price !== undefined ? (price ? parseFloat(price) : null) : tours[tourIndex].price,
    booking_url: booking_url !== undefined ? booking_url : tours[tourIndex].booking_url,
    status: status || tours[tourIndex].status,
    gallery: gallery !== undefined ? (Array.isArray(gallery) ? gallery : []) : tours[tourIndex].gallery,
    updated_at: new Date().toISOString(),
  };
  
  persistData();
  res.json(tours[tourIndex]);
});

/**
 * DELETE /api/admin/tours/:id
 * Удалить тур
 */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const tourIndex = tours.findIndex(t => t.id === id);
  
  if (tourIndex === -1) {
    return res.status(404).json({ error: 'Тур не найден' });
  }
  
  tours.splice(tourIndex, 1);
  persistData();
  
  res.json({ success: true, message: 'Тур удален' });
});

module.exports = { router, getTours };
