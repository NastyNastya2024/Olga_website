/**
 * Роутер для SPA админки
 */

// Делаем router доступным глобально для guards
window.router = null;

class Router {
    constructor() {
        this.routes = [];
        this.currentRoute = null;
        this.currentComponent = null;
    }

    /**
     * Регистрация маршрута
     */
    route(path, component, guards = []) {
        this.routes.push({
            path,
            component,
            guards,
        });
    }

    /**
     * Проверка доступа к маршруту
     */
    async checkGuards(guards) {
        for (const guard of guards) {
            const result = await guard();
            if (!result) {
                return false;
            }
        }
        return true;
    }

    /**
     * Навигация по маршруту
     */
    async navigate(path) {
        // Нормализуем путь
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        // Находим маршрут
        const route = this.routes.find(r => r.path === path || this.matchRoute(r.path, path));
        
        if (!route) {
            console.warn('Маршрут не найден:', path);
            console.log('Доступные маршруты:', this.routes.map(r => r.path));
            // Если маршрут не найден, показываем страницу логина
            this.navigate('/login');
            return;
        }
        
        console.log('Найден маршрут:', path);

        // Проверяем guards
        if (route.guards.length > 0) {
            const hasAccess = await this.checkGuards(route.guards);
            if (!hasAccess) {
                return; // Guard сам сделает редирект
            }
        }

        // Обновляем URL без перезагрузки страницы
        const fullPath = '/admin' + path;
        window.history.pushState({}, '', fullPath);

        // Загружаем компонент
        this.currentRoute = route;
        let component;
        if (typeof route.component === 'function') {
            component = await route.component();
        } else {
            component = route.component;
        }
        await this.loadComponent(component);
        
        // Обновляем активный пункт меню
        this.updateActiveMenuItem(path);
    }

    /**
     * Проверка соответствия маршрута (поддержка параметров)
     */
    matchRoute(routePath, currentPath) {
        const routeParts = routePath.split('/');
        const pathParts = currentPath.split('/');

        if (routeParts.length !== pathParts.length) {
            return false;
        }

        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                continue; // Параметр маршрута
            }
            if (routeParts[i] !== pathParts[i]) {
                return false;
            }
        }

        return true;
    }

    /**
     * Извлечение параметров из URL
     */
    getParams(routePath, currentPath) {
        const params = {};
        const routeParts = routePath.split('/');
        const pathParts = currentPath.split('/');

        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                const paramName = routeParts[i].substring(1);
                params[paramName] = pathParts[i];
            }
        }

        return params;
    }

    /**
     * Загрузка компонента
     */
    async loadComponent(component) {
        const app = document.getElementById('app');
        if (!app) {
            console.error('Элемент #app не найден');
            return;
        }
        
        try {
            let html;
            if (typeof component === 'function') {
                html = await component();
            } else if (typeof component === 'string') {
                html = component;
            } else {
                html = '<div class="error">Ошибка загрузки компонента</div>';
            }
            
            app.innerHTML = html;
            
            // Вызываем init для текущей страницы после загрузки
            await this.initCurrentPage();
        } catch (error) {
            console.error('Ошибка загрузки компонента:', error);
            app.innerHTML = '<div class="error">Ошибка загрузки страницы: ' + error.message + '</div>';
        }
    }
    
    /**
     * Инициализация текущей страницы
     */
    async initCurrentPage() {
        const path = window.location.pathname.replace(/\/admin/, '') || '/login';
        
        // Небольшая задержка для гарантии готовности DOM
        await new Promise(resolve => setTimeout(resolve, 150));
        
        try {
            console.log('Инициализация страницы:', path);
            
            if (path === '/login' || path === '/') {
                if (window.LoginPage && window.LoginPage.init) {
                    window.LoginPage.init();
                }
            } else if (path === '/videos') {
                // Путь относительно router.js: admin/scripts/router.js -> admin/scripts/pages/videos.js
                const VideosPage = await import('./pages/videos.js');
                if (VideosPage.default && VideosPage.default.init) {
                    console.log('Вызываем init для страницы видео');
                    await VideosPage.default.init();
                } else {
                    console.error('VideosPage.default.init не найден');
                }
            } else if (path === '/students') {
                const StudentsPage = await import('./pages/students.js');
                if (StudentsPage.default && StudentsPage.default.init) {
                    await StudentsPage.default.init();
                }
            } else if (path === '/tours') {
                const ToursPage = await import('./pages/tours.js');
                if (ToursPage.default && ToursPage.default.init) {
                    await ToursPage.default.init();
                }
            } else if (path === '/blog') {
                const BlogPage = await import('./pages/blog.js');
                if (BlogPage.default && BlogPage.default.init) {
                    await BlogPage.default.init();
                }
            } else if (path === '/club') {
                const ClubPage = await import('./pages/club.js');
                if (ClubPage.default && ClubPage.default.init) {
                    await ClubPage.default.init();
                }
            } else if (path === '/club/prices' || path === '/club/reviews' || path === '/reviews') {
                // Редирект со старых маршрутов на новый
                this.navigate('/club');
                return;
            }
        } catch (error) {
            console.error('Ошибка инициализации страницы:', error);
            console.error('Путь:', path);
            console.error('Стек ошибки:', error.stack);
        }
    }

    /**
     * Обновление активного пункта меню
     */
    updateActiveMenuItem(path) {
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
            const route = item.getAttribute('data-route');
            if (route === path) {
                item.classList.add('active');
            }
        });
    }

    /**
     * Инициализация роутера
     */
    init() {
        // Обработка навигации через history API
        window.addEventListener('popstate', () => {
            const path = window.location.pathname.replace(/\/admin/, '') || '/login';
            this.navigate(path);
        });

        // Обработка кликов по ссылкам
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-route]') || e.target.closest('[data-route]')) {
                e.preventDefault();
                const link = e.target.closest('[data-route]') || e.target;
                const route = link.getAttribute('data-route');
                this.navigate(route);
            }
        });

        // Загружаем начальный маршрут
        let initialPath = window.location.pathname;
        
        console.log('Начальный путь из URL:', initialPath);
        
        // Если путь содержит /admin/, извлекаем маршрут после /admin
        if (initialPath.startsWith('/admin')) {
            initialPath = initialPath.replace('/admin', '') || '/';
        }
        
        // Убираем .html если есть
        initialPath = initialPath.replace(/\.html$/, '');
        
        // Если путь пустой или это корень/index.html, показываем логин
        if (!initialPath || initialPath === '/' || initialPath === '/index.html') {
            initialPath = '/login';
        }
        
        // Если запрашивается /dashboard, редиректим на /videos
        if (initialPath === '/dashboard') {
            initialPath = '/videos';
        }
        
        console.log('Обработанный путь:', initialPath);
        console.log('Зарегистрировано маршрутов:', this.routes.length);
        console.log('Доступные маршруты:', this.routes.map(r => r.path));
        
        // Небольшая задержка для гарантии что все маршруты зарегистрированы
        // Особенно важно при обновлении страницы, когда loadPageComponents() может еще выполняться
        setTimeout(() => {
            console.log('Навигация по пути:', initialPath);
            console.log('Маршрутов перед навигацией:', this.routes.length);
            this.navigate(initialPath);
        }, 100);
    }
}

// Создаем глобальный экземпляр роутера
const router = new Router();
window.router = router;
