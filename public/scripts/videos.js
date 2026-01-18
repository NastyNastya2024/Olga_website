/**
 * Скрипт загрузки видео на публичной странице
 */

async function loadVideos() {
    const grid = document.getElementById('videosGrid');
    grid.innerHTML = '<p class="loading">Загрузка видео...</p>';

    try {
        const response = await api.get('/public/videos');
        const videos = response.data || response;

        if (!videos || videos.length === 0) {
            grid.innerHTML = '<p class="empty-state">Видео пока нет</p>';
            return;
        }

        grid.innerHTML = videos.map(video => `
            <div class="video-card">
                <div class="video-placeholder">
                    ${video.preview_url ? `<img src="${video.preview_url}" alt="${video.title}" style="width: 100%; height: 100%; object-fit: cover;">` : 'Видео'}
                </div>
                <h3>${video.title}</h3>
                <p>${video.description || ''}</p>
                <a href="${video.video_url}" target="_blank" class="btn btn-primary" style="margin: 1rem;">Смотреть</a>
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
        grid.innerHTML = '<p class="empty-state">Ошибка загрузки видео</p>';
    }
}

// Загружаем видео при загрузке страницы
if (document.getElementById('videosGrid')) {
    loadVideos();
}
