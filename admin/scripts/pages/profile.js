/**
 * Страница "Мой профиль" для обычных пользователей
 */

export default {
    render: async () => {
        return `
            <div id="profile-page">
                <div class="page-header">
                    <h1>Мой профиль</h1>
                </div>

                <div class="admin-content">
                    <div class="card" style="max-width: 600px;">
                        <div class="card-header">
                            <h2 class="card-title">Личные данные</h2>
                        </div>
                        <div id="profileContent">
                            <div class="loading">Загрузка данных...</div>
                        </div>
                    </div>
                </div>
            </div>
            
            ${getProfileModal()}
        `;
    },
    
    init: async () => {
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = 'Мой профиль';
        }
        
        window.closeProfileModal = closeProfileModal;
        window.showEditProfileModal = showEditProfileModal;
        
        await loadProfile();
        setTimeout(() => {
            setupProfileForm();
        }, 100);
    }
};

function getProfileModal() {
    return `
        <div id="profileModal" class="modal" style="display: none;">
            <div class="modal-content" style="max-width: 600px;">
                <span class="close" onclick="closeProfileModal()">&times;</span>
                <h2>Редактировать профиль</h2>
                <form id="profileForm">
                    <div class="form-group">
                        <label>Имя</label>
                        <input type="text" id="profileName" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="profileEmail" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Текущий пароль</label>
                        <input type="password" id="currentPassword" placeholder="Введите текущий пароль для подтверждения">
                    </div>
                    
                    <div class="form-group">
                        <label>Новый пароль</label>
                        <input type="password" id="newPassword" placeholder="Оставьте пустым, чтобы не изменять">
                        <small style="color: #666; display: block; margin-top: 0.5rem;">
                            Введите новый пароль только если хотите его изменить
                        </small>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                </form>
            </div>
        </div>
    `;
}

async function loadProfile() {
    const content = document.getElementById('profileContent');
    if (!content) return;
    
    try {
        const userResponse = await api.get('/admin/users/me');
        const user = userResponse.data || userResponse;
        
        content.innerHTML = `
            <div style="padding: 1rem 0;">
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-weight: 600; color: #333; margin-bottom: 0.5rem;">Имя</label>
                    <div style="padding: 0.75rem; background: #f8f9fa; border-radius: 4px;">${user.name || '-'}</div>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-weight: 600; color: #333; margin-bottom: 0.5rem;">Email (логин)</label>
                    <div style="padding: 0.75rem; background: #f8f9fa; border-radius: 4px;">${user.email}</div>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-weight: 600; color: #333; margin-bottom: 0.5rem;">Роль</label>
                    <div style="padding: 0.75rem; background: #f8f9fa; border-radius: 4px;">${user.role === 'admin' ? 'Администратор' : 'Ученик'}</div>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-weight: 600; color: #333; margin-bottom: 0.5rem;">Тариф</label>
                    <div style="padding: 0.75rem; background: #f8f9fa; border-radius: 4px;">${user.tariff || 'Не указан'}</div>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-weight: 600; color: #333; margin-bottom: 0.5rem;">Дата регистрации</label>
                    <div style="padding: 0.75rem; background: #f8f9fa; border-radius: 4px;">
                        ${user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '-'}
                    </div>
                </div>
                
                <button class="btn btn-primary" onclick="showEditProfileModal()">Редактировать профиль</button>
            </div>
        `;
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        content.innerHTML = '<div class="empty-state">Ошибка загрузки данных</div>';
    }
}

async function showEditProfileModal() {
    try {
        const userResponse = await api.get('/admin/users/me');
        const user = userResponse.data || userResponse;
        
        document.getElementById('profileName').value = user.name || '';
        document.getElementById('profileEmail').value = user.email || '';
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        
        const modal = document.getElementById('profileModal');
        if (modal) {
            modal.style.display = 'block';
        }
    } catch (error) {
        alert('Ошибка загрузки данных: ' + error.message);
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (!modal) return;
    modal.style.display = 'none';
    
    const form = document.getElementById('profileForm');
    if (form) {
        form.reset();
    }
}

function setupProfileForm() {
    const form = document.getElementById('profileForm');
    if (!form) {
        setTimeout(setupProfileForm, 100);
        return;
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('profileName').value;
        const email = document.getElementById('profileEmail').value;
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        
        const data = {
            name,
            email,
        };
        
        // Если указан новый пароль, добавляем его
        if (newPassword && newPassword.trim() !== '') {
            if (!currentPassword || currentPassword.trim() === '') {
                alert('Для изменения пароля необходимо ввести текущий пароль');
                return;
            }
            data.currentPassword = currentPassword;
            data.password = newPassword;
        }
        
        try {
            await api.put('/admin/users/me', data);
            closeProfileModal();
            await loadProfile();
            alert('Профиль успешно обновлен');
        } catch (error) {
            alert('Ошибка сохранения: ' + error.message);
        }
    });
}
