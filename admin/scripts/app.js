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
                    <a href="/" class="btn btn-primary">Вернуться на сайт</a>
                </div>
            </header>
        `;
    }
};

// Компоненты страниц
// Делаем доступными глобально для роутера
window.LoginPage = {
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
                router.navigate('/videos');
            });
        }
    }
};

// DashboardPage удален - раздел дашборда больше не используется

// Импортируем страницы из отдельных файлов
// (они будут загружены динамически)

// Обработчик выхода убран - авторизация отключена

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    console.log('Инициализация приложения...');
    
    // Регистрируем маршруты (guards отключены - авторизация не требуется)
    router.route('/', LoginPage.render);
    router.route('/login', LoginPage.render);
    
    // Загружаем остальные страницы динамически
    loadPageComponents();
    
    console.log('✅ Зарегистрировано маршрутов:', router.routes.length);
    console.log('✅ Маршруты:', router.routes.map(r => r.path));
    
    // Инициализируем роутер (он сам вызовет init для текущей страницы через loadComponent)
    // Используем небольшую задержку для гарантии что все маршруты зарегистрированы
    setTimeout(() => {
        console.log('🚀 Инициализация роутера...');
        router.init();
    }, 10);
    
    // Дополнительная инициализация для страниц, которые уже загружены (login)
    // Для остальных страниц init вызывается через router.initCurrentPage()
});

// Загрузка компонентов страниц
function loadPageComponents() {
    // Видео
    router.route('/videos', async () => {
        const VideosPage = await import('./pages/videos.js');
        const content = await VideosPage.default.render();
        // Вставляем контент внутрь admin-main
        const layoutHtml = Layout.render();
        return layoutHtml.replace('<!-- Контент страницы будет здесь -->', content);
    });
    
    // Ученики
    router.route('/students', async () => {
        const StudentsPage = await import('./pages/students.js');
        const content = await StudentsPage.default.render();
        const layoutHtml = Layout.render();
        return layoutHtml.replace('<!-- Контент страницы будет здесь -->', content);
    });
    
    // Туры
    router.route('/tours', async () => {
        const ToursPage = await import('./pages/tours.js');
        const content = await ToursPage.default.render();
        const layoutHtml = Layout.render();
        return layoutHtml.replace('<!-- Контент страницы будет здесь -->', content);
    });
    
    // Блог
    router.route('/blog', async () => {
        const BlogPage = await import('./pages/blog.js');
        const content = await BlogPage.default.render();
        const layoutHtml = Layout.render();
        return layoutHtml.replace('<!-- Контент страницы будет здесь -->', content);
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
