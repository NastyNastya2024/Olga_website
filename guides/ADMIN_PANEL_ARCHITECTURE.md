# Архитектура админ-панели и загрузки видео

## 📋 Содержание

1. [Общая архитектура SPA](#общая-архитектура-spa)
2. [Роутинг и навигация](#роутинг-и-навигация)
3. [Загрузка видео - полный процесс](#загрузка-видео---полный-процесс)
4. [Технические детали](#технические-детали)
5. [Потоки данных](#потоки-данных)

---

## 🏗️ Общая архитектура SPA

### Структура файлов

```
admin/
├── index.html              # Единственная точка входа
├── scripts/
│   ├── app.js             # Главный файл приложения
│   ├── router.js           # Клиентский роутер
│   ├── guards.js           # Защита маршрутов (отключена)
│   └── pages/              # Модули страниц
│       ├── videos.js      # Страница видео (с загрузкой)
│       ├── students.js    # Страница учеников
│       ├── tours.js       # Страница туров
│       └── blog.js        # Страница блога
└── styles/
    ├── admin.css          # Основные стили
    └── modal.css          # Стили модальных окон
```

### Как работает SPA

#### 1. Точка входа: `index.html`

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Стили -->
</head>
<body>
    <!-- Пустой контейнер -->
    <div id="app">
        <div class="loading">Загрузка...</div>
    </div>
    
    <!-- Скрипты загружаются в порядке: -->
    <script src="../shared/scripts/api.js"></script>      <!-- API клиент -->
    <script src="../shared/scripts/auth.js"></script>     <!-- Авторизация -->
    <script src="scripts/guards.js"></script>             <!-- Guards -->
    <script src="scripts/router.js"></script>              <!-- Роутер -->
    <script src="scripts/app.js"></script>                 <!-- Главный файл -->
</body>
</html>
```

**Важно:** `index.html` - это единственный HTML файл. Все остальные "страницы" - это JavaScript модули.

#### 2. Инициализация: `app.js`

Когда страница загружается, происходит следующее:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // 1. Регистрация маршрутов
    router.route('/', LoginPage.render);
    router.route('/login', LoginPage.render);
    router.route('/dashboard', async () => {
        const content = await DashboardPage.render();
        return content;
    });
    
    // 2. Загрузка динамических страниц
    loadPageComponents(); // Регистрирует /videos, /students, /tours, /blog
    
    // 3. Инициализация роутера
    router.init(); // Загружает начальную страницу
});
```

#### 3. Компоненты страниц

Каждая страница - это ES6 модуль с двумя методами:

```javascript
export default {
    // Рендеринг HTML
    render: async () => {
        return `<div>HTML контент</div>`;
    },
    
    // Инициализация после загрузки DOM
    init: async () => {
        // Настройка обработчиков событий
        // Загрузка данных
        // Экспорт функций в window
    }
};
```

---

## 🧭 Роутинг и навигация

### Как работает роутер

#### 1. Регистрация маршрута

```javascript
router.route('/videos', async () => {
    // Загружаем модуль страницы
    const VideosPage = await import('./pages/videos.js');
    
    // Вызываем render() для получения HTML
    const content = await VideosPage.default.render();
    
    // Возвращаем HTML с Layout
    return Layout.render() + content;
});
```

#### 2. Навигация по маршруту

Когда пользователь кликает на пункт меню или переходит по URL:

```javascript
// В router.js
async navigate(path) {
    // 1. Нормализуем путь
    if (!path.startsWith('/')) {
        path = '/' + path;
    }
    
    // 2. Находим зарегистрированный маршрут
    const route = this.routes.find(r => r.path === path);
    
    // 3. Проверяем guards (если есть)
    if (route.guards.length > 0) {
        const hasAccess = await this.checkGuards(route.guards);
        if (!hasAccess) return;
    }
    
    // 4. Обновляем URL в браузере (без перезагрузки)
    window.history.pushState({}, '', '/admin' + path);
    
    // 5. Загружаем компонент
    const component = await route.component();
    await this.loadComponent(component);
    
    // 6. Обновляем активный пункт меню
    this.updateActiveMenuItem(path);
}
```

#### 3. Загрузка компонента

```javascript
async loadComponent(component) {
    const app = document.getElementById('app');
    
    // Получаем HTML из компонента
    const html = await component();
    
    // Вставляем в DOM
    app.innerHTML = html;
    
    // Вызываем init() для текущей страницы
    await this.initCurrentPage();
}
```

#### 4. Инициализация страницы

```javascript
async initCurrentPage() {
    const path = window.location.pathname.replace(/\/admin/, '');
    
    // Небольшая задержка для готовности DOM
    await new Promise(resolve => setTimeout(resolve, 150));
    
    if (path === '/videos') {
        // Динамически импортируем модуль
        const VideosPage = await import('./pages/videos.js');
        
        // Вызываем init()
        if (VideosPage.default.init) {
            await VideosPage.default.init();
        }
    }
    // ... аналогично для других страниц
}
```

### Обработка кликов

```javascript
// В router.js
document.addEventListener('click', (e) => {
    // Проверяем клик по ссылке с data-route
    if (e.target.matches('[data-route]') || e.target.closest('[data-route]')) {
        e.preventDefault(); // Отменяем стандартное поведение
        
        const link = e.target.closest('[data-route]') || e.target;
        const route = link.getAttribute('data-route');
        
        // Вызываем навигацию
        this.navigate(route);
    }
});
```

**Пример ссылки:**
```html
<a href="#" data-route="/videos" class="sidebar-item">Видео</a>
```

---

## 📹 Загрузка видео - полный процесс

### Шаг 1: Открытие формы

#### Пользователь нажимает "Добавить видео"

```javascript
// В videos.js
function showAddVideoModal() {
    // 1. Сбрасываем состояние
    currentVideoId = null;
    
    // 2. Обновляем заголовок модального окна
    document.getElementById('modalTitle').textContent = 'Добавить видео';
    
    // 3. Сбрасываем форму
    document.getElementById('videoForm').reset();
    
    // 4. Скрываем прогресс загрузки
    const uploadProgress = document.getElementById('uploadProgress');
    uploadProgress.style.display = 'none';
    
    // 5. Показываем модальное окно
    document.getElementById('videoModal').style.display = 'block';
}
```

**Функция доступна глобально:**
```javascript
// В init() страницы videos.js
window.showAddVideoModal = showAddVideoModal;
```

**HTML кнопки:**
```html
<button class="btn btn-primary" onclick="showAddVideoModal()">
    Добавить видео
</button>
```

### Шаг 2: Выбор файла

#### Пользователь выбирает видео файл

```javascript
// В setupVideoForm() в videos.js
const videoFileInput = document.getElementById('videoFile');

videoFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 1. Проверка размера файла (макс 20GB)
    const maxSize = 20 * 1024 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('Файл слишком большой. Максимальный размер: 20GB');
        return;
    }
    
    // 2. Показываем прогресс-бар
    uploadProgress.style.display = 'block';
    progressFill.style.width = '0%';
    uploadStatus.textContent = 'Подготовка к загрузке...';
    
    // 3. Создаем FormData
    const formData = new FormData();
    formData.append('file', file);
    
    // 4. Загружаем файл
    // ... см. следующий раздел
});
```

### Шаг 3: Загрузка файла в S3

#### Процесс загрузки с отслеживанием прогресса

```javascript
// В api.js
async uploadFile(endpoint, formData, onProgress) {
    const url = `${this.baseUrl}${endpoint}`; // http://localhost:5000/api/upload
    
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Отслеживание прогресса загрузки
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                const percentComplete = (e.loaded / e.total) * 100;
                onProgress(percentComplete); // Вызываем callback
            }
        });
        
        // Обработка успешной загрузки
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText);
                resolve(data);
            } else {
                reject(new Error('Ошибка загрузки'));
            }
        });
        
        // Обработка ошибок
        xhr.addEventListener('error', () => {
            reject(new Error('Ошибка сети'));
        });
        
        // Отправка запроса
        xhr.open('POST', url);
        xhr.send(formData);
    });
}
```

**Использование в videos.js:**

```javascript
const response = await api.uploadFile('/upload', formData, (percent) => {
    // Обновляем прогресс-бар в реальном времени
    progressFill.style.width = percent + '%';
    uploadStatus.textContent = `Загрузка ${file.name}... ${Math.round(percent)}%`;
});

// После успешной загрузки
if (response.success && response.data) {
    // Заполняем URL автоматически
    videoUrlInput.value = response.data.publicUrl || response.data.url;
    
    // Показываем успех
    progressFill.style.width = '100%';
    uploadStatus.textContent = '✅ Файл успешно загружен!';
    uploadStatus.style.color = '#27ae60';
    
    // Автоматически заполняем название из имени файла
    const titleInput = document.getElementById('videoTitle');
    if (titleInput && !titleInput.value) {
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        titleInput.value = fileName;
    }
}
```

### Шаг 4: Обработка на сервере

#### Backend получает файл

```javascript
// В backend/routes/upload.js
router.post('/', upload.single('file'), async (req, res) => {
    // 1. Проверка что файл загружен
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'Файл не был загружен'
        });
    }
    
    // 2. Определение папки (images или videos)
    const folder = req.file.mimetype.startsWith('image/') 
        ? 'images' 
        : 'videos';
    
    // 3. Загрузка в S3 через сервис
    const result = await s3Service.uploadFile(
        req.file.buffer,        // Буфер файла из памяти
        req.file.originalname,  // Оригинальное имя файла
        req.file.mimetype,      // MIME тип (video/mp4, etc)
        folder                  // Папка в S3
    );
    
    // 4. Возврат результата
    res.json({
        success: true,
        message: 'Файл успешно загружен',
        data: {
            url: result.url,                    // Полный URL
            key: result.key,                    // Ключ в S3
            fileName: result.fileName,          // Имя файла
            publicUrl: s3Service.getPublicUrl(result.key) // Публичный URL
        }
    });
});
```

### Шаг 5: Загрузка в S3

#### S3 сервис сохраняет файл

```javascript
// В backend/services/s3-service.js
async function uploadFile(buffer, originalName, mimetype, folder) {
    // 1. Генерация уникального имени файла
    const timestamp = Date.now();
    const fileName = `${timestamp}-${originalName}`;
    const key = `${folder}/${fileName}`;
    
    // 2. Параметры загрузки
    const params = {
        Bucket: BUCKET_NAME,        // olga-media
        Key: key,                    // videos/1234567890-video.mp4
        Body: buffer,               // Буфер файла
        ContentType: mimetype,      // video/mp4
        ACL: 'public-read'          // Публичный доступ
    };
    
    // 3. Загрузка в S3
    const data = await s3.upload(params).promise();
    
    // 4. Возврат результата
    return {
        url: data.Location,         // http://localhost:9000/olga-media/videos/...
        key: data.Key,              // videos/1234567890-video.mp4
        fileName: originalName
    };
}
```

### Шаг 6: Сохранение в базу данных

#### Пользователь заполняет форму и нажимает "Сохранить"

```javascript
// В videos.js
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Проверка что URL указан
    const videoUrl = videoUrlInput.value;
    if (!videoUrl) {
        alert('Пожалуйста, загрузите видео файл или укажите URL');
        return;
    }
    
    // 2. Сбор данных формы
    const data = {
        title: document.getElementById('videoTitle').value,
        description: document.getElementById('videoDescription').value,
        video_url: videoUrl,  // URL из S3 или вручную указанный
        status: document.getElementById('videoStatus').value,
        access_type: document.getElementById('videoAccess').value
    };
    
    // 3. Отправка на сервер
    try {
        if (currentVideoId) {
            // Редактирование существующего видео
            await api.put(`/admin/videos/${currentVideoId}`, data);
        } else {
            // Создание нового видео
            await api.post('/admin/videos', data);
        }
        
        // 4. Закрытие модального окна
        closeVideoModal();
        
        // 5. Обновление списка видео
        loadVideos();
    } catch (error) {
        alert('Ошибка сохранения: ' + error.message);
    }
});
```

---

## 🔧 Технические детали

### Модульная структура страниц

#### Пример: `pages/videos.js`

```javascript
export default {
    // Метод рендеринга HTML
    render: async () => {
        return `
            <div id="videos-page">
                <!-- Контент страницы -->
            </div>
            ${getVideoModal()}  <!-- Модальное окно -->
        `;
    },
    
    // Метод инициализации
    init: async () => {
        // 1. Обновление заголовка
        document.getElementById('page-title').textContent = 'Управление видео';
        
        // 2. Экспорт функций в window для onclick
        window.loadVideos = loadVideos;
        window.showAddVideoModal = showAddVideoModal;
        window.closeVideoModal = closeVideoModal;
        window.editVideo = editVideo;
        window.deleteVideo = deleteVideo;
        
        // 3. Загрузка данных
        await loadVideos();
        
        // 4. Настройка формы (с задержкой для готовности DOM)
        setTimeout(() => {
            setupVideoForm();
        }, 100);
    }
};

// Вспомогательные функции
function getVideoModal() { /* ... */ }
async function loadVideos() { /* ... */ }
function setupVideoForm() { /* ... */ }
function showAddVideoModal() { /* ... */ }
```

### Layout компонент

#### Общий макет для всех страниц

```javascript
// В app.js
const Layout = {
    render: () => {
        return `
            <div class="admin-layout">
                ${Sidebar.render(true)}      <!-- Боковое меню -->
                <div class="admin-content">
                    ${Header.render(null)}   <!-- Шапка -->
                    <main class="admin-main" id="main-content">
                        <!-- Сюда вставляется контент страницы -->
                    </main>
                </div>
            </div>
        `;
    }
};
```

**Как используется:**

```javascript
// В loadPageComponents()
router.route('/videos', async () => {
    const VideosPage = await import('./pages/videos.js');
    const content = await VideosPage.default.render();
    
    // Layout.render() добавляет sidebar и header
    // content добавляет контент страницы
    return Layout.render() + content;
});
```

### API клиент

#### Централизованный клиент для всех запросов

```javascript
// В shared/scripts/api.js
class ApiClient {
    constructor(baseUrl = 'http://localhost:5000/api') {
        this.baseUrl = baseUrl;
    }
    
    // Базовый метод для запросов
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const token = this.getToken();
        
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers
            }
        };
        
        const response = await fetch(url, config);
        // ... обработка ответа
    }
    
    // Метод для загрузки файлов с прогрессом
    async uploadFile(endpoint, formData, onProgress) {
        // Использует XMLHttpRequest для отслеживания прогресса
        // ... см. выше
    }
}

// Глобальный экземпляр
const api = new ApiClient();
```

---

## 📊 Потоки данных

### Поток 1: Загрузка видео файла

```
Пользователь
    ↓
Выбирает файл (input type="file")
    ↓
setupVideoForm() → addEventListener('change')
    ↓
Проверка размера файла
    ↓
Создание FormData
    ↓
api.uploadFile('/upload', formData, onProgress)
    ↓
XMLHttpRequest → POST http://localhost:5000/api/upload
    ↓
Backend: upload.js → multer обрабатывает файл
    ↓
s3Service.uploadFile(buffer, name, type, 'videos')
    ↓
AWS S3 SDK → MinIO (localhost:9000)
    ↓
Файл сохранен: videos/1234567890-video.mp4
    ↓
Возврат URL: http://localhost:9000/olga-media/videos/...
    ↓
Автоматическое заполнение поля URL в форме
    ↓
Пользователь видит успешную загрузку
```

### Поток 2: Сохранение видео в БД

```
Пользователь заполняет форму
    ↓
Нажимает "Сохранить"
    ↓
form.addEventListener('submit')
    ↓
Сбор данных: { title, description, video_url, status, access_type }
    ↓
api.post('/admin/videos', data)
    ↓
Backend: POST /api/admin/videos
    ↓
Сохранение в PostgreSQL
    ↓
Возврат созданного видео
    ↓
closeVideoModal() → закрытие формы
    ↓
loadVideos() → обновление списка
    ↓
Новое видео отображается в таблице
```

### Поток 3: Навигация между страницами

```
Пользователь кликает "Видео" в меню
    ↓
<a href="#" data-route="/videos">
    ↓
router.js → document.addEventListener('click')
    ↓
e.preventDefault() → отмена стандартного поведения
    ↓
router.navigate('/videos')
    ↓
Поиск маршрута в routes[]
    ↓
Вызов route.component() → async функция
    ↓
import('./pages/videos.js')
    ↓
VideosPage.default.render() → получение HTML
    ↓
Layout.render() + content → полный HTML
    ↓
app.innerHTML = html → вставка в DOM
    ↓
router.initCurrentPage()
    ↓
VideosPage.default.init() → инициализация
    ↓
Настройка обработчиков, загрузка данных
    ↓
Страница готова к использованию
```

---

## 🔍 Детали реализации

### Почему используется XMLHttpRequest для загрузки файлов?

**Fetch API не поддерживает отслеживание прогресса**, поэтому используется `XMLHttpRequest`:

```javascript
xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        onProgress(percent); // Callback для обновления UI
    }
});
```

### Почему функции экспортируются в window?

**Для работы с `onclick` атрибутами в HTML:**

```html
<button onclick="showAddVideoModal()">Добавить видео</button>
```

Браузер ищет функцию в глобальной области видимости (`window`), поэтому:

```javascript
window.showAddVideoModal = showAddVideoModal;
```

### Почему используется setTimeout для setupVideoForm?

**Гарантия готовности DOM:**

После `app.innerHTML = html` браузеру нужно время для парсинга и создания DOM элементов. `setTimeout` дает гарантию что элементы существуют:

```javascript
setTimeout(() => {
    setupVideoForm(); // Элементы точно существуют
}, 100);
```

### Почему Layout.render() + content?

**Композиция компонентов:**

- `Layout.render()` возвращает HTML с sidebar и header
- `content` возвращает HTML конкретной страницы
- Конкатенация создает полную страницу

```javascript
return Layout.render() + content;
// Результат: <div class="admin-layout">...sidebar...header...<div id="videos-page">...</div></div>
```

---

## 📝 Чек-лист проверки работы

### ✅ Загрузка страницы видео

- [ ] Открыт `admin/index.html`
- [ ] В консоли нет ошибок JavaScript
- [ ] Клик на "Видео" в меню работает
- [ ] Страница загружается без перезагрузки браузера
- [ ] Видна таблица с видео (или сообщение "Нет видео")
- [ ] Видна кнопка "Добавить видео"

### ✅ Модальное окно

- [ ] Кнопка "Добавить видео" открывает модальное окно
- [ ] Видно поле "Загрузить видео файл"
- [ ] Видно поле "Или укажите URL видео"
- [ ] Видны поля: Название, Описание, Статус, Тип доступа

### ✅ Загрузка файла

- [ ] Выбор файла показывает прогресс-бар
- [ ] Прогресс обновляется в реальном времени (0% → 100%)
- [ ] После загрузки URL заполняется автоматически
- [ ] Название заполняется из имени файла
- [ ] Показывается сообщение "✅ Файл успешно загружен!"

### ✅ Сохранение в БД

- [ ] После заполнения формы и нажатия "Сохранить" форма закрывается
- [ ] Видео появляется в таблице
- [ ] Можно редактировать видео
- [ ] Можно удалить видео

---

## 🐛 Отладка

### Включение подробных логов

В `router.js` уже есть логирование:

```javascript
console.log('Инициализация страницы:', path);
console.log('Вызываем init для страницы видео');
```

### Проверка в консоли браузера

```javascript
// Проверка что функции доступны
console.log('showAddVideoModal:', typeof window.showAddVideoModal);
console.log('loadVideos:', typeof window.loadVideos);

// Проверка элементов DOM
console.log('videoModal:', document.getElementById('videoModal'));
console.log('videoForm:', document.getElementById('videoForm'));
console.log('videoFile:', document.getElementById('videoFile'));

// Проверка API
console.log('api:', typeof api);
console.log('api.uploadFile:', typeof api.uploadFile);
```

### Проверка загрузки модулей

```javascript
// В консоли браузера
import('./pages/videos.js').then(module => {
    console.log('VideosPage модуль:', module);
    console.log('render метод:', typeof module.default.render);
    console.log('init метод:', typeof module.default.init);
});
```

---

## 📚 Связанные файлы

- `admin/index.html` - точка входа
- `admin/scripts/app.js` - главный файл приложения
- `admin/scripts/router.js` - роутинг
- `admin/scripts/pages/videos.js` - страница видео
- `shared/scripts/api.js` - API клиент
- `backend/routes/upload.js` - обработка загрузки
- `backend/services/s3-service.js` - работа с S3

---

## 🎯 Итоговая схема

```
┌─────────────────────────────────────────────────────────┐
│                    Пользователь                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              admin/index.html (SPA)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  scripts/router.js                                │  │
│  │  - Регистрация маршрутов                         │  │
│  │  - Навигация                                     │  │
│  │  - Загрузка компонентов                          │  │
│  └───────────────────────────────────────────────────┘  │
│                     │                                    │
│                     ▼                                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │  scripts/pages/videos.js                         │  │
│  │  - render() → HTML                                │  │
│  │  - init() → Инициализация                         │  │
│  │  - setupVideoForm() → Обработчики                 │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         Выбор файла → FormData                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  shared/scripts/api.js                                  │
│  - uploadFile() → XMLHttpRequest                       │
│  - Отслеживание прогресса                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  backend/routes/upload.js                               │
│  - multer → обработка файла                             │
│  - Проверка типа и размера                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  backend/services/s3-service.js                        │
│  - uploadFile() → AWS S3 SDK                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  MinIO (S3) - localhost:9000                            │
│  - Сохранение файла                                     │
│  - Генерация публичного URL                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Возврат URL → Заполнение формы → Сохранение в БД      │
└─────────────────────────────────────────────────────────┘
```

---

**Дата создания:** 2024-01-18  
**Версия:** 1.0
