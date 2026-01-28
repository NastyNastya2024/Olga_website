/**
 * Конфигурация подключения к S3 (MinIO, AWS S3 или Yandex Object Storage)
 * Использует AWS SDK v3
 */

const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Определяем тип хранилища по endpoint
// Если S3_ENDPOINT не указан, используем Yandex Object Storage по умолчанию
// Для localhost можно использовать Yandex Object Storage или MinIO (если запущен)
const endpoint = process.env.S3_ENDPOINT || 'https://storage.yandexcloud.net';
const isYandexStorage = endpoint.includes('storage.yandexcloud.net');
const isMinIO = endpoint.includes('localhost:9000') || endpoint.includes('127.0.0.1:9000');

// Конфигурация S3 клиента
const s3Config = {
  endpoint: endpoint,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
  },
  // forcePathStyle: true для MinIO, false для Yandex Object Storage и AWS S3
  forcePathStyle: isMinIO,
  region: process.env.S3_REGION || (isYandexStorage ? 'ru-central1' : 'us-east-1'),
};

// Создание S3 клиента
const s3 = new S3Client(s3Config);

// Настройки bucket
const BUCKET_NAME = process.env.S3_BUCKET || 'olga-media';

module.exports = {
  s3,
  BUCKET_NAME,
  s3Config,
  isYandexStorage,
  isMinIO,
};
