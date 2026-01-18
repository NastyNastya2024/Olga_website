/**
 * Главный файл приложения админки
 */

// Guards будут доступны через window после загрузки guards.js
// Используем функции напрямую, так как они используют глобальные функции

// Импортируем компоненты
const Layout = {
    render: () => {
        // Авторизация отключена - показываем все разделы всем
        const isUserAdmin = true;
        
        return `
            <div class="admin-layout">
                ${Sidebar.render(isUserAdmin)}
                <div class="admin-content">
                    ${Header.render(null)}
                    <main class="admin-main" id="main-content">
                        <!-- Контент страницы будет здесь -->
                    </main>
                </div>
            </div>
        `;
    }
};

const Sidebar = {
    render: (isAdmin) => {
        return `
            <aside class="sidebar">
                <div class="sidebar-header">
                    <h2>Admin Panel</h2>
                </div>
                <nav class="sidebar-nav">
                    <a href="#" data-route="/dashboard" class="sidebar-item">
                        <span class="sidebar-icon">📊</span>
                        <span>Дашборд</span>
                    </a>
                    <a href="#" data-route="/videos" class="sidebar-item">
                        <span class="sidebar-icon">🎥</span>
                        <span>Видео</span>
                    </a>
                    <a href="#" data-route="/students" class="sidebar-item">
                        <span class="sidebar-icon">👥</span>
                        <span>Ученики</span>
                    </a>
                    ${isAdmin ? `
                        <a href="#" data-route="/tours" class="sidebar-item">
                            <span class="sidebar-icon">✈️</span>
                            <span>Туры</span>
                        </a>
                        <a href="#" data-route="/blog" class="sidebar-item">
                            <span class="sidebar-icon">📝</span>
                            <span>Блог</span>
                        </a>
                    ` : ''}
                </nav>
            </aside>
        `;
    }
};

const Header = {
    render: (userData) => {
        return `
            <header class="admin-header">
                <h1 id="page-title">Админ-панель</h1>
                <div class="admin-header-actions">
                    <a href="../public/index.html" class="btn btn-primary">Вернуться на сайт</a>
                </div>
            </header>
        `;
    }
};

// Компоненты страниц
const LoginPage = {
    render: async () => {
        return `
            <div class="login-page">
                <div class="login-container">
                    <h1>Вход в админ-панель</h1>
                    <p class="login-subtitle">Введите ваши учетные данные для доступа</p>
                    
                    <form class="login-form" id="loginForm">
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" placeholder="admin@example.com">
                        </div>
                        
                        <div class="form-group">
                            <label for="password">Пароль</label>
                            <input type="password" id="password" name="password" placeholder="Введите пароль">
                        </div>
                        
                        <button type="submit" class="btn btn-primary" style="width: 100%;">Войти</button>
                        
                        <div class="login-footer">
                            <a href="../public/index.html" class="back-link">← Вернуться на главную</a>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },
    init: () => {
        const form = document.getElementById('loginForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                // Переход в админку без проверки авторизации
                router.navigate('/dashboard');
            });
        }
    }
};

const DashboardPage = {
    render: async () => {
        const layout = Layout.render();
        const mainContent = `
            <div id="dashboard-content">
                <div class="dashboard-stats" id="dashboardStats">
                    <div class="loading">Загрузка статистики...</div>
                </div>
            </div>
        `;
        return layout.replace('<main class="admin-main" id="main-content">', `<main class="admin-main" id="main-content">${mainContent}`);
    },
    
    init: async () => {
        document.getElementById('page-title').textContent = 'Дашборд';
        const statsDiv = document.getElementById('dashboardStats');
        
        try {
            const stats = await api.get('/admin/dashboard/stats');
            statsDiv.innerHTML = `
                <div class="card">
                    <h3>Видео</h3>
                    <p class="stat-value">${stats.videos || 0}</p>
                </div>
                <div class="card">
                    <h3>Ученики</h3>
                    <p class="stat-value">${stats.users || 0}</p>
                </div>
                <div class="card">
                    <h3>Туры</h3>
                    <p class="stat-value">${stats.tours || 0}</p>
                </div>
                <div class="card">
                    <h3>Статьи блога</h3>
                    <p class="stat-value">${stats.posts || 0}</p>
                </div>
            `;
        } catch (error) {
            statsDiv.innerHTML = '<div class="alert alert-error">Ошибка загрузки статистики</div>';
        }
    }
};

// Импортируем страницы из отдельных файлов
// (они будут загружены динамически)

// Обработчик выхода убран - авторизация отключена

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Регистрируем маршруты (guards отключены - авторизация не требуется)
    router.route('/', LoginPage.render);
    router.route('/login', LoginPage.render);
    router.route('/dashboard', async () => {
        const content = await DashboardPage.render();
        return content;
    });
    
    // Загружаем остальные страницы динамически
    loadPageComponents();
    
    // Инициализируем роутер
    router.init();
    
    // Вызываем init для текущей страницы после загрузки
    setTimeout(async () => {
        const path = window.location.pathname.replace(/\/admin/, '') || '/login';
        
        if (path === '/login' || path === '/') {
            if (LoginPage.init) LoginPage.init();
        } else if (path === '/dashboard') {
            if (DashboardPage.init) await DashboardPage.init();
        } else if (path === '/videos') {
            const VideosPage = await import('./pages/videos.js');
            if (VideosPage.default.init) await VideosPage.default.init();
        } else if (path === '/students') {
            const StudentsPage = await import('./pages/students.js');
            if (StudentsPage.default.init) await StudentsPage.default.init();
        } else if (path === '/tours') {
            const ToursPage = await import('./pages/tours.js');
            if (ToursPage.default.init) await ToursPage.default.init();
        } else if (path === '/blog') {
            const BlogPage = await import('./pages/blog.js');
            if (BlogPage.default.init) await BlogPage.default.init();
        }
    }, 300);
});

// Загрузка компонентов страниц
function loadPageComponents() {
    // Видео
    router.route('/videos', async () => {
        const VideosPage = await import('./pages/videos.js');
        const content = await VideosPage.default.render();
        return Layout.render() + content;
    });
    
    // Ученики
    router.route('/students', async () => {
        const StudentsPage = await import('./pages/students.js');
        const content = await StudentsPage.default.render();
        return Layout.render() + content;
    });
    
    // Туры
    router.route('/tours', async () => {
        const ToursPage = await import('./pages/tours.js');
        const content = await ToursPage.default.render();
        return Layout.render() + content;
    });
    
    // Блог
    router.route('/blog', async () => {
        const BlogPage = await import('./pages/blog.js');
        const content = await BlogPage.default.render();
        return Layout.render() + content;
    });
    
    // 403 - Доступ запрещен (показываем страницу логина)
    router.route('/403', async () => {
        return await LoginPage.render();
    });
    
    // 404 - Страница не найдена (показываем страницу логина)
    router.route('/404', async () => {
        return await LoginPage.render();
    });
}
