/**
 * Скрипт авторизации
 */

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');
    
    errorDiv.style.display = 'none';
    
    try {
        const response = await api.post('/admin/auth/login', { email, password });
        
        if (response.token) {
            api.setToken(response.token);
            
            // Перенаправляем в зависимости от роли
            const userRole = response.user?.role || 'student';
            if (userRole === 'admin') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'profile.html';
            }
        }
    } catch (error) {
        errorDiv.textContent = error.message || 'Ошибка входа. Проверьте данные.';
        errorDiv.style.display = 'block';
    }
});
