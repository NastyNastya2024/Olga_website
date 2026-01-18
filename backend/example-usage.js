/**
 * Примеры использования S3 сервиса
 */

const s3Service = require('./services/s3-service');
const fs = require('fs');

// Пример 1: Загрузка файла
async function exampleUpload() {
  try {
    // Читаем файл (в реальном приложении это будет из multer или другого источника)
    const fileBuffer = fs.readFileSync('./test-image.jpg');
    
    const result = await s3Service.uploadFile(
      fileBuffer,
      'test-image.jpg',
      'image/jpeg',
      'images' // папка в S3
    );

    console.log('Файл загружен:', result);
    console.log('URL:', result.url);
    console.log('Key:', result.key);
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

// Пример 2: Получение файла
async function exampleGetFile() {
  try {
    const key = 'images/1234567890-test-image.jpg';
    const file = await s3Service.getFile(key);
    
    console.log('Файл получен:', {
      contentType: file.contentType,
      size: file.contentLength,
    });
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

// Пример 3: Удаление файла
async function exampleDeleteFile() {
  try {
    const key = 'images/1234567890-test-image.jpg';
    const result = await s3Service.deleteFile(key);
    
    console.log('Файл удален:', result);
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

// Пример 4: Получение публичного URL
function exampleGetPublicUrl() {
  const key = 'images/1234567890-test-image.jpg';
  const url = s3Service.getPublicUrl(key);
  
  console.log('Публичный URL:', url);
}

// Пример 5: Генерация временного URL (presigned)
function examplePresignedUrl() {
  const key = 'images/1234567890-test-image.jpg';
  const url = s3Service.getPresignedUrl(key, 3600); // URL действителен 1 час
  
  console.log('Presigned URL:', url);
}

// Пример 6: Проверка существования файла
async function exampleFileExists() {
  try {
    const key = 'images/1234567890-test-image.jpg';
    const exists = await s3Service.fileExists(key);
    
    console.log('Файл существует:', exists);
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

// Пример 7: Список файлов в папке
async function exampleListFiles() {
  try {
    const files = await s3Service.listFiles('images/');
    
    console.log('Файлы в папке images:');
    files.forEach(file => {
      console.log(`- ${file.key} (${file.size} bytes)`);
    });
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

// Раскомментируйте нужный пример для запуска
// exampleUpload();
// exampleGetFile();
// exampleDeleteFile();
// exampleGetPublicUrl();
// examplePresignedUrl();
// exampleFileExists();
// exampleListFiles();

module.exports = {
  exampleUpload,
  exampleGetFile,
  exampleDeleteFile,
  exampleGetPublicUrl,
  examplePresignedUrl,
  exampleFileExists,
  exampleListFiles,
};
