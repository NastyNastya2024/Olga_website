/**
 * Роуты для получения hero видео (фоновое видео главной страницы)
 */

const express = require('express');
const s3Service = require('../services/s3-service');

const router = express.Router();

/**
 * Вспомогательная функция для поиска видео по имени
 */
async function findVideoByName(searchName, folders = ['hero', 'videos', 'uploads', '']) {
    let foundVideo = null;
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
            
            // Ищем файл с указанным именем
            const targetVideo = files.find(file => {
                const fileName = file.key.toLowerCase();
                return fileName.includes(searchName.toLowerCase()) && 
                       (fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.webm'));
            });

            if (targetVideo) {
                foundVideo = targetVideo;
                console.log(`✅ Найдено видео "${searchName}": ${targetVideo.key}`);
                break;
            }
        } catch (folderError) {
            console.error(`   Ошибка при проверке папки ${folder}:`, folderError.message);
            // Продолжаем поиск в других папках
        }
    }

    return { foundVideo, allVideos };
}

/**
 * GET /api/public/hero/video
 * Получить URL фонового видео главной страницы (ищет "main")
 */
router.get('/video', async (req, res) => {
    try {
        console.log('🔍 Поиск hero видео (main) в S3...');
        
        const { foundVideo, allVideos } = await findVideoByName('main');
        let heroVideo = foundVideo;

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

/**
 * GET /api/public/hero/video/retrits
 * Получить URL фонового видео для страницы ретритов (ищет "retrits" или "retrit")
 */
router.get('/video/retrits', async (req, res) => {
    try {
        console.log('🔍 Поиск видео ретритов в S3...');
        
        // Ищем видео с именем "retrits" или "retrit"
        // Сначала пробуем "retrits"
        let { foundVideo: video, allVideos } = await findVideoByName('retrits');
        
        // Если не нашли "retrits", пробуем "retrit"
        if (!video) {
            console.log('🔍 Видео "retrits" не найдено, ищу "retrit"...');
            const { foundVideo: retritVideo, allVideos: retritVideos } = await findVideoByName('retrit');
            video = retritVideo;
            // Объединяем списки видео
            allVideos = [...new Set([...allVideos, ...retritVideos].map(v => v.key))].map(key => 
                [...allVideos, ...retritVideos].find(v => v.key === key)
            );
        }

        if (!video) {
            console.log('⚠️ Видео ретритов не найдено. Доступные видео:');
            allVideos.forEach(v => console.log(`   - ${v.key}`));
            
            // Если есть любое видео, берем первое
            if (allVideos.length > 0) {
                video = allVideos[0];
                console.log(`📹 Используем первое доступное видео: ${video.key}`);
            } else {
                return res.json({
                    success: false,
                    message: 'Видео ретритов не найдено в S3',
                    url: null,
                    availableVideos: allVideos.map(v => ({ key: v.key, url: v.url }))
                });
            }
        }

        console.log(`✅ Возвращаю URL видео ретритов: ${video.url}`);
        res.json({
            success: true,
            url: video.url,
            key: video.key,
            size: video.size
        });
    } catch (error) {
        console.error('❌ Ошибка получения видео ретритов:', error);
        console.error('   Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении видео ретритов',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * GET /api/public/hero/video/practics
 * Получить URL фонового видео для страницы видео (ищет "practics" или "practice")
 */
router.get('/video/practics', async (req, res) => {
    try {
        console.log('🔍 Поиск видео practics в S3...');
        
        // Ищем видео с именем "practics" или "practice"
        // Сначала пробуем "practics"
        let { foundVideo: video, allVideos } = await findVideoByName('practics');
        
        // Если не нашли "practics", пробуем "practice"
        if (!video) {
            console.log('🔍 Видео "practics" не найдено, ищу "practice"...');
            const { foundVideo: practiceVideo, allVideos: practiceVideos } = await findVideoByName('practice');
            video = practiceVideo;
            // Объединяем списки видео
            allVideos = [...new Set([...allVideos, ...practiceVideos].map(v => v.key))].map(key => 
                [...allVideos, ...practiceVideos].find(v => v.key === key)
            );
        }

        if (!video) {
            console.log('⚠️ Видео practics не найдено. Доступные видео:');
            allVideos.forEach(v => console.log(`   - ${v.key}`));
            
            // Если есть любое видео, берем первое
            if (allVideos.length > 0) {
                video = allVideos[0];
                console.log(`📹 Используем первое доступное видео: ${video.key}`);
            } else {
                return res.json({
                    success: false,
                    message: 'Видео practics не найдено в S3',
                    url: null,
                    availableVideos: allVideos.map(v => ({ key: v.key, url: v.url }))
                });
            }
        }

        console.log(`✅ Возвращаю URL видео practics: ${video.url}`);
        res.json({
            success: true,
            url: video.url,
            key: video.key,
            size: video.size
        });
    } catch (error) {
        console.error('❌ Ошибка получения видео practics:', error);
        console.error('   Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении видео practics',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;
