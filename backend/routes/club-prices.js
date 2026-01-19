/**
 * Роуты для работы с ценами клуба
 */

const express = require('express');
const router = express.Router();

// Временное хранилище цен клуба (в реальном проекте использовать БД)
let clubPrices = {
  price_1_month: null,
  price_3_months: null,
  price_6_months: null,
};

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
  
  res.json(clubPrices);
});

module.exports = router;
