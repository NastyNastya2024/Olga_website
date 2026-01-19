/**
 * Скрипт для главной страницы - загрузка видео в хедер
 */

async function loadHeroVideo() {
    const heroVideoContainer = document.getElementById('heroVideo');
    if (!heroVideoContainer) return;

    try {
        const response = await api.get('/public/videos');
        const videos = response.data || response;

        if (!videos || videos.length === 0) {
            heroVideoContainer.innerHTML = '<p class="empty-state">Видео пока нет</p>';
            return;
        }

        // Берем первое опубликованное видео
        const video = videos.find(v => v.status === 'published') || videos[0];

        if (!video || !video.video_url) {
            heroVideoContainer.innerHTML = '<p class="empty-state">Видео не найдено</p>';
            return;
        }

        // Определяем тип видео
        const isVideoFile = video.video_url && (
            video.video_url.endsWith('.mp4') || 
            video.video_url.endsWith('.webm') || 
            video.video_url.endsWith('.mov') ||
            video.video_url.includes('/videos/') ||
            video.video_url.includes('/uploads/')
        );
        
        const isYouTube = video.video_url && video.video_url.includes('youtube.com');
        const isVimeo = video.video_url && video.video_url.includes('vimeo.com');

        let videoHTML = '';

        if (isVideoFile) {
            // Прямая ссылка на видео файл - используем HTML5 video player
            videoHTML = `
                <video controls autoplay muted loop style="width: 100%; height: 100%; object-fit: cover;">
                    <source src="${video.video_url}" type="video/mp4">
                    Ваш браузер не поддерживает видео.
                </video>
            `;
        } else if (isYouTube) {
            // YouTube видео - извлекаем ID и используем embed
            const videoId = video.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
            if (videoId) {
                videoHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width: 100%; height: 100%;"></iframe>`;
            }
        } else if (isVimeo) {
            // Vimeo видео - извлекаем ID и используем embed
            const videoId = video.video_url.match(/vimeo\.com\/(\d+)/)?.[1];
            if (videoId) {
                videoHTML = `<iframe src="https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="width: 100%; height: 100%;"></iframe>`;
            }
        }

        if (videoHTML) {
            heroVideoContainer.innerHTML = videoHTML;
        } else {
            heroVideoContainer.innerHTML = '<p class="empty-state">Не удалось загрузить видео</p>';
        }
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
        heroVideoContainer.innerHTML = '<p class="empty-state">Ошибка загрузки видео</p>';
    }
}

// Загружаем видео при загрузке страницы
if (document.getElementById('heroVideo')) {
    loadHeroVideo();
}
