# Деплой на сервер

## Хранилище: Yandex Object Storage

Все медиа (видео, фото) хранятся в **Yandex Object Storage** (экосистема Yandex Cloud). URL вида `https://storage.yandexcloud.net/olga-website-media/...` — публичные, работают напрямую из браузера.

В `backend/.env` на сервере должны быть:
```env
S3_ENDPOINT=https://storage.yandexcloud.net
S3_ACCESS_KEY=ключ_из_консоли_yandex
S3_SECRET_KEY=секрет_из_консоли_yandex
S3_BUCKET=olga-website-media
S3_REGION=ru-central1
NODE_ENV=production
```

---

## «Загрузка...» не исчезает (видео, ретриты, отзывы, тарифы)

**Проверьте в браузере (F12 → Console):**
- Есть ли ошибки в консоли?
- Есть ли ошибки вкладки Network (красные запросы к /api/...)?

**Частые причины:**
1. **HTTPS** — если открываете https://yolga.pro, а SSL не настроен, запросы могут не проходить. Попробуйте **http://yolga.pro** или **http://158.160.173.153**
2. **Кэш** — очистите кэш браузера (Ctrl+Shift+Delete) или откройте в режиме инкогнито
3. **Деплой** — убедитесь, что выполнили `git pull` и `pm2 restart olga-backend`

**Проверка API с сервера:**
```bash
curl -s http://localhost:5000/api/public/videos | head -c 200
curl -s http://localhost:5000/api/public/tours | head -c 200
```

---

## Видео 3+ ГБ не загружается (600 МБ — загружается)

**Причина:** Таймауты или нехватка места на диске.

**Решение:**

1. Применить обновлённый Nginx (таймауты 2 часа):
```bash
cd ~/olga-website
git pull origin main
./deploy/apply-nginx.sh
```

2. Проверить свободное место (нужно минимум 4 ГБ для файла 3 ГБ):
```bash
df -h ~/olga-website/backend/tmp-uploads
```

3. Загружать при стабильном интернете — 3 ГБ при 10 Мбит/с ≈ 40 минут.

---

## 502 Bad Gateway при загрузке файла

**Причина:** Nginx не получает ответ от backend (Node.js). Backend может быть остановлен, упал или перегружен.

**Решение:**

1. Подключитесь по SSH и проверьте PM2:
```bash
pm2 status
pm2 logs olga-backend --lines 30
```

2. Если backend не запущен или упал:
```bash
cd ~/olga-website/backend
pm2 start index.js --name olga-backend
# или перезапуск:
pm2 restart olga-backend
```

3. Проверьте память (большие файлы могут вызвать OOM):
```bash
free -h
```

4. Проверьте, что backend отвечает локально:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health
# Должно вернуть 200
```

---

## Видео/фото не загружаются на сайте

Убедитесь, что в `backend/.env` на сервере указано:
```env
NODE_ENV=production
```
Без этого URL медиа (localhost:9000) не преобразуются в рабочие (/media/...).

---

## 404 на yolga.pro/videos.html или других страницах

### Причина
Nginx не находит файлы — скорее всего, путь к проекту в конфиге не совпадает с реальным расположением.

### Решение

**1. Подключитесь к серверу и проверьте путь к проекту:**
```bash
ssh ... # ваш способ подключения
pwd
# Если вы в ~/olga-website, путь будет /home/ВАШ_ПОЛЬЗОВАТЕЛЬ/olga-website
```

**2. Запустите проверку:**
```bash
cd ~/olga-website
chmod +x deploy/verify-deploy.sh
./deploy/verify-deploy.sh
```

**3. Если путь отличается — отредактируйте конфиг:**
```bash
nano deploy/nginx-olga-website.conf
```
Замените все `/home/anastkomarova/` на ваш путь (например `/home/admin/`).

**4. Примените конфиг:**
```bash
./deploy/apply-nginx.sh
```

**5. Проверьте, что файлы на месте:**
```bash
ls -la ~/olga-website/public/videos.html
ls -la ~/olga-website/public/index.html
```

---

## Полный деплой после git pull

```bash
cd ~/olga-website
git pull origin main

# Применить Nginx (включая client_max_body_size 20G)
./deploy/apply-nginx.sh

# Обновить backend
cd backend && npm install --production && pm2 restart olga-backend
```

## PM2: перезапуск через ecosystem (рекомендуется)

Если backend часто падает (↺ много перезапусков), используйте ecosystem:

```bash
cd ~/olga-website/backend
pm2 delete olga-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
```
