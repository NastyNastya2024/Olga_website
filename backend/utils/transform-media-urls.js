/**
 * Преобразует URL медиафайлов для ответа API.
 * Локальный MinIO (localhost:9000) в браузере с домена сайта не открывается — нужны /media/... или публичный URL Yandex.
 */

const { isYandexStorage, BUCKET_NAME } = require('../config/s3-config');

/**
 * Локальный MinIO: http://localhost:9000/<любой-бакет>/<ключ>
 * — на Yandex-проде: https://storage.yandexcloud.net/<S3_BUCKET из .env>/<ключ>
 * — на MinIO за Nginx: /media/<бакет-из-url>/<ключ>
 * @param {string} url
 * @returns {string}
 */
function transformUrl(url) {
  if (typeof url !== 'string' || !url) return url;

  const m = url.match(/^https?:\/\/(localhost|127\.0\.0\.1):9000\/([^/]+)\/(.+)$/i);
  if (!m) return url;

  const bucketInUrl = m[2];
  const keyPath = m[3];

  if (isYandexStorage) {
    return `https://storage.yandexcloud.net/${BUCKET_NAME}/${keyPath}`;
  }

  return `/media/${bucketInUrl}/${keyPath}`;
}

const MEDIA_KEYS = [
  'video_url',
  'thumbnail_url',
  'cover_url',
  'preview_url',
  'url',
  'image_url',
  's3_url',
  'cover_image',
  'gallery',
];

/**
 * Рекурсивно преобразует URL в объекте/массиве.
 * Только в production — в dev прямой localhost:9000 доступен с той же машины.
 */
function transformMediaUrls(obj) {
  if (process.env.NODE_ENV !== 'production') return obj;
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return transformUrl(obj);
  if (Array.isArray(obj)) return obj.map(item => transformMediaUrls(item));
  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (MEDIA_KEYS.includes(key) && typeof value === 'string') {
        result[key] = transformUrl(value);
      } else {
        result[key] = transformMediaUrls(value);
      }
    }
    return result;
  }
  return obj;
}

module.exports = { transformMediaUrls, transformUrl };
