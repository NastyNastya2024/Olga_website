/**
 * Роуты для оплаты через ЮKassa
 */

require('dotenv').config();
const express = require('express');
const router = express.Router();
const { loadData, saveData } = require('../utils/data-storage');
const crypto = require('crypto');

/**
 * POST /api/payment/create
 * Создание платежа в ЮKassa
 * body: { tariff_id, return_url, cancel_url }
 */
router.post('/create', async (req, res) => {
  try {
    const { tariff_id, return_url, cancel_url, customer_email } = req.body;

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

    // Email для чека (54-ФЗ). Можно передать customer_email в запросе или задать в .env
    const receiptEmail = customer_email || process.env.YOOKASSA_RECEIPT_EMAIL || process.env.YOOKASSA_RECEIPT_EMAIL_BACKUP || 'ola_br@mail.ru' || 'anastkomarova@yandex.ru';

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
      description: `Оплата тарифа: ${tariff.name || 'Йога'}`,
      metadata: {
        tariff_id: String(tariff.id),
        tariff_name: tariff.name || 'Йога'
      },
      receipt: {
        customer: {
          email: receiptEmail
        },
        items: [
          {
            description: tariff.name ? `Тариф: ${tariff.name}` : 'Онлайн-занятия йогой',
            quantity: 1,
            amount: {
              value: amount.toFixed(2),
              currency: 'RUB'
            },
            vat_code: 1,
            payment_mode: 'full_prepayment',
            payment_subject: 'service'
          }
        ]
      }
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
router.post('/webhook', async (req, res) => {
  const { event, object } = req.body || {};

  if (event === 'payment.succeeded') {
    const paymentId = object?.id;
    const metadata = object?.metadata || {};
    const tariffName = metadata.tariff_name || 'Тариф';
    const tariffId = metadata.tariff_id ? parseInt(metadata.tariff_id, 10) : null;
    const paidAt = object?.created_at || new Date().toISOString();

    console.log('Платёж успешен:', paymentId, 'тариф:', tariffName);

    try {
      const usersData = loadData('users');
      const users = usersData.items || [];
      let nextId = usersData.nextId || 1;

      // Проверяем, не создан ли уже ученик для этого платежа
      const existing = users.find(u => u.payment_id === paymentId);
      if (existing) {
        console.log('Ученик для платежа уже создан:', paymentId);
        return res.status(200).send('OK');
      }

      // Вычисляем дату окончания тарифа
      let tariffEndDate = null;
      if (tariffId) {
        const tariffsData = loadData('pricingTariffs');
        const tariff = (tariffsData.items || []).find(t => t.id === tariffId);
        const months = tariff?.duration_months || 1;
        const start = new Date(paidAt);
        start.setMonth(start.getMonth() + months);
        tariffEndDate = start.toISOString();
      }

      const tempPassword = crypto.randomBytes(16).toString('hex');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const newUser = {
        id: nextId++,
        email: `pending_${paymentId}@yolga.local`,
        name: '',
        password: hashedPassword,
        role: 'student',
        status: 'active',
        tariff: tariffName,
        payment_id: paymentId,
        payment_date: paidAt,
        tariff_end_date: tariffEndDate,
        assigned_videos: [],
        program_notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      users.push(newUser);
      saveData('users', { items: users, nextId });
      console.log('Создан новый ученик:', newUser.id, 'тариф:', tariffName);
    } catch (err) {
      console.error('Ошибка создания ученика при оплате:', err);
    }
  }

  if (event === 'payment.canceled') {
    console.log('Платёж отменён:', object?.id);
  }

  res.status(200).send('OK');
});

/**
 * POST /api/payment/complete-registration
 * Завершение регистрации после оплаты: email и пароль
 * body: { payment_id, email, password }
 */
router.post('/complete-registration', async (req, res) => {
  try {
    const { payment_id, email, password } = req.body;

    if (!payment_id || !email || !password) {
      return res.status(400).json({ error: 'Укажите email и пароль' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
    }

    const usersData = loadData('users');
    let users = usersData.items || [];
    let nextId = usersData.nextId || 1;
    let userIndex = users.findIndex(u => u.payment_id === payment_id);

    // Если ученик не создан webhook'ом — создаём по данным платежа из ЮKassa
    if (userIndex === -1) {
      const shopId = process.env.YOOKASSA_SHOP_ID;
      const secretKey = process.env.YOOKASSA_SECRET_KEY;
      if (shopId && secretKey) {
        try {
          const YooKassa = require('yookassa');
          const yooKassa = new YooKassa({ shopId, secretKey });
          const payment = await yooKassa.getPayment(payment_id);
          if (payment && (payment.status === 'succeeded' || payment.isSucceeded)) {
            const metadata = payment.metadata || {};
            const tariffName = metadata.tariff_name || 'Тариф';
            const tariffId = metadata.tariff_id ? parseInt(metadata.tariff_id, 10) : null;
            const paidAt = payment.created_at || payment.createdAt || new Date().toISOString();
            let tariffEndDate = null;
            if (tariffId) {
              const tariffsData = loadData('pricingTariffs');
              const tariff = (tariffsData.items || []).find(t => t.id === tariffId);
              const months = tariff?.duration_months || 1;
              const start = new Date(paidAt);
              start.setMonth(start.getMonth() + months);
              tariffEndDate = start.toISOString();
            }
            const tempPassword = crypto.randomBytes(16).toString('hex');
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            const newUser = {
              id: nextId++,
              email: `pending_${payment_id}@yolga.local`,
              name: '',
              password: hashedPassword,
              role: 'student',
              status: 'active',
              tariff: tariffName,
              payment_id: payment_id,
              payment_date: paidAt,
              tariff_end_date: tariffEndDate,
              assigned_videos: [],
              program_notes: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            users.push(newUser);
            saveData('users', { items: users, nextId });
            userIndex = users.length - 1;
            console.log('Ученик создан по данным платежа (webhook не сработал):', newUser.id);
          }
        } catch (err) {
          console.error('Ошибка получения платежа из ЮKassa:', err);
        }
      }
    }

    if (userIndex === -1) {
      return res.status(404).json({ error: 'Платёж не найден. Подождите 1–2 минуты и попробуйте снова. Либо свяжитесь с нами: 8 902 579-62-52.' });
    }

    const user = users[userIndex];
    if (!user.email.startsWith('pending_')) {
      return res.status(400).json({ error: 'Регистрация для этого платежа уже завершена' });
    }

    if (users.some(u => u.email === email && u.id !== user.id)) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    const bcrypt = require('bcryptjs');
    users[userIndex] = {
      ...user,
      email,
      password: await bcrypt.hash(password, 10),
      updated_at: new Date().toISOString(),
    };
    delete users[userIndex].payment_id;

    saveData('users', { items: users, nextId });

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      { userId: user.id, email, role: 'student' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user_id: user.id, redirect: '/admin/chat' });
  } catch (err) {
    console.error('Ошибка завершения регистрации:', err);
    res.status(500).json({ error: err.message || 'Ошибка сервера' });
  }
});

/**
 * GET /api/payment/check-pending
 * Проверить, создан ли ученик для платежа (для polling на странице успеха)
 */
router.get('/check-pending', (req, res) => {
  const payment_id = req.query.payment_id;
  if (!payment_id) {
    return res.status(400).json({ error: 'payment_id обязателен' });
  }
  const usersData = loadData('users');
  const users = usersData.items || [];
  const user = users.find(u => u.payment_id === payment_id);
  res.json({ ready: !!user, tariff: user?.tariff });
});

module.exports = router;
