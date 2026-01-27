/**
 * Скрипт для проверки размера данных в S3 (MinIO)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const s3Service = require('../backend/services/s3-service');

async function checkS3Size() {
    try {
        console.log('🔍 Проверка размера данных в S3...\n');
        
        // Получаем список всех файлов
        const allFiles = await s3Service.listFiles('');
        
        if (allFiles.length === 0) {
            console.log('📦 В S3 нет загруженных файлов');
            return;
        }
        
        // Группируем по типам
        const videos = [];
        const images = [];
        const other = [];
        
        let totalSize = 0;
        
        allFiles.forEach(file => {
            totalSize += file.size;
            
            const key = file.key.toLowerCase();
            if (key.includes('video') || key.endsWith('.mp4') || key.endsWith('.webm') || 
                key.endsWith('.mov') || key.endsWith('.avi') || key.endsWith('.mkv')) {
                videos.push(file);
            } else if (key.includes('image') || key.endsWith('.jpg') || key.endsWith('.jpeg') || 
                       key.endsWith('.png') || key.endsWith('.gif') || key.endsWith('.webp')) {
                images.push(file);
            } else {
                other.push(file);
            }
        });
        
        // Функция для форматирования размера
        function formatSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
        }
        
        // Выводим статистику
        console.log('📊 Статистика хранилища S3:\n');
        console.log(`Всего файлов: ${allFiles.length}`);
        console.log(`Общий размер: ${formatSize(totalSize)} (${totalSize} байт)\n`);
        
        if (videos.length > 0) {
            const videosSize = videos.reduce((sum, f) => sum + f.size, 0);
            console.log(`🎥 Видео:`);
            console.log(`   Файлов: ${videos.length}`);
            console.log(`   Размер: ${formatSize(videosSize)}`);
            console.log(`   Средний размер: ${formatSize(videosSize / videos.length)}\n`);
        }
        
        if (images.length > 0) {
            const imagesSize = images.reduce((sum, f) => sum + f.size, 0);
            console.log(`🖼️  Изображения:`);
            console.log(`   Файлов: ${images.length}`);
            console.log(`   Размер: ${formatSize(imagesSize)}`);
            console.log(`   Средний размер: ${formatSize(imagesSize / images.length)}\n`);
        }
        
        if (other.length > 0) {
            const otherSize = other.reduce((sum, f) => sum + f.size, 0);
            console.log(`📄 Другие файлы:`);
            console.log(`   Файлов: ${other.length}`);
            console.log(`   Размер: ${formatSize(otherSize)}\n`);
        }
        
        // Топ-5 самых больших файлов
        const sortedFiles = [...allFiles].sort((a, b) => b.size - a.size);
        console.log('📈 Топ-5 самых больших файлов:');
        sortedFiles.slice(0, 5).forEach((file, index) => {
            console.log(`   ${index + 1}. ${file.key}`);
            console.log(`      Размер: ${formatSize(file.size)}`);
        });
        
    } catch (error) {
        console.error('❌ Ошибка при проверке S3:', error.message);
        if (error.message.includes('ECONNREFUSED')) {
            console.error('\n💡 Убедитесь, что MinIO запущен:');
            console.error('   docker compose up -d minio');
        }
        process.exit(1);
    }
}

// Запускаем проверку
checkS3Size();
