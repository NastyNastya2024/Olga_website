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
