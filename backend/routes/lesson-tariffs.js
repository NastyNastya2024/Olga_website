/**
 * Роуты для работы с тарифами занятий
 */

const express = require('express');
const router = express.Router();
const { loadData, saveData } = require('../utils/data-storage');

// Загружаем данные из файла при старте
let lessonTariffs = loadData('lessonTariffs');

/**
 * GET /api/admin/club/lesson-tariffs
 * Получить все тарифы занятий
 */
router.get('/', (req, res) => {
  res.json(lessonTariffs);
});

/**
 * POST /api/admin/club/lesson-tariffs
 * Создать новый тариф
 */
router.post('/', (req, res) => {
  const { name, price, description, features } = req.body;
  
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Название и цена обязательны' });
  }
  
  const newId = lessonTariffs.items.length > 0 
    ? Math.max(...lessonTariffs.items.map(t => t.id)) + 1 
    : 1;
  
  const newTariff = {
    id: newId,
    name: String(name),
    price: parseFloat(price) || 0,
    description: String(description || ''),
    features: String(features || ''),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  lessonTariffs.items.push(newTariff);
  saveData('lessonTariffs', lessonTariffs);
  
  res.json(newTariff);
});

/**
 * PUT /api/admin/club/lesson-tariffs/:id
 * Обновить тариф
 */
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, price, description, features } = req.body;
  
  const index = lessonTariffs.items.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Тариф не найден' });
  }
  
  if (name !== undefined) lessonTariffs.items[index].name = String(name);
  if (price !== undefined) lessonTariffs.items[index].price = parseFloat(price) || 0;
  if (description !== undefined) lessonTariffs.items[index].description = String(description);
  if (features !== undefined) lessonTariffs.items[index].features = String(features);
  lessonTariffs.items[index].updated_at = new Date().toISOString();
  
  saveData('lessonTariffs', lessonTariffs);
  res.json(lessonTariffs.items[index]);
});

/**
 * DELETE /api/admin/club/lesson-tariffs/:id
 * Удалить тариф
 */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = lessonTariffs.items.findIndex(t => t.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Тариф не найден' });
  }
  
  lessonTariffs.items.splice(index, 1);
  saveData('lessonTariffs', lessonTariffs);
  
  res.json({ success: true });
});

module.exports = router;
