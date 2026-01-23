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

/**
 * Загрузка мероприятий клуба на главную страницу
 */
async function loadClubEventsHome() {
    const container = document.getElementById('upcomingEventsHome');
    if (!container) return;
    
    container.innerHTML = '<p class="loading">Загрузка мероприятий...</p>';

    try {
        const response = await api.get('/public/club/events');
        const events = Array.isArray(response) ? response : (response.data || []);

        // Фильтруем только предстоящие мероприятия
        const upcoming = events.filter(event => {
            const status = event.displayStatus || event.status || 'upcoming';
            return status === 'upcoming';
        });

        if (!upcoming || upcoming.length === 0) {
            container.innerHTML = '<p class="empty-state">Предстоящих мероприятий пока нет</p>';
            return;
        }

        // Показываем только первые 3 предстоящих мероприятия
        const eventsToShow = upcoming.slice(0, 3);
        
        container.innerHTML = eventsToShow.map(event => renderEventCardHome(event)).join('');
    } catch (error) {
        console.error('Ошибка загрузки мероприятий:', error);
        container.innerHTML = '<p class="empty-state">Ошибка загрузки мероприятий</p>';
    }
}

function renderEventCardHome(event) {
    const eventId = event.id || Math.random();
    const dateStr = event.date ? new Date(event.date).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';
    
    // Определяем статус для отображения
    const displayStatus = event.displayStatus || event.status || 'upcoming';
    const statusLabel = displayStatus === 'past' ? 'Прошедшее' : 'Предстоящее';
    const statusClass = displayStatus === 'past' ? 'event-status-past' : 'event-status-upcoming';
    
    return `
        <div class="club-event-card" data-event-id="${eventId}">
            ${event.cover ? `
                <div class="club-event-cover">
                    <img src="${escapeHtml(event.cover)}" alt="${escapeHtml(event.title || '')}" loading="lazy">
                    <div class="event-status-badge ${statusClass}">${statusLabel}</div>
                </div>
            ` : ''}
            <div class="club-event-content">
                <h3 class="club-event-title">${escapeHtml(event.title || '')}</h3>
                ${dateStr ? `<p class="club-event-date">📅 ${dateStr}</p>` : ''}
                ${event.description ? `<p class="club-event-description">${escapeHtml(event.description.substring(0, 100))}${event.description.length > 100 ? '...' : ''}</p>` : ''}
            </div>
        </div>
    `;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Загружаем мероприятия при загрузке страницы
if (document.getElementById('upcomingEventsHome')) {
    loadClubEventsHome();
}
