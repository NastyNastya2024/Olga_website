/**
 * Скрипт для загрузки фонового видео главной страницы в S3
 * 
 * Использование:
 * node scripts/upload-hero-video.js
 * 
 * Или с указанием файла:
 * node scripts/upload-hero-video.js video/main.mp4
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const s3Service = require('../backend/services/s3-service');

async function uploadHeroVideo(videoPath = 'video/main.mp4') {
    try {
        const fullPath = path.join(__dirname, '..', videoPath);
        
        // Проверяем существование файла
        if (!fs.existsSync(fullPath)) {
            console.error(`❌ Файл не найден: ${fullPath}`);
            process.exit(1);
        }

        console.log(`📤 Загрузка видео: ${videoPath}`);
        console.log(`📁 Полный путь: ${fullPath}`);

        // Читаем файл
        const fileBuffer = fs.readFileSync(fullPath);
        const fileName = path.basename(videoPath);
        const mimeType = 'video/mp4';

        // Загружаем в S3 в папку "hero" для фоновых видео
        const result = await s3Service.uploadFile(
            fileBuffer,
            fileName,
            mimeType,
            'hero' // Специальная папка для hero видео
        );

        console.log('\n✅ Видео успешно загружено в S3!');
        console.log(`\n📋 Информация:`);
        console.log(`   URL: ${result.url}`);
        console.log(`   Key: ${result.key}`);
        console.log(`   Bucket: ${result.bucket}`);
        
        console.log(`\n💡 Используйте этот URL в коде:`);
        console.log(`   ${result.url}`);
        
        console.log(`\n📝 Обновите public/index.html:`);
        console.log(`   <source src="${result.url}" type="video/mp4">`);

        return result;
    } catch (error) {
        console.error('❌ Ошибка загрузки видео:', error.message);
        process.exit(1);
    }
}

// Запуск
const videoPath = process.argv[2] || 'video/main.mp4';
uploadHeroVideo(videoPath);
