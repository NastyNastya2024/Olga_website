# Подключение оплаты через ЮKassa (YooKassa)

Пошаговая инструкция по интеграции платёжной системы ЮKassa в проект Olga Website.

---

## Шаг 1. Регистрация в ЮKassa

1. Перейдите на [yookassa.ru](https://yookassa.ru)
2. Нажмите **«Подключиться»** или **«Войти»**
3. Войдите через Яндекс ID или зарегистрируйте новый аккаунт
4. Заполните данные магазина (ИНН, расчётный счёт, контактные данные)
5. Дождитесь завершения проверки (обычно 1–3 рабочих дня)

---

## Шаг 2. Получение ключей API

1. В личном кабинете ЮKassa: **Настройки → Ключи API**
2. Скопируйте:
   - **shopId** (идентификатор магазина)
   - **Секретный ключ** (secret key)

> ⚠️ Секретный ключ показывается только один раз. Сохраните его в надёжном месте.

---

## Шаг 3. Установка пакета в backend

```bash
cd backend
npm install yookassa
```

---

## Шаг 4. Добавление переменных окружения

В файле `backend/.env` (если его нет — создайте) добавьте:

```env
YOOKASSA_SHOP_ID=ваш_shop_id
YOOKASSA_SECRET_KEY=ваш_секретный_ключ
YOOKASSA_RECEIPT_EMAIL=ola_br@mail.ru
YOOKASSA_RECEIPT_EMAIL_BACKUP=anastkomarova@yandex.ru   # Резервный email для чека
```

> ⚠️ Не добавляйте `.env` в git. Убедитесь, что он в `.gitignore`.

---

## Шаг 5. Создание API для оплаты

Создайте файл `backend/routes/payment.js`:

```javascript
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

    const data = loadData('pricingTariffs');
    const items = data.items || [];
    const tariff = items.find(t => t.id === parseInt(tariff_id, 10));

    if (!tariff) {
      return res.status(400).json({ error: 'Тариф не найден' });
    }

    // Парсим цену из tariff.price (например "1 990 ₽" или "1990")
    const priceStr = (tariff.price || '0').replace(/\s/g, '').replace(/[^\d]/g, '');
    const amount = parseFloat(priceStr) || 0;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Некорректная цена тарифа' });
    }

    const YooKassa = require('yookassa');
    const yooKassa = new YooKassa({
      shopId: process.env.YOOKASSA_SHOP_ID,
      secretKey: process.env.YOOKASSA_SECRET_KEY
    });

    const payment = await yooKassa.createPayment({
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB'
      },
      payment_method_data: { type: 'bank_card' },
      confirmation: {
        type: 'redirect',
        return_url: return_url || `${req.protocol}://${req.get('host')}/payment/success`,
        cancel_url: cancel_url || `${req.protocol}://${req.get('host')}/payment/cancel`
      },
      capture: true,
      description: `Оплата тарифа: ${tariff.name || 'Йога'}`
    });

    res.json({
      payment_id: payment.id,
      confirmation_url: payment.confirmationUrl || payment.confirmation?.confirmation_url,
      amount: payment.amount.value
    });
  } catch (error) {
    console.error('Ошибка создания платежа:', error);
    res.status(500).json({ error: error.message || 'Ошибка создания платежа' });
  }
});

module.exports = router;
```

---

## Шаг 6. Подключение роута в сервере

В `backend/index.js` и `backend/dev-server.js` добавьте:

```javascript
const paymentRoutes = require('./routes/payment');

// После других app.use:
app.use('/api/payment', paymentRoutes);
```

---

## Шаг 7. Настройка вебхука (уведомления о платежах)

1. В личном кабинете ЮKassa: **Настройки → Уведомления**
2. Укажите URL: `https://Yolga.pro/api/payment/webhook`
3. Включите события: **payment.succeeded**, **payment.canceled**

Создайте обработчик webhook в `backend/routes/payment.js`:

```javascript
/**
 * POST /api/payment/webhook
 * Обработка уведомлений от ЮKassa
 */
router.post('/webhook', express.json(), (req, res) => {
  // ЮKassa отправляет уведомление о статусе платежа
  const { event, object } = req.body;

  if (event === 'payment.succeeded') {
    console.log('Платёж успешен:', object.id);
    // Здесь можно: сохранить в БД, выдать доступ, отправить письмо
  }

  if (event === 'payment.canceled') {
    console.log('Платёж отменён:', object.id);
  }

  res.status(200).send('OK');
});
```

---

## Шаг 8. Изменение кнопки «Выбрать тариф» на фронтенде

Вместо открытия Telegram нужно вызывать API и перенаправлять на страницу оплаты:

```javascript
// Пример вызова при клике на «Выбрать тариф»
async function handlePayment(tariffId) {
  try {
    const response = await fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tariff_id: tariffId,
        return_url: window.location.origin + '/payment/success',
        cancel_url: window.location.origin + '/'
      })
    });
    const data = await response.json();
    if (data.confirmation_url) {
      window.location.href = data.confirmation_url;
    }
  } catch (error) {
    alert('Ошибка создания платежа');
  }
}
```

---

## Шаг 9. Тестовый режим

1. В личном кабинете ЮKassa: **Настройки → Тестовый режим** — включите
2. Используйте тестовые карты:
   - **Успешная оплата:** `4111 1111 1111 111]1`
   - **Отклонённая:** `4000 0000 0000 0002`
   - Срок: любая будущая дата
   - CVC: любые 3 цифры

---

## Шаг 10. Переход в боевой режим

1. Завершите проверку в ЮKassa
2. Выключите тестовый режим
3. Проверьте, что `.env` содержит боевые ключи

---

## Шаг 11. Настройка на продакшн-сервере (Yandex Cloud)

Локально `.env` работает, но на сервере yolga.pro — отдельный файл. Переменные нужно добавить **напрямую на сервере** (через SSH).

### 1. Подключитесь к серверу

```bash
ssh yandex-olga
# или: ssh -i ~/.ssh/yandex_cloud admin@158.160.192.242
```

### 2. Откройте `.env` в папке backend

```bash
cd ~/olga-website/backend
nano .env
```

### 3. Добавьте строки (или вставьте существующие из локального .env)

```env
YOOKASSA_SHOP_ID=ваш_shop_id
YOOKASSA_SECRET_KEY=ваш_секретный_ключ
YOOKASSA_RECEIPT_EMAIL=ola_br@mail.ru
YOOKASSA_RECEIPT_EMAIL_BACKUP=anastkomarova@yandex.ru
```

> ⚠️ Не копируйте `.env` через git — файл в `.gitignore`. Ключи вводите вручную или копируйте через буфер обмена.

### 4. Сохраните и перезапустите backend

```bash
# В nano: Ctrl+O для сохранения, Enter, Ctrl+X для выхода

pm2 restart olga-backend
```
### 5. Проверка

```bash
pm2 logs olga-backend --lines 20
```

После перезапуска ошибка «ЮKassa не настроена» должна исчезнуть.

---

## Проверка списка

- [ ] Регистрация в ЮKassa
- [ ] Получение shopId и secretKey
- [ ] Установка `yookassa`
- [ ] Добавление переменных в `.env` (локально)
- [ ] Добавление переменных в `.env` на сервере (см. Шаг 11)
- [ ] Создание `backend/routes/payment.js`
- [ ] Подключение роута в сервере
- [ ] Настройка webhook
- [ ] Замена кнопки «Выбрать тариф» на вызов API
- [ ] Тестирование в тестовом режиме

---

## Документация

- [Официальная документация ЮKassa](https://yookassa.ru/developers)
- [API Reference](https://yookassa.ru/developers/api)
- [npm: yookassa](https://www.npmjs.com/package/yookassa)
