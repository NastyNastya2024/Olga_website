/**
 * Guards для проверки доступа к маршрутам
 */

/**
 * Проверка авторизации
 */
async function authGuard() {
    if (!isAuthenticated()) {
        router.navigate('/login');
        return false;
    }
    return true;
}

/**
 * Проверка роли админа
 */
async function adminGuard() {
    if (!isAuthenticated()) {
        router.navigate('/login');
        return false;
    }
    
    if (!isAdmin()) {
        router.navigate('/403');
        return false;
    }
    
    return true;
}

/**
 * Редирект если уже авторизован (для страницы логина)
 */
async function guestGuard() {
    if (isAuthenticated()) {
        router.navigate('/videos');
        return false;
    }
    return true;
}
