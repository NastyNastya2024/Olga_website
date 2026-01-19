/**
 * Скрипт для загрузки видео файлов в S3 (MinIO)
 * 
 * Использование:
 * node scripts/upload-to-s3.js /path/to/video.mp4
 * или
 * node scripts/upload-to-s3.js /path/to/folder
 */

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Загружаем переменные окружения
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// Если .env не найден, используем значения по умолчанию
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'minioadmin';
const S3_BUCKET = process.env.S3_BUCKET || 'olga-media';
const S3_REGION = process.env.S3_REGION || 'us-east-1';

// Настройка S3 клиента
const s3Client = new S3Client({
    endpoint: S3_ENDPOINT,
    credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
    },
    forcePathStyle: true,
    region: S3_REGION,
});

/**
 * Загрузка одного файла в S3
 */
async function uploadFile(filePath) {
    const fileName = path.basename(filePath);
    const fileStream = fs.createReadStream(filePath);
    const stats = fs.statSync(filePath);
    
    // Определяем тип файла
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'video/mp4';
    if (ext === '.webm') contentType = 'video/webm';
    if (ext === '.mov') contentType = 'video/quicktime';
    if (ext === '.avi') contentType = 'video/x-msvideo';
    
    const key = `videos/${Date.now()}-${fileName}`;
    
    console.log(`Загрузка: ${fileName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);
    
    const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: fileStream,
        ContentType: contentType,
        ACL: 'public-read',
    });
    
    try {
        await s3Client.send(command);
        
        // Генерируем публичный URL
        const baseUrl = S3_ENDPOINT.replace(/\/$/, '');
        const url = `${baseUrl}/${S3_BUCKET}/${key}`;
        
        console.log(`✅ Загружено: ${fileName}`);
        console.log(`   URL: ${url}`);
        console.log(`   Key: ${key}\n`);
        
        return {
            success: true,
            fileName,
            url: url,
            key: key,
            size: stats.size,
        };
    } catch (error) {
        console.error(`❌ Ошибка загрузки ${fileName}:`, error.message);
        return {
            success: false,
            fileName,
            error: error.message,
        };
    }
}

/**
 * Загрузка всех видео из папки
 */
async function uploadFolder(folderPath) {
    const files = fs.readdirSync(folderPath);
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    
    const videoFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return videoExtensions.includes(ext);
    });
    
    if (videoFiles.length === 0) {
        console.log('Видео файлы не найдены в папке');
        return;
    }
    
    console.log(`Найдено видео файлов: ${videoFiles.length}\n`);
    
    const results = [];
    for (const file of videoFiles) {
        const filePath = path.join(folderPath, file);
        const result = await uploadFile(filePath);
        results.push(result);
    }
    
    // Итоговая статистика
    console.log('\n=== Итоги загрузки ===');
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`Успешно: ${successful}`);
    console.log(`Ошибок: ${failed}`);
    
    if (successful > 0) {
        console.log('\nЗагруженные файлы:');
        results.filter(r => r.success).forEach(r => {
            console.log(`  - ${r.fileName}: ${r.url}`);
        });
    }
}

/**
 * Основная функция
 */
async function main() {
    const inputPath = process.argv[2];
    
    if (!inputPath) {
        console.log('Использование:');
        console.log('  node scripts/upload-to-s3.js /path/to/video.mp4');
        console.log('  node scripts/upload-to-s3.js /path/to/folder');
        process.exit(1);
    }
    
    if (!fs.existsSync(inputPath)) {
        console.error(`Ошибка: путь не существует: ${inputPath}`);
        process.exit(1);
    }
    
    const stats = fs.statSync(inputPath);
    
    if (stats.isFile()) {
        // Загрузка одного файла
        await uploadFile(inputPath);
    } else if (stats.isDirectory()) {
        // Загрузка всех видео из папки
        await uploadFolder(inputPath);
    } else {
        console.error('Ошибка: указанный путь не является файлом или папкой');
        process.exit(1);
    }
}

// Запуск
main().catch(error => {
    console.error('Критическая ошибка:', error);
    process.exit(1);
});
