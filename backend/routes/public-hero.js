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
            // Учитываем, что файлы могут иметь префикс с временной меткой (например: 1768836176435-main.mp4)
            const searchNameLower = searchName.toLowerCase();
            const targetVideo = files.find(file => {
                const fileName = file.key.toLowerCase();
                const fileNameWithoutPath = fileName.split('/').pop(); // Берем только имя файла без пути
                
                // Проверяем разные варианты:
                // 1. Полное имя файла содержит искомое название
                // 2. Имя файла без пути содержит искомое название
                // 3. Имя файла заканчивается на искомое название с расширением (например: practics.mp4)
                // 4. Имя файла содержит искомое название после дефиса (например: 1768836176435-practics.mp4)
                
                const hasVideoExtension = fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.webm');
                
                if (!hasVideoExtension) return false;
                
                // Проверяем, содержит ли имя файла искомое название
                const containsSearchName = fileName.includes(searchNameLower) || fileNameWithoutPath.includes(searchNameLower);
                
                // Проверяем, заканчивается ли имя файла на искомое название с расширением
                const endsWithSearchName = fileNameWithoutPath.endsWith(`${searchNameLower}.mp4`) || 
                                          fileNameWithoutPath.endsWith(`${searchNameLower}.mov`) ||
                                          fileNameWithoutPath.endsWith(`${searchNameLower}.webm`);
                
                // Проверяем, содержит ли имя файла искомое название после дефиса
                const hasSearchNameAfterDash = fileNameWithoutPath.includes(`-${searchNameLower}.`) || 
                                               fileNameWithoutPath.includes(`_${searchNameLower}.`);
                
                return containsSearchName || endsWithSearchName || hasSearchNameAfterDash;
            });
            
            // Логируем результат поиска для отладки
            if (!targetVideo) {
                console.log(`   ❌ Видео "${searchName}" не найдено в папке "${folder || 'корень'}"`);
                const videoFiles = files.map(f => f.key.split('/').pop()).filter(f => 
                    f.endsWith('.mp4') || f.endsWith('.mov') || f.endsWith('.webm')
                );
                if (videoFiles.length > 0) {
                    console.log(`   📋 Проверенные видео файлы:`, videoFiles);
                }
            }

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
 * Получить URL фонового видео главной страницы (ищет "main1" или "main")
 */
router.get('/video', async (req, res) => {
    try {
        console.log('🔍 Поиск hero видео (main1) в S3...');
        
        // Сначала ищем "main1"
        let { foundVideo, allVideos } = await findVideoByName('main1');
        let heroVideo = foundVideo;
        
        // Если не нашли "main1", пробуем "main"
        if (!heroVideo) {
            console.log('🔍 Видео "main1" не найдено, ищу "main"...');
            const { foundVideo: mainVideo, allVideos: mainVideos } = await findVideoByName('main');
            heroVideo = mainVideo;
            // Объединяем списки видео
            allVideos = [...new Set([...allVideos, ...mainVideos].map(v => v.key))].map(key => 
                [...allVideos, ...mainVideos].find(v => v.key === key)
            );
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

/**
 * GET /api/public/hero/video/practice
 * Получить URL фонового видео для страницы видео (ищет "practice" или "practics")
 */
router.get('/video/practice', async (req, res) => {
    try {
        console.log('🔍 Поиск видео practice в S3...');
        
        // Ищем видео с именем "practice" или "practics"
        // Сначала пробуем "practice"
        let { foundVideo: video, allVideos } = await findVideoByName('practice');
        
        // Если не нашли "practice", пробуем "practics"
        if (!video) {
            console.log('🔍 Видео "practice" не найдено, ищу "practics"...');
            const { foundVideo: practicsVideo, allVideos: practicsVideos } = await findVideoByName('practics');
            video = practicsVideo;
            // Объединяем списки видео
            allVideos = [...new Set([...allVideos, ...practicsVideos].map(v => v.key))].map(key => 
                [...allVideos, ...practicsVideos].find(v => v.key === key)
            );
        }

        if (!video) {
            console.log('⚠️ Видео practice не найдено. Доступные видео:');
            allVideos.forEach(v => console.log(`   - ${v.key}`));
            
            // Если есть любое видео, берем первое
            if (allVideos.length > 0) {
                video = allVideos[0];
                console.log(`📹 Используем первое доступное видео: ${video.key}`);
            } else {
                return res.json({
                    success: false,
                    message: 'Видео practice не найдено в S3',
                    url: null,
                    availableVideos: allVideos.map(v => ({ key: v.key, url: v.url }))
                });
            }
        }

        console.log(`✅ Возвращаю URL видео practice: ${video.url}`);
        res.json({
            success: true,
            url: video.url,
            key: video.key,
            size: video.size
        });
    } catch (error) {
        console.error('❌ Ошибка получения видео practice:', error);
        console.error('   Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении видео practice',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * GET /api/public/hero/video/club808
 * Получить URL фонового видео для страницы клуба (ищет "club2001" или "club2001.mp4")
 */
router.get('/video/club808', async (req, res) => {
    try {
        console.log('🔍 Поиск видео club2001 в S3...');
        
        // Ищем видео с именем "club2001" или "club2001.mp4"
        let { foundVideo: video, allVideos } = await findVideoByName('club2001');
        
        // Если не нашли "club2001", пробуем "Club2001" (с заглавной буквы)
        if (!video) {
            console.log('🔍 Видео "club2001" не найдено, ищу "Club2001"...');
            const { foundVideo: Club2001Video, allVideos: Club2001Videos } = await findVideoByName('Club2001');
            video = Club2001Video;
            // Объединяем списки видео
            allVideos = [...new Set([...allVideos, ...Club2001Videos].map(v => v.key))].map(key => 
                [...allVideos, ...Club2001Videos].find(v => v.key === key)
            );
        }
        
        // Если не нашли "Club2001", пробуем "club"
        if (!video) {
            console.log('🔍 Видео "Club2001" не найдено, ищу "club"...');
            const { foundVideo: clubVideo, allVideos: clubVideos } = await findVideoByName('club');
            video = clubVideo;
            // Объединяем списки видео
            allVideos = [...new Set([...allVideos, ...clubVideos].map(v => v.key))].map(key => 
                [...allVideos, ...clubVideos].find(v => v.key === key)
            );
        }

        if (!video) {
            console.log('⚠️ Видео club2001 не найдено. Доступные видео:');
            allVideos.forEach(v => console.log(`   - ${v.key}`));
            
            // Если есть любое видео, берем первое
            if (allVideos.length > 0) {
                video = allVideos[0];
                console.log(`📹 Используем первое доступное видео: ${video.key}`);
            } else {
                return res.json({
                    success: false,
                    message: 'Видео club2001 не найдено в S3',
                    url: null,
                    availableVideos: allVideos.map(v => ({ key: v.key, url: v.url }))
                });
            }
        }

        console.log(`✅ Возвращаю URL видео club2001: ${video.url}`);
        res.json({
            success: true,
            url: video.url,
            key: video.key,
            size: video.size
        });
    } catch (error) {
        console.error('❌ Ошибка получения видео club2001:', error);
        console.error('   Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении видео club2001',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * GET /api/public/hero/video/blog_1
 * Получить URL фонового видео для страницы блога (ищет "blog_1" или "blog")
 */
router.get('/video/blog_1', async (req, res) => {
    try {
        console.log('🔍 Поиск видео blog_1 в S3...');
        
        // Ищем видео с именем "blog_1"
        let { foundVideo: video, allVideos } = await findVideoByName('blog_1');
        
        // Если не нашли "blog_1", пробуем "blog1"
        if (!video) {
            console.log('🔍 Видео "blog_1" не найдено, ищу "blog1"...');
            const { foundVideo: blog1Video, allVideos: blog1Videos } = await findVideoByName('blog1');
            video = blog1Video;
            // Объединяем списки видео
            allVideos = [...new Set([...allVideos, ...blog1Videos].map(v => v.key))].map(key => 
                [...allVideos, ...blog1Videos].find(v => v.key === key)
            );
        }
        
        // Если не нашли "blog1", пробуем "blog"
        if (!video) {
            console.log('🔍 Видео "blog1" не найдено, ищу "blog"...');
            const { foundVideo: blogVideo, allVideos: blogVideos } = await findVideoByName('blog');
            video = blogVideo;
            // Объединяем списки видео
            allVideos = [...new Set([...allVideos, ...blogVideos].map(v => v.key))].map(key => 
                [...allVideos, ...blogVideos].find(v => v.key === key)
            );
        }

        if (!video) {
            console.log('⚠️ Видео blog_1 не найдено. Доступные видео:');
            allVideos.forEach(v => console.log(`   - ${v.key}`));
            
            // Если есть любое видео, берем первое
            if (allVideos.length > 0) {
                video = allVideos[0];
                console.log(`📹 Используем первое доступное видео: ${video.key}`);
            } else {
                return res.json({
                    success: false,
                    message: 'Видео blog_1 не найдено в S3',
                    url: null,
                    availableVideos: allVideos.map(v => ({ key: v.key, url: v.url }))
                });
            }
        }

        console.log(`✅ Возвращаю URL видео blog_1: ${video.url}`);
        res.json({
            success: true,
            url: video.url,
            key: video.key,
            size: video.size
        });
    } catch (error) {
        console.error('❌ Ошибка получения видео blog_1:', error);
        console.error('   Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении видео blog_1',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;
