# Подключение и использование S3

## Структура файлов

```
backend/
├── config/
│   └── s3-config.js      # Конфигурация подключения к S3
├── services/
│   └── s3-service.js      # Сервис для работы с S3
├── routes/
│   └── upload.js          # Express роуты для загрузки файлов
├── example-usage.js       # Примеры использования
├── index.js              # Пример Express сервера
└── package.json          # Зависимости
```

## Установка

```bash
cd backend
npm install
```

## Настройка

1. Создайте файл `.env` в папке `backend`:

```env
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=olga-media
S3_REGION=us-east-1
PORT=5000
```

2. Убедитесь, что MinIO запущен:

```bash
docker-compose up -d
```

## Использование

### Базовое использование сервиса

```javascript
const s3Service = require('./services/s3-service');

// Загрузка файла
const result = await s3Service.uploadFile(
  fileBuffer,
  'my-image.jpg',
  'image/jpeg',
  'images'
);

console.log('URL:', result.url);
```

### Использование через Express API

#### Загрузка файла

```bash
curl -X POST http://localhost:5000/api/upload \
  -F "file=@/path/to/image.jpg"
```

Ответ:
```json
{
  "success": true,
  "message": "Файл успешно загружен",
  "data": {
    "url": "http://localhost:9000/olga-media/images/1234567890-image.jpg",
    "key": "images/1234567890-image.jpg",
    "fileName": "image.jpg",
    "publicUrl": "http://localhost:9000/olga-media/images/1234567890-image.jpg"
  }
}
```

#### Удаление файла

```bash
curl -X DELETE "http://localhost:5000/api/upload/images%2F1234567890-image.jpg"
```

#### Получение списка файлов

```bash
curl "http://localhost:5000/api/upload/list?prefix=images/"
```

#### Генерация временного URL

```bash
curl "http://localhost:5000/api/upload/presigned/images%2F1234567890-image.jpg?expires=3600"
```

## Доступные методы S3Service

### `uploadFile(fileBuffer, fileName, mimeType, folder)`
Загружает файл в S3.

**Параметры:**
- `fileBuffer` - Buffer с данными файла
- `fileName` - Имя файла
- `mimeType` - MIME тип (например, 'image/jpeg')
- `folder` - Папка в S3 (по умолчанию 'uploads')

**Возвращает:** Объект с `url`, `key`, `bucket`, `fileName`

### `getFile(key)`
Получает файл из S3.

**Параметры:**
- `key` - Ключ файла в S3

**Возвращает:** Объект с `body`, `contentType`, `contentLength`

### `deleteFile(key)`
Удаляет файл из S3.

**Параметры:**
- `key` - Ключ файла в S3

**Возвращает:** Объект с результатом удаления

### `getPublicUrl(key)`
Генерирует публичный URL файла.

**Параметры:**
- `key` - Ключ файла в S3

**Возвращает:** Строка с URL

### `getPresignedUrl(key, expiresIn)`
Генерирует временный URL для доступа к файлу.

**Параметры:**
- `key` - Ключ файла в S3
- `expiresIn` - Время жизни URL в секундах (по умолчанию 3600)

**Возвращает:** Строка с presigned URL

### `fileExists(key)`
Проверяет существование файла.

**Параметры:**
- `key` - Ключ файла в S3

**Возвращает:** Boolean

### `listFiles(prefix)`
Получает список файлов в папке.

**Параметры:**
- `prefix` - Префикс пути (папка)

**Возвращает:** Массив объектов с информацией о файлах

## Интеграция с HTML формой

```html
<form id="uploadForm" enctype="multipart/form-data">
  <input type="file" name="file" id="fileInput" required>
  <button type="submit">Загрузить</button>
</form>

<script>
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('file', document.getElementById('fileInput').files[0]);
  
  const response = await fetch('http://localhost:5000/api/upload', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  console.log('Файл загружен:', result.data.url);
});
</script>
```

## Переход на AWS S3

Для использования реального AWS S3 вместо MinIO:

1. Измените переменные окружения:
```env
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your-aws-access-key
S3_SECRET_KEY=your-aws-secret-key
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
```

2. В `s3-config.js` уберите `s3ForcePathStyle: true` (или установите в `false`)

3. Готово! Код будет работать с AWS S3 без изменений.
