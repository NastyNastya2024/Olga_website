/**
 * Роуты для работы с ценами клуба
 */

const express = require('express');
const router = express.Router();
const { loadData, saveData } = require('../utils/data-storage');

// Загружаем данные из файла при старте
let clubPrices = loadData('clubPrices');

/**
 * GET /api/admin/club/prices
 * Получить текущие цены клуба
 */
router.get('/', (req, res) => {
  res.json(clubPrices);
});

/**
 * PUT /api/admin/club/prices
 * Обновить цены клуба
 */
router.put('/', (req, res) => {
  const { price_1_month, price_3_months, price_6_months } = req.body;
  
  if (price_1_month !== undefined) {
    clubPrices.price_1_month = price_1_month ? parseFloat(price_1_month) : null;
  }
  if (price_3_months !== undefined) {
    clubPrices.price_3_months = price_3_months ? parseFloat(price_3_months) : null;
  }
  if (price_6_months !== undefined) {
    clubPrices.price_6_months = price_6_months ? parseFloat(price_6_months) : null;
  }
  
  saveData('clubPrices', clubPrices);
  res.json(clubPrices);
});

module.exports = router;
