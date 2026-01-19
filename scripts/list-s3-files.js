/**
 * Скрипт для просмотра файлов в S3 (MinIO)
 * 
 * Использование:
 * node scripts/list-s3-files.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// Используем те же настройки, что и в backend
const s3Config = {
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true,
  region: process.env.S3_REGION || 'us-east-1',
};

const BUCKET_NAME = process.env.S3_BUCKET || 'olga-media';

const s3 = new S3Client(s3Config);

async function listFiles() {
  try {
    console.log('📦 Подключение к S3...');
    console.log(`📍 Endpoint: ${s3Config.endpoint}`);
    console.log(`🪣 Bucket: ${BUCKET_NAME}\n`);

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
    });

    const response = await s3.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('📭 Bucket пуст. Файлов не найдено.');
      return;
    }

    console.log(`✅ Найдено файлов: ${response.Contents.length}\n`);
    console.log('📋 Список файлов:\n');
    console.log('─'.repeat(80));
    
    // Группируем по папкам
    const folders = {};
    
    response.Contents.forEach((object) => {
      const key = object.Key;
      const parts = key.split('/');
      const folder = parts.length > 1 ? parts[0] : 'root';
      
      if (!folders[folder]) {
        folders[folder] = [];
      }
      
      folders[folder].push({
        name: parts[parts.length - 1],
        key: key,
        size: object.Size,
        lastModified: object.LastModified,
      });
    });

    // Выводим по папкам
    Object.keys(folders).sort().forEach((folder) => {
      console.log(`\n📁 ${folder === 'root' ? 'Корневая папка' : folder}/`);
      console.log('─'.repeat(80));
      
      folders[folder].forEach((file) => {
        const sizeKB = (file.size / 1024).toFixed(2);
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const sizeStr = file.size > 1024 * 1024 
          ? `${sizeMB} MB` 
          : `${sizeKB} KB`;
        
        const date = new Date(file.lastModified).toLocaleString('ru-RU');
        console.log(`  📄 ${file.name}`);
        console.log(`     Размер: ${sizeStr} | Обновлено: ${date}`);
        console.log(`     Key: ${file.key}`);
        console.log('');
      });
    });

    // Статистика
    const totalSize = response.Contents.reduce((sum, obj) => sum + obj.Size, 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    const totalSizeGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);
    
    console.log('─'.repeat(80));
    console.log(`\n📊 Статистика:`);
    console.log(`   Всего файлов: ${response.Contents.length}`);
    console.log(`   Общий размер: ${totalSizeMB} MB (${totalSizeGB} GB)`);
    
    // Генерируем публичные URL
    console.log(`\n🔗 Примеры публичных URL:`);
    const baseUrl = s3Config.endpoint.replace('9000', '9000');
    folders['videos']?.slice(0, 3).forEach((file) => {
      console.log(`   ${baseUrl}/${BUCKET_NAME}/${file.key}`);
    });
    folders['images']?.slice(0, 3).forEach((file) => {
      console.log(`   ${baseUrl}/${BUCKET_NAME}/${file.key}`);
    });

  } catch (error) {
    console.error('❌ Ошибка при получении списка файлов:', error.message);
    
    if (error.message.includes('NoSuchBucket')) {
      console.error('\n💡 Bucket не найден. Убедитесь, что:');
      console.error('   1. MinIO запущен: docker-compose up -d minio');
      console.error('   2. Bucket создан: docker-compose up minio-setup');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Не удалось подключиться к MinIO. Убедитесь, что:');
      console.error('   1. MinIO запущен: docker-compose up -d minio');
      console.error('   2. MinIO доступен на порту 9000');
    }
    
    process.exit(1);
  }
}

listFiles();
