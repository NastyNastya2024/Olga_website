/**
 * Роуты для работы с тарифами на главной странице
 */

const express = require('express');
const router = express.Router();
const { loadData, saveData } = require('../utils/data-storage');

/**
 * GET /api/admin/pricing-tariffs
 * Получить все тарифы
 */
router.get('/', (req, res) => {
  const pricingTariffs = loadData('pricingTariffs');
  res.json(pricingTariffs);
});

/**
 * POST /api/admin/pricing-tariffs
 * Создать новый тариф
 */
router.post('/', (req, res) => {
  const { name, price, description, is_popular } = req.body;
  
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Название и цена обязательны' });
  }
  
  const pricingTariffs = loadData('pricingTariffs');
  const newId = pricingTariffs.items.length > 0 
    ? Math.max(...pricingTariffs.items.map(t => t.id)) + 1 
    : 1;
  
  const newTariff = {
    id: newId,
    name: String(name),
    price: String(price),
    description: String(description || ''),
    is_popular: Boolean(is_popular || false),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  pricingTariffs.items.push(newTariff);
  pricingTariffs.nextId = newId + 1;
  saveData('pricingTariffs', pricingTariffs);
  
  res.json(newTariff);
});

/**
 * PUT /api/admin/pricing-tariffs/:id
 * Обновить тариф
 */
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, price, description, is_popular } = req.body;
  
  const pricingTariffs = loadData('pricingTariffs');
  const index = pricingTariffs.items.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Тариф не найден' });
  }
  
  if (name !== undefined) pricingTariffs.items[index].name = String(name);
  if (price !== undefined) pricingTariffs.items[index].price = String(price);
  if (description !== undefined) pricingTariffs.items[index].description = String(description);
  if (is_popular !== undefined) pricingTariffs.items[index].is_popular = Boolean(is_popular);
  pricingTariffs.items[index].updated_at = new Date().toISOString();
  
  saveData('pricingTariffs', pricingTariffs);
  res.json(pricingTariffs.items[index]);
});

/**
 * DELETE /api/admin/pricing-tariffs/:id
 * Удалить тариф
 */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const pricingTariffs = loadData('pricingTariffs');
  const index = pricingTariffs.items.findIndex(t => t.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Тариф не найден' });
  }
  
  pricingTariffs.items.splice(index, 1);
  saveData('pricingTariffs', pricingTariffs);
  
  res.json({ success: true });
});

module.exports = router;
