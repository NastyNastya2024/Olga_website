/**
 * Утилита для сохранения данных в JSON файлы
 * Позволяет сохранять данные между перезапусками сервера
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const FILES = {
  videos: path.join(DATA_DIR, 'videos.json'),
  users: path.join(DATA_DIR, 'users.json'),
  tours: path.join(DATA_DIR, 'tours.json'),
  blog: path.join(DATA_DIR, 'blog.json'),
  reviews: path.join(DATA_DIR, 'reviews.json'),
  clubPrices: path.join(DATA_DIR, 'club-prices.json'),
  clubEvents: path.join(DATA_DIR, 'club-events.json'),
  lessonTariffs: path.join(DATA_DIR, 'lesson-tariffs.json'),
};

// Создаем директорию для данных, если её нет
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Загрузить данные из файла
 */
function loadData(fileKey) {
  const filePath = FILES[fileKey];
  if (!filePath) {
    throw new Error(`Неизвестный ключ файла: ${fileKey}`);
  }

  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Ошибка загрузки данных из ${filePath}:`, error);
  }

  // Возвращаем значение по умолчанию
  return getDefaultData(fileKey);
}

/**
 * Сохранить данные в файл
 */
function saveData(fileKey, data) {
  const filePath = FILES[fileKey];
  if (!filePath) {
    throw new Error(`Неизвестный ключ файла: ${fileKey}`);
  }

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Ошибка сохранения данных в ${filePath}:`, error);
    return false;
  }
}

/**
 * Получить данные по умолчанию
 */
function getDefaultData(fileKey) {
  switch (fileKey) {
    case 'videos':
      return { items: [], nextId: 1 };
    case 'users':
      return {
        items: [
          {
            id: 1,
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin',
            tariff: null,
            assigned_videos: [],
            program_notes: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ],
        nextId: 2
      };
    case 'tours':
      return { items: [], nextId: 1 };
    case 'blog':
      return { items: [], nextId: 1 };
    case 'reviews':
      return { items: [], nextId: 1 };
    case 'clubPrices':
      return {
        price_1_month: null,
        price_3_months: null,
        price_6_months: null,
        description_1_month: '',
        description_3_months: '',
        description_6_months: '',
      };
    case 'clubEvents':
      return { items: [], nextId: 1 };
    case 'lessonTariffs':
      return { items: [], nextId: 1 };
    default:
      return { items: [], nextId: 1 };
  }
}

module.exports = {
  loadData,
  saveData,
  FILES,
};
