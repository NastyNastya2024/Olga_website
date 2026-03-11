# Аудит: Yandex Object Storage — почему не загружаются видео

Бакет `olga-website-media`: 32 объекта, 681.52 МБ. Жёлтый значок рядом с «Публичный доступ» может указывать на неполную настройку.

---

## 1. Проверка публичного доступа к бакету

### В консоли Yandex Cloud

1. Откройте **Object Storage** → **Бакеты** → **olga-website-media**
2. Вкладка **Права доступа** (или **Настройки**)
3. Убедитесь, что включено **«Публичный доступ на чтение объектов»** (Public read access)

### Если публичный доступ не настроен

**Через консоль:**
- Бакет → **Настройки** → **Публичный доступ**
- Включите «Публичный доступ на чтение объектов»

**Через AWS CLI (если используется):**
```bash
# Подставьте endpoint Yandex
aws s3api put-bucket-acl \
  --endpoint-url=https://storage.yandexcloud.net \
  --bucket olga-website-media \
  --acl public-read
```

### Проверка доступа к файлу

Откройте в браузере (подставьте реальный путь к файлу из вашего бакета):
```
https://storage.yandexcloud.net/olga-website-media/videos/1769616331549-1______________7min.mov
```

Если файл скачивается или воспроизводится — доступ работает. Если 403 — нужно настроить публичный доступ.

---

## 2. Проверка CORS на бакете

Если видео не загружаются из‑за CORS (ошибки в консоли браузера):

1. Бакет **olga-website-media** → **CORS**
2. Добавьте правило:

| Поле | Значение |
|------|----------|
| Источники (Origins) | `*` или `http://yolga.pro` `http://158.160.173.153` `https://yolga.pro` |
| Методы | `GET`, `HEAD` |
| Заголовки | `*` |

---

## 3. Проверка backend/.env на сервере

На сервере:

```bash
cd ~/olga-website/backend
grep -E "S3_|NODE_ENV" .env
```

Должно быть:

```env
S3_ENDPOINT=https://storage.yandexcloud.net
S3_ACCESS_KEY=ключ_из_консоли_yandex
S3_SECRET_KEY=секрет_из_консоли_yandex
S3_BUCKET=olga-website-media
S3_REGION=ru-central1
NODE_ENV=production
```

---

## 4. Проверка URL в ответе API

```bash
curl -s http://localhost:5000/api/public/videos | head -c 500
```

В ответе должно быть что‑то вроде:
```json
"video_url": "https://storage.yandexcloud.net/olga-website-media/videos/..."
```

Если URL другой (например, `localhost:9000`) — backend не настроен на Yandex.

---

## 5. Проверка в браузере (F12)

1. Откройте сайт (http://yolga.pro или http://158.160.173.153)
2. F12 → **Console** — есть ли ошибки?
3. F12 → **Network** — обновите страницу и проверьте:
   - Запросы к `/api/public/videos` — статус 200?
   - Запросы к `storage.yandexcloud.net` — статус 200 или 403?

Если 403 на `storage.yandexcloud.net` — проблема в публичном доступе к бакету.

---

## 6. Чеклист по порядку

1. [ ] Публичный доступ на чтение объектов включён для бакета `olga-website-media`
2. [ ] CORS настроен для бакета (если нужен)
3. [ ] В `backend/.env` на сервере указаны `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
4. [ ] `NODE_ENV=production` в `.env`
5. [ ] `pm2 restart olga-backend` после изменений
6. [ ] Один из URL видео открывается в браузере напрямую
7. [ ] Сайт открыт по http (если HTTPS не настроен)

---

## 7. Быстрый тест

```bash
# На сервере
curl -s "https://storage.yandexcloud.net/olga-website-media/videos/" | head -5
```

Если ответ — XML со списком объектов или 403 — бакет доступен. Если 404 — проверьте имя бакета и путь.

---

## 8. Жёлтый значок «Публичный доступ»

В Yandex Cloud он может означать:

- Публичный доступ включён, но есть ограничения (например, по политикам)
- Рекомендуется проверить настройки вручную
- Рекомендуется использовать Bucket Policy вместо ACL

Проверьте вкладки **Права доступа** и **Bucket Policy** в настройках бакета.
