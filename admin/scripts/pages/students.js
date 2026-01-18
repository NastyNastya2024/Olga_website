/**
 * Страница управления учениками/пользователями
 */

export default {
    render: async () => {
        // Авторизация отключена - показываем админский интерфейс со всеми функциями
        return `
            <div id="students-page">
                <div class="page-header">
                    <h1>Ученики</h1>
                </div>

                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Имя</th>
                                <th>Email</th>
                                <th>Роль</th>
                                <th>Тариф</th>
                                <th>Дата регистрации</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody">
                            <tr>
                                <td colspan="7" class="loading">Загрузка...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <script>
                (async function() {
                    document.getElementById('page-title').textContent = 'Ученики';
                    await loadAllUsers();
                })();
            </script>
        `;
    },
    
    init: async () => {
        await loadAllUsers();
    }
};

async function loadAllUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
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

function setupProfileForm() {
    const form = document.getElementById('profileForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
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
}

window.editUser = async function(id) {
    alert('Редактирование пользователя ' + id);
};

window.deleteUser = async function(id) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        return;
    }

    try {
        await api.delete(`/admin/users/${id}`);
        loadAllUsers();
    } catch (error) {
        alert('Ошибка удаления: ' + error.message);
    }
};
