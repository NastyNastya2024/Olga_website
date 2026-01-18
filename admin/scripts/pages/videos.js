/**
 * Страница управления видео
 */

export default {
    render: async () => {
        // Авторизация отключена - показываем кнопку добавления всем
        return `
            <div id="videos-page">
                <div class="page-header">
                    <h1>Видео</h1>
                    <button class="btn btn-primary" onclick="showAddVideoModal()">Добавить видео</button>
                </div>

                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Название</th>
                                <th>Категория</th>
                                <th>Статус</th>
                                <th>Доступ</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody id="videosTableBody">
                            <tr>
                                <td colspan="6" class="loading">Загрузка...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            ${isUserAdmin ? getVideoModal() : ''}
            
            <script>
                (async function() {
                    document.getElementById('page-title').textContent = 'Управление видео';
                    await loadVideos();
                })();
            </script>
        `;
    },
    
    init: async () => {
        await loadVideos();
        setupVideoForm();
    }
};

function getVideoModal() {
    return `
        <div id="videoModal" class="modal" style="display: none;">
            <div class="modal-content">
                <span class="close" onclick="closeVideoModal()">&times;</span>
                <h2 id="modalTitle">Добавить видео</h2>
                <form id="videoForm">
                    <div class="form-group">
                        <label>Название</label>
                        <input type="text" id="videoTitle" required>
                    </div>
                    <div class="form-group">
                        <label>Описание</label>
                        <textarea id="videoDescription"></textarea>
                    </div>
                    <div class="form-group">
                        <label>URL видео</label>
                        <input type="url" id="videoUrl" required>
                    </div>
                    <div class="form-group">
                        <label>Статус</label>
                        <select id="videoStatus">
                            <option value="published">Опубликовано</option>
                            <option value="hidden">Скрыто</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Тип доступа</label>
                        <select id="videoAccess">
                            <option value="open">Открыто</option>
                            <option value="subscription">По подписке</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                </form>
            </div>
        </div>
    `;
}

let currentVideoId = null;

async function loadVideos() {
    const tbody = document.getElementById('videosTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Загрузка...</td></tr>';

    try {
        // Используем админский endpoint (авторизация отключена)
        const endpoint = '/admin/videos';
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
                    <button class="btn btn-primary" onclick="editVideo(${video.id})">Редактировать</button>
                    <button class="btn btn-danger" onclick="deleteVideo(${video.id})">Удалить</button>
                    <a href="${video.video_url}" target="_blank" class="btn btn-success">Смотреть</a>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Ошибка загрузки данных</td></tr>';
    }
}

window.showAddVideoModal = function() {
    currentVideoId = null;
    document.getElementById('modalTitle').textContent = 'Добавить видео';
    document.getElementById('videoForm').reset();
    document.getElementById('videoModal').style.display = 'block';
};

window.closeVideoModal = function() {
    document.getElementById('videoModal').style.display = 'none';
    currentVideoId = null;
};

window.editVideo = async function(id) {
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
};

window.deleteVideo = async function(id) {
    if (!confirm('Вы уверены, что хотите удалить это видео?')) {
        return;
    }

    try {
        await api.delete(`/admin/videos/${id}`);
        loadVideos();
    } catch (error) {
        alert('Ошибка удаления: ' + error.message);
    }
};

function setupVideoForm() {
    const form = document.getElementById('videoForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

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
}

// Закрытие модального окна при клике вне его
document.addEventListener('click', function(event) {
    const modal = document.getElementById('videoModal');
    if (modal && event.target === modal) {
        closeVideoModal();
    }
});
