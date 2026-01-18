/**
 * Скрипт управления видео
 */

let currentVideoId = null;

// Проверка авторизации
if (!isAuthenticated()) {
    window.location.href = 'login.html';
}

// Отображение информации о пользователе
const userData = getUserData();
if (userData) {
    document.getElementById('userEmail').textContent = userData.email;
}

// Показываем кнопку добавления только для админов
if (isAdmin()) {
    document.getElementById('addVideoBtn').style.display = 'inline-block';
}

// Загрузка списка видео
async function loadVideos() {
    const tbody = document.getElementById('videosTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Загрузка...</td></tr>';

    try {
        // Если админ - загружаем все видео, иначе только доступные
        const endpoint = isAdmin() ? '/admin/videos' : '/public/videos';
        const response = await api.get(endpoint);
        const videos = response.data || response;

        if (videos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Нет видео</td></tr>';
            return;
        }

        tbody.innerHTML = videos.map(video => `
            <tr>
                <td>${video.id}</td>
                <td>${video.title}</td>
                <td>${video.category || '-'}</td>
                <td><span class="status-badge ${video.status}">${video.status === 'published' ? 'Опубликовано' : 'Скрыто'}</span></td>
                <td>${video.access_type === 'open' ? 'Открыто' : 'По подписке'}</td>
                <td>
                    ${isAdmin() ? `
                        <button class="btn btn-primary" onclick="editVideo(${video.id})">Редактировать</button>
                        <button class="btn btn-danger" onclick="deleteVideo(${video.id})">Удалить</button>
                    ` : ''}
                    <a href="${video.video_url}" target="_blank" class="btn btn-success">Смотреть</a>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Ошибка загрузки данных</td></tr>';
    }
}

// Показать модальное окно добавления
function showAddVideoModal() {
    currentVideoId = null;
    document.getElementById('modalTitle').textContent = 'Добавить видео';
    document.getElementById('videoForm').reset();
    document.getElementById('videoModal').style.display = 'block';
}

// Закрыть модальное окно
function closeVideoModal() {
    document.getElementById('videoModal').style.display = 'none';
    currentVideoId = null;
}

// Редактировать видео
async function editVideo(id) {
    try {
        const video = await api.get(`/admin/videos/${id}`);
        currentVideoId = id;
        
        document.getElementById('modalTitle').textContent = 'Редактировать видео';
        document.getElementById('videoTitle').value = video.title || '';
        document.getElementById('videoDescription').value = video.description || '';
        document.getElementById('videoUrl').value = video.video_url || '';
        document.getElementById('videoStatus').value = video.status || 'published';
        document.getElementById('videoAccess').value = video.access_type || 'open';
        
        document.getElementById('videoModal').style.display = 'block';
    } catch (error) {
        alert('Ошибка загрузки видео: ' + error.message);
    }
}

// Удалить видео
async function deleteVideo(id) {
    if (!confirm('Вы уверены, что хотите удалить это видео?')) {
        return;
    }

    try {
        await api.delete(`/admin/videos/${id}`);
        loadVideos();
    } catch (error) {
        alert('Ошибка удаления: ' + error.message);
    }
}

// Сохранение видео
document.getElementById('videoForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!isAdmin()) {
        alert('Только администраторы могут добавлять видео');
        return;
    }

    const data = {
        title: document.getElementById('videoTitle').value,
        description: document.getElementById('videoDescription').value,
        video_url: document.getElementById('videoUrl').value,
        status: document.getElementById('videoStatus').value,
        access_type: document.getElementById('videoAccess').value,
    };

    try {
        if (currentVideoId) {
            await api.put(`/admin/videos/${currentVideoId}`, data);
        } else {
            await api.post('/admin/videos', data);
        }
        
        closeVideoModal();
        loadVideos();
    } catch (error) {
        alert('Ошибка сохранения: ' + error.message);
    }
});

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('videoModal');
    if (event.target === modal) {
        closeVideoModal();
    }
}

// Загружаем видео при загрузке страницы
loadVideos();
