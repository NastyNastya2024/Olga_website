/**
 * Скрипт для переноса видео с Яндекс Диска в Yandex Object Storage
 * 
 * Использование:
 * 1. С токеном OAuth (рекомендуется):
 *    node scripts/transfer-yandex-disk-to-s3.js YOUR_YANDEX_DISK_TOKEN
 * 
 * 2. С публичной ссылкой (если папка публичная):
 *    node scripts/transfer-yandex-disk-to-s3.js --public https://disk.yandex.ru/d/sFQ2rh32hVWWKA
 * 
 * Получить токен: https://oauth.yandex.ru/
 */

const https = require('https');
const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const s3Service = require('../backend/services/s3-service');

// ID папки из URL: https://disk.yandex.ru/d/sFQ2rh32hVWWKA
const PUBLIC_FOLDER_ID = 'sFQ2rh32hVWWKA';

/**
 * Скачивание файла по URL
 */
function downloadFile(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Редирект
                return downloadFile(response.headers.location).then(resolve).catch(reject);
            }
            
            if (response.statusCode !== 200) {
                return reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
            }
            
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * Получение списка файлов из публичной папки Яндекс Диска через API
 */
async function getPublicFolderFiles(folderId, token = null) {
    const apiUrl = token 
        ? `https://cloud-api.yandex.net/v1/disk/resources?path=disk:/${folderId}&limit=1000`
        : `https://cloud-api.yandex.net/v1/disk/public/resources?public_key=${folderId}&limit=1000`;
    
    const headers = {};
    if (token) {
        headers['Authorization'] = `OAuth ${token}`;
    }
    
    return new Promise((resolve, reject) => {
        https.get(apiUrl, { headers }, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.error) {
                        return reject(new Error(json.error));
                    }
                    resolve(json);
                } catch (error) {
                    reject(new Error(`Ошибка парсинга ответа: ${error.message}`));
                }
            });
        }).on('error', reject);
    });
}

/**
 * Получение ссылки на скачивание файла
 */
async function getDownloadLink(filePath, token = null, folderId = null) {
    let apiUrl;
    
    if (token) {
        // С токеном - используем обычный API
        apiUrl = `https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodeURIComponent(filePath)}`;
    } else {
        // Для публичной папки - используем public API
        // filePath должен быть относительным от корня папки
        const relativePath = filePath.startsWith('disk:/') 
            ? filePath.replace(/^disk:\/[^\/]+\//, '')
            : filePath;
        apiUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${folderId || PUBLIC_FOLDER_ID}&path=${encodeURIComponent(relativePath)}`;
    }
    
    const headers = {};
    if (token) {
        headers['Authorization'] = `OAuth ${token}`;
    }
    
    return new Promise((resolve, reject) => {
        https.get(apiUrl, { headers }, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.error) {
                        return reject(new Error(`API Error: ${json.error} (${json.description || ''})`));
                    }
                    if (!json.href) {
                        return reject(new Error('Ссылка на скачивание не получена'));
                    }
                    resolve(json.href);
                } catch (error) {
                    reject(new Error(`Ошибка парсинга ответа: ${error.message}. Ответ: ${data.substring(0, 200)}`));
                }
            });
        }).on('error', reject);
    });
}

/**
 * Перенос одного файла с Яндекс Диска в Object Storage
 */
async function transferFile(file, token = null, folderId = null, targetFolder = 'videos') {
    try {
        console.log(`\n📥 Обработка: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        
        // Определяем путь к файлу
        // Для публичных папок используем относительный путь от корня папки
        let filePath = file.path || file.name;
        if (!token && filePath.startsWith('disk:/')) {
            // Для публичных папок убираем префикс disk:/folderId/
            filePath = filePath.replace(/^disk:\/[^\/]+\//, '');
        }
        
        // Получаем ссылку на скачивание
        const downloadUrl = await getDownloadLink(filePath, token, folderId);
        console.log(`   Получена ссылка на скачивание`);
        
        // Скачиваем файл
        console.log(`   Скачивание...`);
        const fileBuffer = await downloadFile(downloadUrl);
        console.log(`   ✅ Скачано: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        
        // Определяем MIME тип
        const ext = path.extname(file.name).toLowerCase();
        let mimeType = 'video/mp4';
        if (ext === '.webm') mimeType = 'video/webm';
        else if (ext === '.mov') mimeType = 'video/quicktime';
        else if (ext === '.avi') mimeType = 'video/x-msvideo';
        else if (ext === '.mkv') mimeType = 'video/x-matroska';
        
        // Загружаем в Object Storage
        console.log(`   📤 Загрузка в Object Storage...`);
        const result = await s3Service.uploadFile(fileBuffer, file.name, mimeType, targetFolder);
        
        console.log(`   ✅ Загружено в Object Storage`);
        console.log(`   🔗 URL: ${result.url}`);
        console.log(`   📋 Key: ${result.key}`);
        
        return {
            success: true,
            fileName: file.name,
            url: result.url,
            key: result.key,
            size: fileBuffer.length,
        };
    } catch (error) {
        console.error(`   ❌ Ошибка: ${error.message}`);
        return {
            success: false,
            fileName: file.name,
            error: error.message,
        };
    }
}

/**
 * Основная функция переноса
 */
async function transferFromYandexDisk(token = null, folderId = PUBLIC_FOLDER_ID, targetFolder = 'videos') {
    try {
        console.log('🚀 Начало переноса видео с Яндекс Диска в Object Storage\n');
        console.log(`📁 Папка Яндекс Диска: ${folderId}`);
        console.log(`📦 Целевая папка в Object Storage: ${targetFolder}\n`);
        
        // Получаем список файлов
        console.log('📋 Получение списка файлов...');
        const folderInfo = await getPublicFolderFiles(folderId, token);
        
        if (!folderInfo._embedded || !folderInfo._embedded.items) {
            console.error('❌ Папка пуста или недоступна');
            return;
        }
        
        // Фильтруем только видео файлы
        const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
        const videoFiles = folderInfo._embedded.items.filter(item => {
            const ext = path.extname(item.name).toLowerCase();
            return videoExtensions.includes(ext);
        });
        
        console.log(`✅ Найдено видео файлов: ${videoFiles.length}\n`);
        
        if (videoFiles.length === 0) {
            console.log('⚠️  Видео файлы не найдены');
            return;
        }
        
        // Переносим каждый файл
        const results = [];
        for (let i = 0; i < videoFiles.length; i++) {
            const file = videoFiles[i];
            console.log(`\n[${i + 1}/${videoFiles.length}]`);
            const result = await transferFile(file, token, folderId, targetFolder);
            results.push(result);
        }
        
        // Итоговая статистика
        console.log('\n' + '='.repeat(80));
        console.log('\n📊 Итоги переноса:\n');
        
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        console.log(`✅ Успешно: ${successful.length}`);
        console.log(`❌ Ошибок: ${failed.length}`);
        
        if (successful.length > 0) {
            console.log('\n📋 Загруженные файлы:');
            successful.forEach((r, i) => {
                console.log(`\n${i + 1}. ${r.fileName}`);
                console.log(`   URL: ${r.url}`);
                console.log(`   Key: ${r.key}`);
                console.log(`   Размер: ${(r.size / 1024 / 1024).toFixed(2)} MB`);
            });
        }
        
        if (failed.length > 0) {
            console.log('\n❌ Ошибки:');
            failed.forEach((r, i) => {
                console.log(`\n${i + 1}. ${r.fileName}`);
                console.log(`   Ошибка: ${r.error}`);
            });
        }
        
    } catch (error) {
        console.error('\n❌ Критическая ошибка:', error.message);
        
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            console.log('\n💡 Совет: Проверьте токен OAuth или убедитесь, что папка публичная');
            console.log('   Получить токен: https://oauth.yandex.ru/');
        }
        
        process.exit(1);
    }
}

// Парсинг аргументов командной строки
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Использование:');
    console.log('  1. С токеном OAuth (рекомендуется):');
    console.log('     node scripts/transfer-yandex-disk-to-s3.js YOUR_YANDEX_DISK_TOKEN');
    console.log('');
    console.log('  2. С публичной ссылкой:');
    console.log('     node scripts/transfer-yandex-disk-to-s3.js --public https://disk.yandex.ru/d/sFQ2rh32hVWWKA');
    console.log('');
    console.log('  3. Указать целевую папку в Object Storage:');
    console.log('     node scripts/transfer-yandex-disk-to-s3.js YOUR_TOKEN videos');
    console.log('');
    console.log('Получить токен OAuth: https://oauth.yandex.ru/');
    process.exit(1);
}

let token = null;
let folderId = PUBLIC_FOLDER_ID;
let targetFolder = 'videos';

if (args[0] === '--public') {
    // Режим публичной папки
    if (args[1]) {
        const url = args[1];
        const match = url.match(/\/d\/([^\/\?]+)/);
        if (match) {
            folderId = match[1];
        }
    }
    targetFolder = args[2] || 'videos';
} else {
    // Режим с токеном
    token = args[0];
    targetFolder = args[1] || 'videos';
}

// Запуск переноса
transferFromYandexDisk(token, folderId, targetFolder).catch(error => {
    console.error('Критическая ошибка:', error);
    process.exit(1);
});
