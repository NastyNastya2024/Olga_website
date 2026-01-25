/**
 * Страница управления видео
 */

export default {
    render: async () => {
        const userRole = getUserRole();
        const isStudent = userRole === 'student';
        
        return `
            <div id="videos-page">
                <div class="page-header">
                    <h1>Видео</h1>
                    ${!isStudent ? '<button class="btn btn-primary" onclick="showAddVideoModal()">Добавить видео</button>' : ''}
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
            
            ${getVideoModal()}
            ${getVideoPlayerModal()}
        `;
    },
    
    init: async () => {
        // Обновляем заголовок страницы
        const pageTitle = document.getElementById('page-title');
        const userRole = getUserRole();
        const isStudent = userRole === 'student';
        
        if (pageTitle) {
            pageTitle.textContent = isStudent ? 'Мои видео' : 'Видео';
        }
        
        // Делаем функции доступными глобально (до загрузки данных)
        window.loadVideos = loadVideos;
        window.showAddVideoModal = showAddVideoModal;
        window.closeVideoModal = closeVideoModal;
        window.editVideo = editVideo;
        window.deleteVideo = deleteVideo;
        window.showVideoPlayer = showVideoPlayer;
        window.closeVideoPlayer = closeVideoPlayer;
        window.shareVideo = shareVideo;
        
        // Загружаем видео
        await loadVideos();
        
        // Настраиваем форму загрузки только для не-студентов (после того как DOM готов)
        if (!isStudent) {
            setTimeout(() => {
                setupVideoForm();
            }, 100);
        }
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
                        <label>Категория</label>
                        <input type="text" id="videoCategory" value="blog_1" placeholder="blog_1">
                    </div>
                    
                    <!-- Загрузка видео файла -->
                    <div class="form-group">
                        <label>Загрузить видео файл</label>
                        <input type="file" id="videoFile" accept="video/*">
                        <small style="color: #7f8c8d; display: block; margin-top: 0.5rem;">
                            Выберите видео файл для загрузки в S3, или укажите URL вручную ниже
                        </small>
                        <div id="uploadProgress" style="display: none; margin-top: 1rem;">
                            <div class="progress-bar">
                                <div class="progress-fill" id="progressFill" style="width: 0%;"></div>
                            </div>
                            <p id="uploadStatus" style="margin-top: 0.5rem; color: #7f8c8d;">Загрузка...</p>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Или укажите URL видео</label>
                        <input type="url" id="videoUrl" placeholder="http://...">
                        <small style="color: #7f8c8d; display: block; margin-top: 0.5rem;">
                            Если вы загрузили файл выше, URL заполнится автоматически
                        </small>
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
let currentVideoUrl = '';
let currentVideoTitle = '';
let currentShareVideoUrl = '';
let currentShareVideoTitle = '';

async function loadVideos() {
    const tbody = document.getElementById('videosTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Загрузка...</td></tr>';

    try {
        const userRole = getUserRole();
        const isStudent = userRole === 'student';
        let videos = [];
        
        if (isStudent) {
            // Студент видит только назначенные ему видео
            try {
                const userResponse = await api.get('/admin/users/me');
                const user = userResponse.data || userResponse;
                // Преобразуем ID в числа для корректного сравнения
                const assignedVideoIds = (user.assigned_videos || []).map(id => parseInt(id));
                
                console.log('Данные пользователя:', user);
                console.log('Назначенные видео (ID):', assignedVideoIds);
                
                if (assignedVideoIds.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Вам не назначено ни одного видео</td></tr>';
                    return;
                }
                
                // Получаем все видео и фильтруем по назначенным
                const allVideosResponse = await api.get('/admin/videos');
                const allVideos = allVideosResponse.data || allVideosResponse;
                
                console.log('Всего видео на платформе:', allVideos.length);
                console.log('ID всех видео:', allVideos.map(v => v.id));
                
                // Фильтруем видео, преобразуя ID в числа для сравнения
                videos = allVideos.filter(video => {
                    const videoId = parseInt(video.id);
                    const isAssigned = assignedVideoIds.includes(videoId);
                    console.log(`Видео ${videoId} (${video.title}): назначено = ${isAssigned}`);
                    return isAssigned;
                });
                
                console.log('Отфильтрованные видео для студента:', videos.length);
            } catch (error) {
                console.error('Ошибка загрузки данных пользователя:', error);
                tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Ошибка загрузки данных: ' + error.message + '</td></tr>';
                return;
            }
        } else {
            // Админ и другие роли видят все видео
            const endpoint = '/admin/videos';
            const response = await api.get(endpoint);
            videos = response.data || response;
        }

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
                    ${!isStudent ? `
                        <button class="btn btn-edit" onclick="editVideo(${video.id})">Редактировать</button>
                        <button class="btn btn-danger" onclick="deleteVideo(${video.id})">Удалить</button>
                    ` : ''}
                    ${video.video_url ? `<button class="btn btn-view" onclick="showVideoPlayer(${video.id}, '${video.video_url.replace(/'/g, "\\'")}', '${(video.title || '').replace(/'/g, "\\'")}', '${video.status || 'published'}')">Смотреть</button>` : ''}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Ошибка загрузки данных</td></tr>';
    }
}

function showAddVideoModal() {
    currentVideoId = null;
    document.getElementById('modalTitle').textContent = 'Добавить видео';
    document.getElementById('videoForm').reset();
    
    // Устанавливаем категорию по умолчанию
    const categoryInput = document.getElementById('videoCategory');
    if (categoryInput) {
        categoryInput.value = 'blog_1';
    }
    
    // Сбрасываем прогресс загрузки
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadStatus = document.getElementById('uploadStatus');
    if (uploadProgress) uploadProgress.style.display = 'none';
    if (uploadStatus) {
        uploadStatus.textContent = 'Загрузка...';
        uploadStatus.style.color = '#7f8c8d';
    }
    
    const videoModal = document.getElementById('videoModal');
    if (videoModal) {
        videoModal.style.display = 'block';
    } else {
        console.error('Модальное окно не найдено');
    }
}

function closeVideoModal() {
    const videoModal = document.getElementById('videoModal');
    if (!videoModal) return;
    videoModal.style.display = 'none';
    currentVideoId = null;
    
    // Сбрасываем форму и прогресс
    const form = document.getElementById('videoForm');
    if (form) form.reset();
    
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadStatus = document.getElementById('uploadStatus');
    if (uploadProgress) uploadProgress.style.display = 'none';
    if (uploadStatus) {
        uploadStatus.textContent = 'Загрузка...';
        uploadStatus.style.color = '#7f8c8d';
    }
}

async function shareVideo() {
    if (!currentShareVideoUrl) {
        alert('Ссылка на видео недоступна');
        return;
    }

    if (navigator.share) {
        try {
            await navigator.share({
                title: currentShareVideoTitle || 'Видео',
                url: currentShareVideoUrl,
            });
        } catch (error) {
            console.error('Ошибка при попытке поделиться видео:', error);
        }
    } else {
        fallbackCopyToClipboard(currentShareVideoUrl, 'Ссылка на видео скопирована!');
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    }
    return Promise.reject('API Clipboard не поддерживается');
}

function fallbackCopyToClipboard(text, message) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
        document.execCommand('copy');
        alert(message);
    } catch (err) {
        console.error('Не удалось скопировать текст: ', err);
        alert('Не удалось скопировать ссылку. Пожалуйста, скопируйте вручную: ' + text);
    }

    document.body.removeChild(textarea);
}

async function editVideo(id) {
    try {
        const video = await api.get(`/admin/videos/${id}`);
        currentVideoId = id;
        
        document.getElementById('modalTitle').textContent = 'Редактировать видео';
        document.getElementById('videoTitle').value = video.title || '';
        document.getElementById('videoDescription').value = video.description || '';
        document.getElementById('videoCategory').value = video.category || 'blog_1';
        document.getElementById('videoUrl').value = video.video_url || '';
        document.getElementById('videoStatus').value = video.status || 'published';
        document.getElementById('videoAccess').value = video.access_type || 'open';
        
        document.getElementById('videoModal').style.display = 'block';
    } catch (error) {
        alert('Ошибка загрузки видео: ' + error.message);
    }
}

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

function setupVideoForm() {
    const form = document.getElementById('videoForm');
    if (!form) {
        console.warn('Форма videoForm не найдена в DOM. Повторная попытка через 200ms...');
        setTimeout(setupVideoForm, 200);
        return;
    }
    
    console.log('Настройка формы загрузки видео...');
    
    const videoFileInput = document.getElementById('videoFile');
    const videoUrlInput = document.getElementById('videoUrl');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const uploadStatus = document.getElementById('uploadStatus');
    
    // Обработка выбора файла для загрузки
    if (videoFileInput) {
        videoFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Проверяем размер файла (макс 500MB)
            const maxSize = 500 * 1024 * 1024; // 500MB
            if (file.size > maxSize) {
                alert('Файл слишком большой. Максимальный размер: 500MB');
                return;
            }
            
            // Показываем прогресс
            uploadProgress.style.display = 'block';
            progressFill.style.width = '0%';
            uploadStatus.textContent = 'Подготовка к загрузке...';
            
            try {
                // Создаем FormData
                const formData = new FormData();
                formData.append('file', file);
                
                // Загружаем файл в S3 с отслеживанием прогресса
                uploadStatus.textContent = `Загрузка ${file.name}...`;
                
                const response = await api.uploadFile('/upload', formData, (percent) => {
                    // Обновляем прогресс бар
                    progressFill.style.width = percent + '%';
                    uploadStatus.textContent = `Загрузка ${file.name}... ${Math.round(percent)}%`;
                });
                
                if (response.success && response.data) {
                    // Заполняем URL автоматически
                    videoUrlInput.value = response.data.publicUrl || response.data.url;
                    progressFill.style.width = '100%';
                    uploadStatus.textContent = '✅ Файл успешно загружен!';
                    uploadStatus.style.color = '#27ae60';
                    
                    // Автоматически заполняем название из имени файла
                    const titleInput = document.getElementById('videoTitle');
                    if (titleInput && !titleInput.value) {
                        const fileName = file.name.replace(/\.[^/.]+$/, ''); // Убираем расширение
                        titleInput.value = fileName;
                    }
                } else {
                    throw new Error('Ошибка загрузки файла');
                }
            } catch (error) {
                uploadProgress.style.display = 'none';
                alert('Ошибка загрузки файла: ' + error.message);
                console.error('Upload error:', error);
            }
        });
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Проверяем, что указан URL или загружен файл
        const videoUrl = videoUrlInput.value;
        if (!videoUrl) {
            alert('Пожалуйста, загрузите видео файл или укажите URL');
            return;
        }

        const data = {
            title: document.getElementById('videoTitle').value,
            description: document.getElementById('videoDescription').value,
            category: document.getElementById('videoCategory').value || 'blog_1',
            video_url: videoUrl,
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

function getVideoPlayerModal() {
    return `
        <div id="videoPlayerModal" class="modal" style="display: none;">
            <div class="modal-content video-modal-content">
                <span class="close" onclick="closeVideoPlayer()">&times;</span>
                <div class="video-modal-header">
                    <h2 id="videoPlayerTitle"></h2>
                    <button id="btnShareVideo" onclick="shareVideo()" class="btn-share-video" title="Поделиться видео">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                        Поделиться
                    </button>
                </div>
                <div class="video-modal-player">
                    <video id="videoPlayer" controls>
                        Ваш браузер не поддерживает воспроизведение видео.
                    </video>
                </div>
            </div>
        </div>
    `;
}

function showVideoPlayer(videoId, videoUrl, videoTitle, videoStatus) {
    const modal = document.getElementById('videoPlayerModal');
    const videoElement = document.getElementById('videoPlayer');
    const titleElement = document.getElementById('videoPlayerTitle');
    const shareButton = document.getElementById('btnShareVideo');
    
    if (!modal || !videoElement) {
        console.error('Элементы видеоплеера не найдены');
        return;
    }
    
    currentVideoUrl = videoUrl;
    currentVideoTitle = videoTitle || 'Видео';
    currentShareVideoUrl = `${window.location.origin}/videos.html?id=${videoId}`;
    currentShareVideoTitle = currentVideoTitle;
    
    titleElement.textContent = currentVideoTitle;
    videoElement.src = videoUrl;
    modal.style.display = 'block';
    
    // Скрываем кнопку поделиться для скрытых и неопубликованных видео
    if (shareButton) {
        const isPublished = videoStatus === 'published';
        shareButton.style.display = isPublished ? 'flex' : 'none';
    }
    
    // Автоматически запускаем воспроизведение
    videoElement.play().catch(error => {
        console.log('Автозапуск видео заблокирован браузером:', error);
    });
}

function closeVideoPlayer() {
    const modal = document.getElementById('videoPlayerModal');
    const videoElement = document.getElementById('videoPlayer');
    
    if (modal) {
        modal.style.display = 'none';
    }
    
    if (videoElement) {
        videoElement.pause();
        videoElement.src = '';
    }
}

// Закрытие модального окна при клике вне его
document.addEventListener('click', function(event) {
    const videoModal = document.getElementById('videoModal');
    if (videoModal && event.target === videoModal) {
        closeVideoModal();
    }
    
    const videoPlayerModal = document.getElementById('videoPlayerModal');
    if (videoPlayerModal && event.target === videoPlayerModal) {
        closeVideoPlayer();
    }
});
