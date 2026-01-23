/**
 * Публичные роуты для тарифов клуба
 */

const express = require('express');
const router = express.Router();
const { loadData } = require('../utils/data-storage');

/**
 * GET /api/public/club/tariffs
 * Получить все тарифы (публичный доступ)
 */
router.get('/', (req, res) => {
  console.log('✅ Запрос к /api/public/club/tariffs получен');
  try {
    // Загружаем цены клуба
    const clubPrices = loadData('clubPrices');
    console.log('✅ Цены клуба загружены:', clubPrices);
    
    // Загружаем тарифы занятий
    const lessonTariffs = loadData('lessonTariffs');
    console.log('✅ Тарифы занятий загружены:', lessonTariffs);
    
    const response = {
      clubPrices: {
        price_1_month: clubPrices.price_1_month,
        price_3_months: clubPrices.price_3_months,
        price_6_months: clubPrices.price_6_months,
        description_1_month: clubPrices.description_1_month || '',
        description_3_months: clubPrices.description_3_months || '',
        description_6_months: clubPrices.description_6_months || '',
      },
      lessonTariffs: lessonTariffs.items || []
    };
    
    console.log('✅ Отправляем ответ:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Ошибка в публичном роуте тарифов:', error);
    res.status(500).json({ error: 'Ошибка загрузки тарифов', message: error.message });
  }
});

module.exports = router;
