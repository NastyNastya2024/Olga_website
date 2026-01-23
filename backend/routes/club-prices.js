/**
 * Роуты для работы с ценами клуба
 */

const express = require('express');
const router = express.Router();
const { loadData, saveData } = require('../utils/data-storage');

/**
 * GET /api/admin/club/prices
 * Получить текущие цены клуба
 */
router.get('/', (req, res) => {
  // Всегда загружаем свежие данные из файла
  const clubPrices = loadData('clubPrices');
  res.json(clubPrices);
});

/**
 * PUT /api/admin/club/prices
 * Обновить цены клуба
 */
router.put('/', (req, res) => {
  console.log('📝 Получен запрос на обновление цен:', req.body);
  
  // Загружаем текущие данные из файла
  const clubPrices = loadData('clubPrices');
  
  const { price_1_month, price_3_months, price_6_months, description_1_month, description_3_months, description_6_months } = req.body;
  
  if (price_1_month !== undefined) {
    clubPrices.price_1_month = price_1_month ? parseFloat(price_1_month) : null;
  }
  if (price_3_months !== undefined) {
    clubPrices.price_3_months = price_3_months ? parseFloat(price_3_months) : null;
  }
  if (price_6_months !== undefined) {
    clubPrices.price_6_months = price_6_months ? parseFloat(price_6_months) : null;
  }
  
  if (description_1_month !== undefined) {
    clubPrices.description_1_month = String(description_1_month || '');
  }
  if (description_3_months !== undefined) {
    clubPrices.description_3_months = String(description_3_months || '');
  }
  if (description_6_months !== undefined) {
    clubPrices.description_6_months = String(description_6_months || '');
  }
  
  console.log('💾 Сохраняем данные:', clubPrices);
  const saved = saveData('clubPrices', clubPrices);
  
  if (!saved) {
    console.error('❌ Ошибка сохранения данных');
    return res.status(500).json({ error: 'Ошибка сохранения данных' });
  }
  
  console.log('✅ Данные успешно сохранены');
  res.json(clubPrices);
});

module.exports = router;
