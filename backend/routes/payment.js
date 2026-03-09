/**
 * Роуты для оплаты через ЮKassa
 */

require('dotenv').config();
const express = require('express');
const router = express.Router();
const { loadData } = require('../utils/data-storage');

/**
 * POST /api/payment/create
 * Создание платежа в ЮKassa
 * body: { tariff_id, return_url, cancel_url }
 */
router.post('/create', async (req, res) => {
  try {
    const { tariff_id, return_url, cancel_url } = req.body;

    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;

    if (!shopId || !secretKey) {
      return res.status(500).json({ error: 'ЮKassa не настроена. Добавьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env' });
    }

    const data = loadData('pricingTariffs');
    const items = data.items || [];
    const tariff = items.find(t => t.id === parseInt(tariff_id, 10));

    if (!tariff) {
      return res.status(400).json({ error: 'Тариф не найден' });
    }

    // Парсим цену из tariff.price (например "1 990 ₽", "1990" или "10000")
    const priceStr = (tariff.price || '0').replace(/\s/g, '').replace(/[^\d]/g, '');
    const amount = parseFloat(priceStr) || 0;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Некорректная цена тарифа' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const defaultReturnUrl = `${baseUrl}/payment/success.html`;
    const defaultCancelUrl = `${baseUrl}/`;

    const YooKassa = require('yookassa');
    const yooKassa = new YooKassa({
      shopId,
      secretKey
    });

    const payment = await yooKassa.createPayment({
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB'
      },
      payment_method_data: { type: 'bank_card' },
      confirmation: {
        type: 'redirect',
        return_url: return_url || defaultReturnUrl,
        cancel_url: cancel_url || defaultCancelUrl
      },
      capture: true,
      description: `Оплата тарифа: ${tariff.name || 'Йога'}`
    });

    const confirmationUrl = payment.confirmationUrl || (payment.confirmation && payment.confirmation.confirmation_url);

    if (!confirmationUrl) {
      console.error('ЮKassa не вернула confirmation_url:', payment);
      return res.status(500).json({ error: 'Ошибка создания платежа' });
    }

    res.json({
      payment_id: payment.id,
      confirmation_url: confirmationUrl,
      amount: payment.amount ? payment.amount.value : amount
    });
  } catch (error) {
    console.error('Ошибка создания платежа:', error);
    res.status(500).json({ error: error.message || 'Ошибка создания платежа' });
  }
});

/**
 * POST /api/payment/webhook
 * Обработка уведомлений от ЮKassa
 */
router.post('/webhook', (req, res) => {
  const { event, object } = req.body || {};

  if (event === 'payment.succeeded') {
    console.log('Платёж успешен:', object?.id);
    // Здесь можно: сохранить в БД, выдать доступ, отправить письмо
  }

  if (event === 'payment.canceled') {
    console.log('Платёж отменён:', object?.id);
  }

  res.status(200).send('OK');
});

module.exports = router;
