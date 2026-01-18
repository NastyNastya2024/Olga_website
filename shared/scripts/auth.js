/**
 * Утилиты для работы с авторизацией
 */

/**
 * Проверка роли пользователя
 */
function getUserRole() {
    const token = localStorage.getItem('auth_token');
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
function logout() {
    localStorage.removeItem('auth_token');
    // Определяем правильный путь в зависимости от текущей страницы
    const isAdmin = window.location.pathname.includes('/admin/');
    if (isAdmin) {
        window.location.href = '../admin/login.html';
    } else {
        window.location.href = 'admin/login.html';
    }
}

// Экспорт для использования в модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getUserRole,
        isAdmin,
        isAuthenticated,
        getUserData,
        logout,
    };
}
