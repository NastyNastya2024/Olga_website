/**
 * Конфигурация S3-совместимого хранилища
 * Production: Yandex Object Storage (экосистема Yandex Cloud)
 * Dev: MinIO (локально)
 */

const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Определяем тип хранилища по endpoint
// Production: Yandex Object Storage. Dev: MinIO (docker-compose up -d minio)
const endpoint = process.env.S3_ENDPOINT || (
  process.env.NODE_ENV === 'production'
    ? 'https://storage.yandexcloud.net'
    : 'http://localhost:9000'
);
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

// Настройки bucket (Yandex: olga-website-media, MinIO: olga-media)
const BUCKET_NAME = process.env.S3_BUCKET || (isYandexStorage ? 'olga-website-media' : 'olga-media');

module.exports = {
  s3,
  BUCKET_NAME,
  s3Config,
  isYandexStorage,
  isMinIO,
};
