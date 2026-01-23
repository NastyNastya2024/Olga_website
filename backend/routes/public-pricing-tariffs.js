/**
 * Публичные роуты для тарифов на главной странице
 */

const express = require('express');
const router = express.Router();
const { loadData } = require('../utils/data-storage');

/**
 * GET /api/public/pricing-tariffs
 * Получить все тарифы (публичный доступ)
 */
router.get('/', (req, res) => {
  try {
    const pricingTariffs = loadData('pricingTariffs');
    res.json(pricingTariffs.items || []);
  } catch (error) {
    console.error('Ошибка загрузки тарифов:', error);
    res.status(500).json({ error: 'Ошибка загрузки тарифов', message: error.message });
  }
});

module.exports = router;
