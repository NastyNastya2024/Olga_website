/**
 * Роуты для получения hero видео (фоновое видео главной страницы)
 */

const express = require('express');
const s3Service = require('../services/s3-service');

const router = express.Router();

/**
 * GET /api/public/hero/video
 * Получить URL фонового видео главной страницы
 */
router.get('/video', async (req, res) => {
    try {
        console.log('🔍 Поиск hero видео в S3...');
        
        // Ищем видео main.mp4 в разных папках
        const folders = ['hero', 'videos', 'uploads', ''];
        let heroVideo = null;
        let allVideos = [];

        for (const folder of folders) {
            try {
                console.log(`📁 Проверяю папку: ${folder || 'корень'}...`);
                const files = await s3Service.listFiles(folder);
                console.log(`   Найдено файлов: ${files.length}`);
                
                // Сохраняем все видео для отладки
                const videos = files.filter(file => {
                    const fileName = file.key.toLowerCase();
                    return fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.webm');
                });
                allVideos = allVideos.concat(videos);
                
                // Ищем файл с именем main.mp4 или main.mov
                const mainVideo = files.find(file => {
                    const fileName = file.key.toLowerCase();
                    return fileName.includes('main') && 
                           (fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.webm'));
                });

                if (mainVideo) {
                    heroVideo = mainVideo;
                    console.log(`✅ Найдено hero видео: ${mainVideo.key}`);
                    break;
                }
            } catch (folderError) {
                console.error(`   Ошибка при проверке папки ${folder}:`, folderError.message);
                // Продолжаем поиск в других папках
            }
        }

        if (!heroVideo) {
            console.log('⚠️ Hero видео не найдено. Доступные видео:');
            allVideos.forEach(v => console.log(`   - ${v.key}`));
            
            // Если есть любое видео, берем первое
            if (allVideos.length > 0) {
                heroVideo = allVideos[0];
                console.log(`📹 Используем первое доступное видео: ${heroVideo.key}`);
            } else {
                return res.json({
                    success: false,
                    message: 'Hero видео не найдено в S3',
                    url: null,
                    availableVideos: allVideos.map(v => ({ key: v.key, url: v.url }))
                });
            }
        }

        console.log(`✅ Возвращаю URL: ${heroVideo.url}`);
        res.json({
            success: true,
            url: heroVideo.url,
            key: heroVideo.key,
            size: heroVideo.size
        });
    } catch (error) {
        console.error('❌ Ошибка получения hero видео:', error);
        console.error('   Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении hero видео',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;
