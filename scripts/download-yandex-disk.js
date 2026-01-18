/**
 * Скрипт для скачивания файлов с Яндекс Диска
 * 
 * Требуется установка: npm install yandex-disk
 * 
 * Использование:
 * node scripts/download-yandex-disk.js YOUR_YANDEX_DISK_TOKEN /path/to/save
 */

const YandexDisk = require('yandex-disk');
const fs = require('fs');
const path = require('path');

/**
 * Скачивание файлов с Яндекс Диска
 */
async function downloadFromYandexDisk(token, savePath) {
    const disk = new YandexDisk(token);
    
    // ID папки из URL
    const folderId = 'piDW3EhXQ8n46Q';
    
    console.log('Подключение к Яндекс Диску...');
    
    try {
        // Получаем информацию о папке
        const folderInfo = await disk.resources.get({
            path: `disk:/${folderId}`,
        });
        
        console.log(`Папка: ${folderInfo.name}`);
        console.log(`Файлов: ${folderInfo._embedded.items.length}\n`);
        
        // Создаем папку для сохранения если её нет
        if (!fs.existsSync(savePath)) {
            fs.mkdirSync(savePath, { recursive: true });
        }
        
        // Фильтруем только видео файлы
        const videoFiles = folderInfo._embedded.items.filter(item => {
            const ext = path.extname(item.name).toLowerCase();
            return ['.mp4', '.webm', '.mov', '.avi', '.mkv'].includes(ext);
        });
        
        console.log(`Найдено видео файлов: ${videoFiles.length}\n`);
        
        // Скачиваем каждый файл
        for (const file of videoFiles) {
            const filePath = path.join(savePath, file.name);
            
            console.log(`Скачивание: ${file.name}...`);
            
            try {
                const downloadUrl = await disk.resources.download({
                    path: file.path,
                });
                
                // Здесь нужно использовать downloadUrl для скачивания файла
                // Для этого можно использовать axios или другой HTTP клиент
                console.log(`  URL: ${downloadUrl.href}`);
                console.log(`  Сохранение в: ${filePath}`);
                
                // TODO: Реализовать скачивание по URL
                // Можно использовать axios или node-fetch
                
            } catch (error) {
                console.error(`  Ошибка скачивания ${file.name}:`, error.message);
            }
        }
        
    } catch (error) {
        console.error('Ошибка:', error.message);
        console.log('\nПримечание: Для использования этого скрипта нужен токен Яндекс Диска.');
        console.log('Получить токен можно здесь: https://oauth.yandex.ru/');
    }
}

// Основная функция
const token = process.argv[2];
const savePath = process.argv[3] || './downloads';

if (!token) {
    console.log('Использование:');
    console.log('  node scripts/download-yandex-disk.js YOUR_YANDEX_DISK_TOKEN [save_path]');
    console.log('\nПолучить токен: https://oauth.yandex.ru/');
    process.exit(1);
}

downloadFromYandexDisk(token, savePath);
