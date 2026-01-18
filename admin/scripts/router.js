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
            // Если маршрут не найден, показываем страницу логина
            this.navigate('/login');
            return;
        }

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
        
        if (typeof component === 'function') {
            app.innerHTML = await component();
        } else if (typeof component === 'string') {
            app.innerHTML = component;
        } else {
            app.innerHTML = '<div class="error">Ошибка загрузки компонента</div>';
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

        // Загружаем начальный маршрут (показываем страницу логина по умолчанию)
        let initialPath = window.location.pathname.replace(/\/admin/, '');
        if (!initialPath || initialPath === '/') {
            initialPath = '/login';
        }
        this.navigate(initialPath);
    }
}

// Создаем глобальный экземпляр роутера
const router = new Router();
window.router = router;
