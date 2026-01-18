/**
 * Скрипт управления учениками/пользователями
 */

// Проверка авторизации
if (!isAuthenticated()) {
    window.location.href = 'login.html';
}

const userData = getUserData();
if (userData) {
    document.getElementById('userEmail').textContent = userData.email;
}

// Определяем какой интерфейс показывать
if (isAdmin()) {
    // Показываем список всех пользователей для админа
    document.getElementById('adminUsersList').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'Ученики';
    loadAllUsers();
} else {
    // Показываем профиль для обычного пользователя
    document.getElementById('userProfile').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'Мой профиль';
    loadUserProfile();
}

// Загрузка всех пользователей (только для админа)
async function loadAllUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Загрузка...</td></tr>';

    try {
        const response = await api.get('/admin/users');
        const users = response.data || response;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Нет пользователей</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name || '-'}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${user.tariff || '-'}</td>
                <td>${new Date(user.created_at).toLocaleDateString('ru-RU')}</td>
                <td>
                    <button class="btn btn-primary" onclick="editUser(${user.id})">Редактировать</button>
                    <button class="btn btn-danger" onclick="deleteUser(${user.id})">Удалить</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Ошибка загрузки данных</td></tr>';
    }
}

// Загрузка профиля пользователя
async function loadUserProfile() {
    try {
        const user = await api.get('/admin/users/me');
        
        document.getElementById('userName').value = user.name || '';
        document.getElementById('userEmailInput').value = user.email || '';
        document.getElementById('userPhone').value = user.phone || '';
        
        if (user.photo_url) {
            document.getElementById('photoPreview').innerHTML = `
                <img src="${user.photo_url}" alt="Фото профиля" style="max-width: 200px; border-radius: 5px;">
            `;
        }
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
    }
}

// Сохранение профиля
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', document.getElementById('userName').value);
    formData.append('email', document.getElementById('userEmailInput').value);
    formData.append('phone', document.getElementById('userPhone').value);
    
    const photoFile = document.getElementById('userPhoto').files[0];
    if (photoFile) {
        formData.append('photo', photoFile);
    }

    try {
        await api.put('/admin/users/me', Object.fromEntries(formData));
        alert('Профиль сохранен');
        loadUserProfile();
    } catch (error) {
        alert('Ошибка сохранения: ' + error.message);
    }
});

// Редактирование пользователя (только для админа)
async function editUser(id) {
    // TODO: Реализовать модальное окно редактирования
    alert('Редактирование пользователя ' + id);
}

// Удаление пользователя (только для админа)
async function deleteUser(id) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        return;
    }

    try {
        await api.delete(`/admin/users/${id}`);
        loadAllUsers();
    } catch (error) {
        alert('Ошибка удаления: ' + error.message);
    }
}
