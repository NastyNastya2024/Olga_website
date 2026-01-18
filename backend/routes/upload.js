/**
 * Роуты для загрузки файлов через Express и Multer
 */

const express = require('express');
const multer = require('multer');
const s3Service = require('../services/s3-service');

const router = express.Router();

// Настройка multer для обработки файлов в памяти
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB для видео файлов
  },
  fileFilter: (req, file, cb) => {
    // Разрешаем изображения и видео
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime', // .mov
      'video/x-msvideo', // .avi
      'video/x-matroska', // .mkv
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый тип файла'), false);
    }
  },
});

/**
 * POST /api/upload
 * Загрузка файла в S3
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Файл не был загружен',
      });
    }

    // Определяем папку на основе типа файла
    const folder = req.file.mimetype.startsWith('image/') ? 'images' : 'videos';

    // Загружаем файл в S3
    const result = await s3Service.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder
    );

    res.json({
      success: true,
      message: 'Файл успешно загружен',
      data: {
        url: result.url,
        key: result.key,
        fileName: result.fileName,
        publicUrl: s3Service.getPublicUrl(result.key),
      },
    });
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при загрузке файла',
    });
  }
});

/**
 * DELETE /api/upload/:key
 * Удаление файла из S3
 */
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const decodedKey = decodeURIComponent(key);

    const result = await s3Service.deleteFile(decodedKey);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Ошибка удаления файла:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при удалении файла',
    });
  }
});

/**
 * GET /api/upload/list
 * Получение списка файлов
 */
router.get('/list', async (req, res) => {
  try {
    const prefix = req.query.prefix || '';
    const files = await s3Service.listFiles(prefix);

    res.json({
      success: true,
      data: files,
    });
  } catch (error) {
    console.error('Ошибка получения списка файлов:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при получении списка файлов',
    });
  }
});

/**
 * GET /api/upload/presigned/:key
 * Генерация временного URL для доступа к файлу
 */
router.get('/presigned/:key', (req, res) => {
  try {
    const { key } = req.params;
    const decodedKey = decodeURIComponent(key);
    const expiresIn = parseInt(req.query.expires) || 3600; // По умолчанию 1 час

    const url = s3Service.getPresignedUrl(decodedKey, expiresIn);

    res.json({
      success: true,
      url: url,
      expiresIn: expiresIn,
    });
  } catch (error) {
    console.error('Ошибка генерации presigned URL:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при генерации URL',
    });
  }
});

module.exports = router;
