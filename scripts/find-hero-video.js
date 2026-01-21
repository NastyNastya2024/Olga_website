/**
 * Скрипт для поиска видео main.mp4 в S3 и получения его URL
 * 
 * Использование:
 * node scripts/find-hero-video.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const s3Service = require('../backend/services/s3-service');

async function findHeroVideo() {
    try {
        console.log('🔍 Поиск видео main.mp4 в S3...\n');

        // Ищем во всех папках
        const folders = ['videos', 'hero', 'uploads', ''];
        let foundVideo = null;

        for (const folder of folders) {
            try {
                console.log(`📁 Проверяю папку: ${folder || 'корень'}...`);
                const files = await s3Service.listFiles(folder);
                
                // Ищем файл с именем main.mp4
                const mainVideo = files.find(file => 
                    file.key.toLowerCase().includes('main') && 
                    (file.key.toLowerCase().endsWith('.mp4') || file.key.toLowerCase().endsWith('.mov'))
                );

                if (mainVideo) {
                    foundVideo = mainVideo;
                    console.log(`✅ Найдено видео: ${mainVideo.key}`);
                    break;
                }
            } catch (folderError) {
                console.error(`   Ошибка при проверке папки ${folder}: ${folderError.message}`);
                // Продолжаем проверку других папок
                continue;
            }
        }

        if (!foundVideo) {
            console.log('\n❌ Видео main.mp4 не найдено в S3.');
            console.log('\n💡 Доступные видео:');
            
            // Показываем все видео
            const allFiles = await s3Service.listFiles('');
            const videos = allFiles.filter(f => 
                f.key.toLowerCase().endsWith('.mp4') || 
                f.key.toLowerCase().endsWith('.mov') ||
                f.key.toLowerCase().endsWith('.webm')
            );
            
            if (videos.length > 0) {
                videos.forEach(v => {
                    console.log(`   - ${v.key}`);
                    console.log(`     URL: ${v.url}\n`);
                });
            } else {
                console.log('   Видео не найдено');
            }
            
            process.exit(1);
        }

        console.log('\n✅ Видео найдено!');
        console.log('\n📋 Информация:');
        console.log(`   Key: ${foundVideo.key}`);
        console.log(`   URL: ${foundVideo.url}`);
        console.log(`   Размер: ${(foundVideo.size / (1024 * 1024)).toFixed(2)} MB`);
        
        console.log(`\n💡 Используйте этот URL в public/index.html:`);
        console.log(`   <source src="${foundVideo.url}" type="video/mp4">`);

        return foundVideo;
    } catch (error) {
        console.error('❌ Ошибка поиска видео:', error.message);
        
        // Проверяем тип ошибки и даем полезные советы
        if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
            console.error('\n💡 Не удалось подключиться к MinIO. Убедитесь, что:');
            console.error('   1. MinIO запущен: docker-compose up -d minio');
            console.error('   2. MinIO доступен на порту 9000');
            console.error('   3. Проверьте статус: docker-compose ps');
            console.error('\n   Для запуска MinIO выполните:');
            console.error('   cd /Users/a1/Documents/GitHub/Olga_website');
            console.error('   docker-compose up -d minio');
        } else if (error.message.includes('NoSuchBucket')) {
            console.error('\n💡 Bucket не найден. Убедитесь, что:');
            console.error('   1. MinIO запущен: docker-compose up -d minio');
            console.error('   2. Bucket создан: docker-compose up minio-setup');
        }
        
        process.exit(1);
    }
}

findHeroVideo();
