/**
 * Преобразует URL медиафайлов (localhost:9000) в относительные пути для production.
 * Браузер пользователя не может загрузить localhost:9000 — только через Nginx proxy /media/
 */

const BUCKET = process.env.S3_BUCKET || 'olga-media';

/**
 * Заменяет localhost/127.0.0.1 URL MinIO на относительный путь /media/bucket/...
 * @param {string} url
 * @returns {string}
 */
function transformUrl(url) {
  if (typeof url !== 'string' || !url) return url;
  // http://localhost:9000/olga-media/... -> /media/olga-media/...
  const patterns = [
    new RegExp(`^https?://localhost:9000/${BUCKET}/`, 'i'),
    new RegExp(`^https?://127\\.0\\.0\\.1:9000/${BUCKET}/`, 'i'),
  ];
  for (const re of patterns) {
    if (re.test(url)) {
      return url.replace(re, `/media/${BUCKET}/`);
    }
  }
  return url;
}

const MEDIA_KEYS = ['video_url', 'thumbnail_url', 'cover_url', 'preview_url', 'url', 'image_url', 's3_url', 'cover_image', 'gallery'];

/**
 * Рекурсивно преобразует URL в объекте/массиве.
 * Только в production — в dev localhost:9000 доступен с той же машины.
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
