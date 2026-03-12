/**
 * Сервис для работы с S3 (MinIO)
 * Предоставляет функции для загрузки, получения и удаления файлов
 * Использует AWS SDK v3
 */

const { s3, BUCKET_NAME, isYandexStorage } = require('../config/s3-config');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const fs = require('fs');

class S3Service {
  /**
   * Загрузка файла в S3
   * @param {Buffer|string} fileBufferOrPath - Буфер файла или путь к файлу на диске
   * @param {string} fileName - Имя файла
   * @param {string} mimeType - MIME тип файла
   * @param {string} folder - Папка для сохранения (опционально)
   * @returns {Promise<Object>} Результат загрузки с URL и ключом
   */
  async uploadFile(fileBufferOrPath, fileName, mimeType, folder = 'uploads') {
    try {
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const key = `${folder}/${timestamp}-${sanitizedFileName}`;

      // Для больших файлов используем stream (путь к файлу), иначе buffer
      const isFilePath = typeof fileBufferOrPath === 'string';
      const body = isFilePath ? fs.createReadStream(fileBufferOrPath) : fileBufferOrPath;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000, immutable',
      });

      await s3.send(command);

      // Удаляем временный файл после успешной загрузки
      if (isFilePath) {
        try {
          fs.unlinkSync(fileBufferOrPath);
        } catch (e) {
          console.warn('Не удалось удалить временный файл:', fileBufferOrPath, e.message);
        }
      }

      const url = this.getPublicUrl(key);

      return {
        success: true,
        url: url,
        publicUrl: url,
        key: key,
        bucket: BUCKET_NAME,
        fileName: sanitizedFileName,
      };
    } catch (error) {
      console.error('Ошибка загрузки файла в S3:', error);
      throw new Error(`Не удалось загрузить файл: ${error.message}`);
    }
  }

  /**
   * Получение потока файла из S3 (для проксирования видео)
   * @param {string} key - Ключ файла в S3
   * @param {object} range - Опционально { start, end } для Range запросов
   * @returns {Promise<Object>} { stream, contentType, contentLength }
   */
  async getFileStream(key, range = null) {
    try {
      const params = { Bucket: BUCKET_NAME, Key: key };
      if (range) {
        params.Range = `bytes=${range.start}-${range.end}`;
      }
      const command = new GetObjectCommand(params);
      const result = await s3.send(command);
      return {
        stream: result.Body,
        contentType: result.ContentType || 'video/mp4',
        contentLength: result.ContentLength,
        contentRange: result.ContentRange,
      };
    } catch (error) {
      console.error('Ошибка получения потока из S3:', error);
      throw new Error(`Не удалось получить файл: ${error.message}`);
    }
  }

  /**
   * Получение файла из S3
   * @param {string} key - Ключ файла в S3
   * @returns {Promise<Object>} Данные файла
   */
  async getFile(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const result = await s3.send(command);

      // В SDK v3 Body - это Readable stream, нужно преобразовать в Buffer
      const chunks = [];
      for await (const chunk of result.Body) {
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks);

      return {
        success: true,
        body: body,
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
      };
    } catch (error) {
      console.error('Ошибка получения файла из S3:', error);
      throw new Error(`Не удалось получить файл: ${error.message}`);
    }
  }

  /**
   * Удаление файла из S3
   * @param {string} key - Ключ файла в S3
   * @returns {Promise<Object>} Результат удаления
   */
  async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3.send(command);

      return {
        success: true,
        message: 'Файл успешно удален',
        key: key,
      };
    } catch (error) {
      console.error('Ошибка удаления файла из S3:', error);
      throw new Error(`Не удалось удалить файл: ${error.message}`);
    }
  }

  /**
   * Генерация URL для временного доступа к файлу (presigned URL)
   * @param {string} key - Ключ файла в S3
   * @param {number} expiresIn - Время жизни URL в секундах (по умолчанию 1 час)
   * @returns {string} Presigned URL
   */
  async getPresignedUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const url = await getSignedUrl(s3, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('Ошибка генерации presigned URL:', error);
      throw new Error(`Не удалось сгенерировать URL: ${error.message}`);
    }
  }

  /**
   * Получение публичного URL файла
   * @param {string} key - Ключ файла в S3
   * @returns {string} Публичный URL
   */
  getPublicUrl(key) {
    // Для Yandex Object Storage формат URL: https://storage.yandexcloud.net/bucket/key
    if (isYandexStorage) {
      const bucket = process.env.S3_BUCKET || BUCKET_NAME;
      return `https://storage.yandexcloud.net/${bucket}/${key}`;
    }
    
    // Для MinIO (старый формат)
    const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
    const baseUrl = endpoint.replace(/\/$/, '');
    return `${baseUrl}/${BUCKET_NAME}/${key}`;
  }

  /**
   * Проверка существования файла
   * @param {string} key - Ключ файла в S3
   * @returns {Promise<boolean>} Существует ли файл
   */
  async fileExists(key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Получение списка файлов в папке
   * @param {string} prefix - Префикс (путь к папке)
   * @returns {Promise<Array>} Список файлов
   */
  async listFiles(prefix = '') {
    try {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
      });

      const result = await s3.send(command);

      return (result.Contents || []).map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        url: this.getPublicUrl(item.Key),
      }));
    } catch (error) {
      console.error('Ошибка получения списка файлов:', error);
      
      // Улучшенная обработка ошибок подключения
      if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
        throw new Error(`Не удалось подключиться к MinIO на порту 9000. Убедитесь, что MinIO запущен: docker-compose up -d minio`);
      }
      
      throw new Error(`Не удалось получить список файлов: ${error.message}`);
    }
  }
}

module.exports = new S3Service();
