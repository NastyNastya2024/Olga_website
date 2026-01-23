/**
 * Публичные роуты для мероприятий клуба
 */

const express = require('express');
const router = express.Router();
const { loadData } = require('../utils/data-storage');

let getEvents = null;

/**
 * Установить функцию получения мероприятий
 */
router.setEventsGetter = (eventsGetter) => {
  getEvents = eventsGetter;
};

/**
 * GET /api/public/club/events
 * Получить все мероприятия (публичный доступ)
 */
router.get('/', (req, res) => {
  try {
    let events = [];
    
    if (getEvents) {
      events = getEvents();
    } else {
      // Если геттер не установлен, загружаем напрямую
      const data = loadData('clubEvents');
      events = Array.isArray(data?.items) ? data.items : [];
    }
    
    // Фильтруем только опубликованные мероприятия
    const publicEvents = events.filter(event => event.status !== 'hidden');
    
    // Определяем статус для каждого мероприятия на основе даты
    const now = new Date();
    const eventsWithStatus = publicEvents.map(event => {
      let eventStatus = event.status || 'upcoming';
      
      // Если есть дата, определяем статус автоматически
      if (event.date) {
        try {
          const eventDate = new Date(event.date);
          if (eventDate < now) {
            eventStatus = 'past';
          } else {
            eventStatus = 'upcoming';
          }
        } catch (e) {
          // Если ошибка парсинга даты, оставляем исходный статус
        }
      }
      
      return {
        ...event,
        displayStatus: eventStatus
      };
    });
    
    // Сортируем: сначала предстоящие (по дате возрастание), потом прошедшие (по дате убывание)
    eventsWithStatus.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      
      if (a.displayStatus === 'upcoming' && b.displayStatus === 'past') return -1;
      if (a.displayStatus === 'past' && b.displayStatus === 'upcoming') return 1;
      
      if (a.displayStatus === 'upcoming') {
        return dateA - dateB; // По возрастанию для предстоящих
      } else {
        return dateB - dateA; // По убыванию для прошедших
      }
    });
    
    res.json(eventsWithStatus);
  } catch (error) {
    console.error('Ошибка в публичном роуте мероприятий:', error);
    res.status(500).json({ error: 'Ошибка загрузки мероприятий', message: error.message });
  }
});

module.exports = router;
