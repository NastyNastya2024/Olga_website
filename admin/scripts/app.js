/**
 * Главный файл приложения админки
 */

// Guards будут доступны через window после загрузки guards.js
// Используем функции напрямую, так как они используют глобальные функции

// Импортируем компоненты
const Layout = {
    render: () => {
        const user = getUserData();
        const isUserAdmin = isAdmin();
        
        return `
            <div class="admin-layout">
                <div class="admin-content">
                    ${Header.render(user, isUserAdmin)}
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
        const userRole = getUserRole();
        const isStudent = userRole === 'student';
        
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
                    <a href="#" data-route="/chat" class="sidebar-item">
                        <span class="sidebar-icon">💬</span>
                        <span>Чат</span>
                    </a>
                    ${!isStudent ? `
                        <a href="#" data-route="/students" class="sidebar-item">
                            <span class="sidebar-icon">👥</span>
                            <span>Ученики</span>
                        </a>
                    ` : ''}
                    ${isAdmin ? `
                        <a href="#" data-route="/tours" class="sidebar-item">
                            <span class="sidebar-icon">✈️</span>
                            <span>Ретриты</span>
                        </a>
                        <a href="#" data-route="/blog" class="sidebar-item">
                            <span class="sidebar-icon">📝</span>
                            <span>Блог</span>
                        </a>
                        <a href="#" data-route="/club" class="sidebar-item">
                            <span class="sidebar-icon">💰</span>
                            <span>Клуб</span>
                        </a>
                        <a href="#" data-route="/pricing-tariffs" class="sidebar-item">
                            <span class="sidebar-icon">💳</span>
                            <span>Тарифы</span>
                        </a>
                        <a href="#" data-route="/review-images" class="sidebar-item">
                            <span class="sidebar-icon">⭐</span>
                            <span>Отзывы</span>
                        </a>
                    ` : ''}
                </nav>
            </aside>
        `;
    }
};

const Header = {
    render: (userData, isAdmin) => {
        const user = userData || getUserData();
        const userRole = getUserRole();
        const isStudent = userRole === 'student';
        
        return `
            <header class="admin-header">
                <div class="admin-header-top">
                    <div class="admin-header-left">
                        <a href="/" class="admin-logo-link">
                            <img src="/img/logo.png" alt="Olga Website" class="admin-logo">
                        </a>
                        <button class="admin-burger" aria-label="Меню">
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                    <div class="admin-header-actions">
                        ${user ? `
                            <span class="admin-user-name">${user.name || user.email}</span>
                        ` : ''}
                        <a href="/" class="btn btn-return-site">На сайт</a>
                        ${user ? `
                            <button onclick="handleLogout()" class="btn btn-logout">Выйти</button>
                        ` : ''}
                    </div>
                </div>
                <nav class="admin-top-nav">
                    <div class="burger-nav-links">
                        <a href="#" data-route="/videos" class="nav-item">
                            <span class="nav-icon">🎥</span>
                            <span>Видео</span>
                        </a>
                        <a href="#" data-route="/chat" class="nav-item">
                            <span class="nav-icon">💬</span>
                            <span>Чат</span>
                        </a>
                        ${!isStudent ? `
                            <a href="#" data-route="/students" class="nav-item">
                                <span class="nav-icon">👥</span>
                                <span>Ученики</span>
                            </a>
                        ` : ''}
                        ${isAdmin ? `
                            <a href="#" data-route="/tours" class="nav-item">
                                <span class="nav-icon">✈️</span>
                                <span>Ретриты</span>
                            </a>
                            <a href="#" data-route="/blog" class="nav-item">
                                <span class="nav-icon">📝</span>
                                <span>Блог</span>
                            </a>
                            <a href="#" data-route="/club" class="nav-item">
                                <span class="nav-icon">💰</span>
                                <span>Клуб</span>
                            </a>
                        <a href="#" data-route="/pricing-tariffs" class="nav-item">
                            <span class="nav-icon">💳</span>
                            <span>Тарифы</span>
                        </a>
                        <a href="#" data-route="/review-images" class="nav-item">
                            <span class="nav-icon">⭐</span>
                            <span>Отзывы</span>
                        </a>
                    ` : ''}
                    </div>
                    <div class="burger-menu-footer">
                        <a href="/" class="btn btn-return-site">На сайт</a>
                        ${user ? `
                            <button type="button" onclick="handleLogout()" class="btn btn-logout">Выйти</button>
                        ` : ''}
                    </div>
                </nav>
            </header>
        `;
    }
};

// Функция для выхода
window.handleLogout = async function() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        await logout();
    }
};

// Функция для выхода
window.handleLogout = async function() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        await logout();
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
    init: async () => {
        const form = document.getElementById('loginForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const submitButton = form.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                
                // Показываем загрузку
                submitButton.disabled = true;
                submitButton.textContent = 'Вход...';
                
                try {
                    await login(email, password);
                    // Успешный вход - переходим в админку
                    router.navigate('/videos');
                } catch (error) {
                    alert('Ошибка входа: ' + error.message);
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                }
            });
        }
    }
};

// DashboardPage удален - раздел дашборда больше не используется

// Импортируем страницы из отдельных файлов
// (они будут загружены динамически)

// Обработчик выхода убран - авторизация отключена

// Функция для переключения подменю клуба
window.toggleClubSubmenu = function(event) {
    event.preventDefault();
    const group = document.getElementById('clubGroup');
    if (group) {
        group.classList.toggle('active');
    }
};

function setupAdminBurgerMenu() {
    document.addEventListener('click', (event) => {
        const burger = document.querySelector('.admin-burger');
        const nav = document.querySelector('.admin-top-nav');

        if (!burger || !nav) return;

        const burgerClicked = event.target.closest('.admin-burger');
        const logoClicked = event.target.closest('.admin-logo-link');
        const navItemClicked = event.target.closest('.admin-top-nav .nav-item');

        if (burgerClicked) {
            burger.classList.toggle('active');
            nav.classList.toggle('active');
            return;
        }

        if (logoClicked) {
            if (window.matchMedia('(max-width: 768px)').matches) {
                event.preventDefault();
                burger.classList.toggle('active');
                nav.classList.toggle('active');
            }
            return;
        }

        if (navItemClicked || event.target.closest('.burger-menu-footer')) {
            burger.classList.remove('active');
            nav.classList.remove('active');
            return;
        }

        if (!nav.contains(event.target)) {
            burger.classList.remove('active');
            nav.classList.remove('active');
        }
    });
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    console.log('Инициализация приложения...');

    setupAdminBurgerMenu();
    
    // Регистрируем маршруты
    router.route('/', LoginPage.render, [guestGuard]);
    router.route('/login', LoginPage.render, [guestGuard]);
    
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
    // Видео (требует авторизации)
    router.route('/videos', async () => {
        const VideosPage = await import('./pages/videos.js');
        const content = await VideosPage.default.render();
        // Вставляем контент внутрь admin-main
        const layoutHtml = Layout.render();
        return layoutHtml.replace('<!-- Контент страницы будет здесь -->', content);
    }, [authGuard]);
    
    // Ученики (требует авторизации)
    router.route('/students', async () => {
        const StudentsPage = await import('./pages/students.js');
        const content = await StudentsPage.default.render();
        const layoutHtml = Layout.render();
        return layoutHtml.replace('<!-- Контент страницы будет здесь -->', content);
    }, [authGuard]);
    
    // Туры (требует авторизации и роли админа)
    router.route('/tours', async () => {
        const ToursPage = await import('./pages/tours.js');
        const content = await ToursPage.default.render();
        const layoutHtml = Layout.render();
        return layoutHtml.replace('<!-- Контент страницы будет здесь -->', content);
    }, [authGuard, adminGuard]);
    
    // Блог (требует авторизации и роли админа)
    router.route('/blog', async () => {
        const BlogPage = await import('./pages/blog.js');
        const content = await BlogPage.default.render();
        const layoutHtml = Layout.render();
        return layoutHtml.replace('<!-- Контент страницы будет здесь -->', content);
    }, [authGuard, adminGuard]);
    
    // Клуб (требует авторизации и роли админа)
    router.route('/club', async () => {
        const ClubPage = await import('./pages/club.js');
        const content = await ClubPage.default.render();
        const layoutHtml = Layout.render();
        return layoutHtml.replace('<!-- Контент страницы будет здесь -->', content);
    }, [authGuard, adminGuard]);
    
    // Тарифы (требует авторизации и роли админа)
    router.route('/pricing-tariffs', async () => {
        const PricingTariffsPage = await import('./pages/pricing-tariffs.js');
        const content = await PricingTariffsPage.default.render();
        const layoutHtml = Layout.render();
        return layoutHtml.replace('<!-- Контент страницы будет здесь -->', content);
    }, [authGuard, adminGuard]);
    
    // Чат (доступен всем авторизованным: ученики и админы)
    router.route('/chat', async () => {
        const ChatPage = await import('./pages/chat.js');
        const content = await ChatPage.default.render();
        const layoutHtml = Layout.render();
        return layoutHtml.replace('<!-- Контент страницы будет здесь -->', content);
    }, [authGuard]);
    
    // Отзывы (скриншоты для главной)
    router.route('/review-images', async () => {
        const ReviewImagesPage = await import('./pages/review-images.js');
        const content = await ReviewImagesPage.default.render();
        const layoutHtml = Layout.render();
        return layoutHtml.replace('<!-- Контент страницы будет здесь -->', content);
    }, [authGuard, adminGuard]);
    
    // 403 - Доступ запрещен (показываем страницу логина)
    router.route('/403', async () => {
        return await LoginPage.render();
    });
    
    // 404 - Страница не найдена (показываем страницу логина)
    router.route('/404', async () => {
        return await LoginPage.render();
    });
}
