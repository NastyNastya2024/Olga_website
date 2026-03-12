/**
 * Роуты для загрузки файлов через Express и Multer
 * Для видео: disk storage (не грузит весь файл в память) — избегает OOM на ВМ с 4 GB RAM
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const s3Service = require('../services/s3-service');

const router = express.Router();

// Временная папка для загрузок (очищается после отправки в S3)
const UPLOAD_TMP = path.join(__dirname, '../tmp-uploads');
if (!fs.existsSync(UPLOAD_TMP)) {
  fs.mkdirSync(UPLOAD_TMP, { recursive: true });
}

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый тип файла'), false);
  }
};

// Disk storage — для больших видео не использует RAM
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_TMP),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `upload-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 * 1024 }, // 20 GB
  fileFilter,
});

/**
 * POST /api/upload
 * Загрузка файла в S3
 */
router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (multerErr) => {
    if (multerErr) {
      console.error('Multer error:', multerErr);
      const msg = multerErr.code === 'LIMIT_FILE_SIZE'
        ? `Файл слишком большой. Максимум: 20 ГБ`
        : (multerErr.message || 'Ошибка при приёме файла');
      return res.status(400).json({ success: false, error: msg });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Файл не был загружен',
      });
    }

    const folder = req.file.mimetype.startsWith('image/') ? 'images' : 'videos';

    // Передаём путь к файлу — S3 загружает потоком, без загрузки в память
    const result = await s3Service.uploadFile(
      req.file.path,
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
    // Удаляем временный файл при ошибке
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.warn('Не удалось удалить временный файл:', req.file.path);
      }
    }
    console.error('Ошибка загрузки файла в S3:', error);
    const msg = error.message || 'Ошибка при загрузке файла';
    res.status(500).json({
      success: false,
      error: msg,
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
router.get('/presigned/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const decodedKey = decodeURIComponent(key);
    const expiresIn = parseInt(req.query.expires) || 3600; // По умолчанию 1 час

    const url = await s3Service.getPresignedUrl(decodedKey, expiresIn);

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
