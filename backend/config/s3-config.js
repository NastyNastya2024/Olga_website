/**
 * Конфигурация подключения к S3 (MinIO или AWS S3)
 * Использует AWS SDK v3
 */

const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Конфигурация S3 клиента
const s3Config = {
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true, // Обязательно для MinIO
  region: process.env.S3_REGION || 'us-east-1',
};

// Создание S3 клиента
const s3 = new S3Client(s3Config);

// Настройки bucket
const BUCKET_NAME = process.env.S3_BUCKET || 'olga-media';

module.exports = {
  s3,
  BUCKET_NAME,
  s3Config,
};
