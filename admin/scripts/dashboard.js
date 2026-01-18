/**
 * Скрипт дашборда
 */

// Проверка авторизации
if (!isAuthenticated()) {
    window.location.href = 'login.html';
}

// Проверка роли админа
if (!isAdmin()) {
    window.location.href = 'profile.html';
}

// Отображение информации о пользователе
const userData = getUserData();
if (userData) {
    document.getElementById('userEmail').textContent = userData.email;
}

// Загрузка статистики
async function loadStats() {
    try {
        const stats = await api.get('/admin/dashboard/stats');
        
        document.getElementById('videosCount').textContent = stats.videos || 0;
        document.getElementById('studentsCount').textContent = stats.users || 0;
        document.getElementById('toursCount').textContent = stats.tours || 0;
        document.getElementById('blogCount').textContent = stats.posts || 0;
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// Загружаем статистику при загрузке страницы
loadStats();
