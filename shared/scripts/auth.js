/**
 * Утилиты для работы с авторизацией
 */

/**
 * Сохранение токена
 */
function setToken(token) {
    localStorage.setItem('auth_token', token);
}

/**
 * Получение токена
 */
function getToken() {
    return localStorage.getItem('auth_token');
}

/**
 * Удаление токена
 */
function removeToken() {
    localStorage.removeItem('auth_token');
}

/**
 * Вход в систему
 */
async function login(email, password) {
    try {
        // Используем глобальный api клиент (должен быть загружен до auth.js)
        if (!window.api) {
            throw new Error('API клиент не загружен');
        }
        const response = await window.api.post('/admin/auth/login', { email, password });
        if (response.success && response.token) {
            setToken(response.token);
            if (response.user) {
                setUserData(response.user);
            }
            return response;
        }
        throw new Error(response.error || 'Ошибка авторизации');
    } catch (error) {
        throw error;
    }
}

/**
 * Сохранение данных пользователя
 */
function setUserData(userData) {
    localStorage.setItem('user_data', JSON.stringify(userData));
}

/**
 * Проверка роли пользователя
 */
function getUserRole() {
    const token = getToken();
    if (!token) return null;

    try {
        // Декодируем JWT токен (базовая реализация)
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role || null;
    } catch (error) {
        console.error('Ошибка декодирования токена:', error);
        return null;
    }
}

/**
 * Проверка является ли пользователь админом
 */
function isAdmin() {
    return getUserRole() === 'admin';
}

/**
 * Проверка авторизован ли пользователь
 */
function isAuthenticated() {
    return !!localStorage.getItem('auth_token');
}

/**
 * Получить данные пользователя из токена
 */
function getUserData() {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            id: payload.userId || payload.id,
            email: payload.email,
            role: payload.role,
        };
    } catch (error) {
        console.error('Ошибка получения данных пользователя:', error);
        return null;
    }
}

/**
 * Выход из системы
 */
async function logout() {
    try {
        // Отправляем запрос на сервер для выхода (опционально)
        if (window.api) {
            await window.api.post('/admin/auth/logout');
        }
    } catch (error) {
        console.error('Ошибка выхода:', error);
    } finally {
        removeToken();
        removeUserData();
        // Редирект на страницу логина
        if (window.router) {
            window.router.navigate('/login');
        } else {
            window.location.href = '/admin';
        }
    }
}

/**
 * Удаление данных пользователя
 */
function removeUserData() {
    localStorage.removeItem('user_data');
}

// Делаем функции доступными глобально
window.setToken = setToken;
window.getToken = getToken;
window.removeToken = removeToken;
window.login = login;
window.logout = logout;
window.setUserData = setUserData;
window.removeUserData = removeUserData;

// Экспорт для использования в модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setToken,
        getToken,
        removeToken,
        login,
        logout,
        setUserData,
        removeUserData,
        getUserRole,
        isAdmin,
        isAuthenticated,
        getUserData,
    };
}
