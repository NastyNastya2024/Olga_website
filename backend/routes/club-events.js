/**
 * Роуты для работы с мероприятиями клуба
 */

const express = require('express');
const router = express.Router();
const { loadData, saveData } = require('../utils/data-storage');

console.log('📝 Роутер club-events инициализирован');

// Загружаем данные из файла при старте
let data = loadData('clubEvents');
let events = Array.isArray(data?.items) ? data.items : [];
let nextId = data?.nextId || 1;

// Функция для сохранения данных
function persistData() {
  saveData('clubEvents', { items: events, nextId });
}

// Функция для получения всех мероприятий (для публичного роута)
const getEvents = () => events;

/**
 * GET /api/admin/club/events
 * Получить список всех мероприятий
 */
router.get('/', (req, res) => {
  res.json(events);
});

/**
 * POST /api/admin/club/events
 * Создать новое мероприятие
 */
router.post('/', (req, res) => {
  console.log('POST /api/admin/club/events - получен запрос');
  console.log('Body:', req.body);
  
  const { title, description, date, status, cover, images } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Название мероприятия обязательно' });
  }
  
  const newEvent = {
    id: nextId++,
    title,
    description: description || '',
    date: date || null,
    status: status || 'upcoming',
    cover: cover || null,
    images: Array.isArray(images) ? images : [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  events.push(newEvent);
  persistData();
  
  res.status(201).json(newEvent);
});

/**
 * GET /api/admin/club/events/:id
 * Получить мероприятие по ID
 */
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const event = events.find(e => e.id === id);
  
  if (!event) {
    return res.status(404).json({ error: 'Мероприятие не найдено' });
  }
  
  res.json(event);
});

/**
 * PUT /api/admin/club/events/:id
 * Обновить мероприятие
 */
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const eventIndex = events.findIndex(e => e.id === id);
  
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Мероприятие не найдено' });
  }
  
  const { title, description, date, status, cover, images } = req.body;
  
  events[eventIndex] = {
    ...events[eventIndex],
    title: title || events[eventIndex].title,
    description: description !== undefined ? description : events[eventIndex].description,
    date: date !== undefined ? date : events[eventIndex].date,
    status: status || events[eventIndex].status,
    cover: cover !== undefined ? cover : events[eventIndex].cover,
    images: images !== undefined ? (Array.isArray(images) ? images : []) : (events[eventIndex].images || []),
    updated_at: new Date().toISOString(),
  };
  
  persistData();
  res.json(events[eventIndex]);
});

/**
 * DELETE /api/admin/club/events/:id
 * Удалить мероприятие
 */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const eventIndex = events.findIndex(e => e.id === id);
  
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Мероприятие не найдено' });
  }
  
  events.splice(eventIndex, 1);
  persistData();
  
  res.json({ success: true, message: 'Мероприятие удалено' });
});

module.exports = { router, getEvents };
