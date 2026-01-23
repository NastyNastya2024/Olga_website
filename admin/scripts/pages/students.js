/**
 * Страница управления учениками/пользователями
 */

export default {
    render: async () => {
        return `
            <div id="students-page">
                <div class="page-header">
                    <h1>Ученики</h1>
                    <button class="btn btn-primary" onclick="showAddUserModal()">Добавить пользователя</button>
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
                                <th>Назначенные видео</th>
                                <th>Дата регистрации</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody">
                            <tr>
                                <td colspan="8" class="loading">Загрузка...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            ${getUserModal()}
        `;
    },
    
    init: async () => {
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = 'Ученики';
        }
        
        window.loadAllUsers = loadAllUsers;
        window.editUser = editUser;
        window.deleteUser = deleteUser;
        window.closeUserModal = closeUserModal;
        window.showAddUserModal = showAddUserModal;
        
        await loadAllUsers();
        setTimeout(() => {
            setupUserForm();
        }, 100);
    }
};

function getUserModal() {
    return `
        <div id="userModal" class="modal" style="display: none;">
            <div class="modal-content" style="max-width: 800px;">
                <span class="close" onclick="closeUserModal()">&times;</span>
                <h2 id="modalTitle">Редактировать ученика</h2>
                <form id="userForm">
                    <div class="form-group">
                        <label>Имя</label>
                        <input type="text" id="userName" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="userEmail" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Пароль</label>
                        <input type="password" id="userPassword" placeholder="" required>
                        <small id="passwordHint" style="color: #666; display: block; margin-top: 0.5rem;">
                            Введите новый пароль только если хотите его изменить
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label>Роль</label>
                        <select id="userRole">
                            <option value="student">Ученик</option>
                            <option value="admin">Администратор</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Тариф</label>
                        <input type="text" id="userTariff" placeholder="Например: 1 месяц, 3 месяца">
                    </div>
                    
                    <div class="form-group">
                        <label>Назначенные видео</label>
                        <div id="videosSelectContainer">
                            <div class="loading">Загрузка списка видео...</div>
                        </div>
                        <small style="color: #666; display: block; margin-top: 0.5rem;">
                            Выберите видео из списка всех загруженных на платформу
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label>Программа / Комментарии</label>
                        <textarea id="userProgramNotes" rows="8" placeholder="Напишите программу или комментарии для ученика..."></textarea>
                        <small style="color: #666; display: block; margin-top: 0.5rem;">
                            Здесь можно указать индивидуальную программу, рекомендации, комментарии по тренировкам
                        </small>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                </form>
            </div>
        </div>
    `;
}

let currentUserId = null;
let allVideos = [];

async function loadAllUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="8" class="loading">Загрузка...</td></tr>';

    try {
        const response = await api.get('/admin/users');
        const users = response.data || response;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Нет пользователей</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => {
            const assignedVideosCount = user.assigned_videos ? user.assigned_videos.length : 0;
            const videosText = assignedVideosCount > 0 
                ? `${assignedVideosCount} ${assignedVideosCount === 1 ? 'видео' : 'видео'}` 
                : 'Нет';
            
            return `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.name || '-'}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>${user.tariff || '-'}</td>
                    <td>${videosText}</td>
                    <td>${user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '-'}</td>
                    <td>
                        <button class="btn btn-edit" onclick="editUser(${user.id})">Редактировать</button>
                        <button class="btn btn-danger" onclick="deleteUser(${user.id})">Удалить</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Ошибка загрузки данных</td></tr>';
    }
}

async function loadAllVideos() {
    try {
        const response = await api.get('/admin/videos');
        allVideos = response.data || response;
        return allVideos;
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
        return [];
    }
}

function showAddUserModal() {
    currentUserId = null;
    
    document.getElementById('modalTitle').textContent = 'Добавить пользователя';
    document.getElementById('userName').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('userPassword').value = '';
    document.getElementById('userPassword').required = true;
    document.getElementById('userPassword').placeholder = 'Введите пароль';
    const passwordHint = document.getElementById('passwordHint');
    if (passwordHint) {
        passwordHint.textContent = 'Пароль обязателен для нового пользователя';
    }
    document.getElementById('userRole').value = 'student';
    document.getElementById('userTariff').value = '';
    document.getElementById('userProgramNotes').value = '';
    
    // Загружаем список всех видео
    loadAllVideos().then(videos => {
        renderVideosSelect(videos, []);
    });
    
    const userModal = document.getElementById('userModal');
    if (userModal) {
        userModal.style.display = 'block';
    }
}

async function editUser(id) {
    try {
        const user = await api.get(`/admin/users/${id}`);
        currentUserId = id;
        
        document.getElementById('modalTitle').textContent = `Редактировать: ${user.name || user.email}`;
        document.getElementById('userName').value = user.name || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userPassword').value = ''; // Пароль не показываем, поле всегда пустое
        document.getElementById('userPassword').required = false;
        document.getElementById('userPassword').placeholder = 'Оставьте пустым, чтобы не изменять';
        const passwordHint = document.getElementById('passwordHint');
        if (passwordHint) {
            passwordHint.textContent = 'Введите новый пароль только если хотите его изменить';
        }
        document.getElementById('userRole').value = user.role || 'student';
        document.getElementById('userTariff').value = user.tariff || '';
        document.getElementById('userProgramNotes').value = user.program_notes || '';
        
        // Загружаем список всех видео
        const videos = await loadAllVideos();
        renderVideosSelect(videos, user.assigned_videos || []);
        
        const userModal = document.getElementById('userModal');
        if (userModal) {
            userModal.style.display = 'block';
        }
    } catch (error) {
        alert('Ошибка загрузки пользователя: ' + error.message);
    }
}

function renderVideosSelect(videos, selectedVideoIds = []) {
    const container = document.getElementById('videosSelectContainer');
    if (!container) return;
    
    if (videos.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет доступных видео</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="videos-select-list" style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 0.5rem;">
            ${videos.map(video => {
                const isSelected = selectedVideoIds.includes(video.id);
                return `
                    <label style="display: flex; align-items: center; padding: 0.5rem; cursor: pointer; border-bottom: 1px solid #f0f0f0;">
                        <input type="checkbox" 
                               value="${video.id}" 
                               ${isSelected ? 'checked' : ''}
                               style="margin-right: 0.75rem;">
                        <div style="flex: 1;">
                            <div style="font-weight: 500;">${video.title || 'Без названия'}</div>
                            ${video.description ? `<div style="font-size: 0.85rem; color: #666; margin-top: 0.25rem;">${video.description.substring(0, 60)}${video.description.length > 60 ? '...' : ''}</div>` : ''}
                        </div>
                    </label>
                `;
            }).join('')}
        </div>
    `;
}

function closeUserModal() {
    const userModal = document.getElementById('userModal');
    if (!userModal) return;
    userModal.style.display = 'none';
    currentUserId = null;
    
    const form = document.getElementById('userForm');
    if (form) {
        form.reset();
        // Очищаем поле пароля при закрытии модального окна
        const passwordField = document.getElementById('userPassword');
        if (passwordField) {
            passwordField.value = '';
            passwordField.required = false;
        }
    }
}

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

function setupUserForm() {
    const form = document.getElementById('userForm');
    if (!form) {
        setTimeout(setupUserForm, 100);
        return;
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Собираем выбранные видео
        const selectedVideos = [];
        const checkboxes = document.querySelectorAll('#videosSelectContainer input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            selectedVideos.push(parseInt(checkbox.value));
        });
        
        const password = document.getElementById('userPassword').value;
        
        const data = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            role: document.getElementById('userRole').value,
            tariff: document.getElementById('userTariff').value || null,
            assigned_videos: selectedVideos,
            program_notes: document.getElementById('userProgramNotes').value,
        };
        
        // Добавляем пароль
        if (password && password.trim() !== '') {
            data.password = password;
        }
        
        try {
            if (currentUserId) {
                // Редактирование существующего пользователя
                if (!data.password) {
                    // Если пароль не указан при редактировании, не отправляем его
                    delete data.password;
                }
                await api.put(`/admin/users/${currentUserId}`, data);
            } else {
                // Создание нового пользователя
                if (!data.password || data.password.trim() === '') {
                    alert('Пароль обязателен для нового пользователя');
                    return;
                }
                await api.post('/admin/users', data);
            }
            closeUserModal();
            loadAllUsers();
        } catch (error) {
            alert('Ошибка сохранения: ' + error.message);
        }
    });
}
