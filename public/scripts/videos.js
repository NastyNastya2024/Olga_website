/**
 * Скрипт загрузки видео на публичной странице
 */

let allVideos = [];
let currentPage = 1;
const videosPerPage = 12;

function renderVideoCard(video) {
    // Определяем, является ли URL видео файлом или YouTube/Vimeo ссылкой
    const isVideoFile = video.video_url && (
        video.video_url.endsWith('.mp4') || 
        video.video_url.endsWith('.webm') || 
        video.video_url.endsWith('.mov') ||
        video.video_url.includes('/videos/') ||
        video.video_url.includes('/uploads/')
    );
    
    const isYouTube = video.video_url && video.video_url.includes('youtube.com');
    const isVimeo = video.video_url && video.video_url.includes('vimeo.com');
    
    let videoContent = '';
    
    if (isVideoFile) {
        // Прямая ссылка на видео файл - используем HTML5 video player
        videoContent = `
            <video controls style="width: 100%; height: 100%; object-fit: cover;">
                <source src="${video.video_url}" type="video/mp4">
                Ваш браузер не поддерживает видео.
            </video>
        `;
    } else if (isYouTube) {
        // YouTube видео - извлекаем ID и используем embed
        const videoId = video.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
        if (videoId) {
            videoContent = `<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width: 100%; height: 100%;"></iframe>`;
        } else {
            videoContent = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #7f8c8d;">Видео</div>';
        }
    } else if (isVimeo) {
        // Vimeo видео - извлекаем ID и используем embed
        const videoId = video.video_url.match(/vimeo\.com\/(\d+)/)?.[1];
        if (videoId) {
            videoContent = `<iframe src="https://player.vimeo.com/video/${videoId}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="width: 100%; height: 100%;"></iframe>`;
        } else {
            videoContent = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #7f8c8d;">Видео</div>';
        }
    } else {
        // Другой тип ссылки - показываем превью или плейсхолдер
        videoContent = video.preview_url 
            ? `<img src="${video.preview_url}" alt="${video.title}" style="width: 100%; height: 100%; object-fit: cover;">`
            : '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #7f8c8d; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">🎥 Видео</div>';
    }
    
    return `
        <div class="video-card" onclick="showVideoPlayer('${video.video_url.replace(/'/g, "\\'")}', '${(video.title || '').replace(/'/g, "\\'")}')">
            <div class="video-placeholder">
                ${videoContent}
                <div class="video-play-overlay">
                    <div class="video-play-button">▶</div>
                </div>
            </div>
            <div class="video-card-content">
                <h3>${video.title}</h3>
                <p>${video.description || ''}</p>
            </div>
        </div>
    `;
}

async function loadVideos() {
    const grid = document.getElementById('videosGrid');
    grid.innerHTML = '<p class="loading">Загрузка видео...</p>';

    try {
        const response = await api.get('/public/videos');
        allVideos = response.data || response;

        if (!allVideos || allVideos.length === 0) {
            grid.innerHTML = '<p class="empty-state">Видео пока нет</p>';
            return;
        }

        // Сортируем видео в обратном порядке - последние загруженные идут первыми
        allVideos.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at) : new Date(a.id || 0);
            const dateB = b.created_at ? new Date(b.created_at) : new Date(b.id || 0);
            return dateB - dateA; // Сортировка по убыванию (новые первыми)
        });

        currentPage = 1;
        displayVideos();
        renderPagination();
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
        grid.innerHTML = '<p class="empty-state">Ошибка загрузки видео</p>';
    }
}

function displayVideos() {
    const grid = document.getElementById('videosGrid');
    const startIndex = (currentPage - 1) * videosPerPage;
    const endIndex = startIndex + videosPerPage;
    const videosToShow = allVideos.slice(startIndex, endIndex);

    grid.innerHTML = videosToShow.map(video => renderVideoCard(video)).join('');
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    const totalPages = Math.ceil(allVideos.length / videosPerPage);
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }

    pagination.style.display = 'flex';
    
    let paginationHTML = '';
    
    // Кнопка "Назад"
    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="goToPage(${currentPage - 1})">‹</button>`;
    } else {
        paginationHTML += `<button class="pagination-btn pagination-btn-disabled" disabled>‹</button>`;
    }
    
    // Номера страниц
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-dots">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="pagination-btn pagination-btn-active">${i}</button>`;
        } else {
            paginationHTML += `<button class="pagination-btn" onclick="goToPage(${i})">${i}</button>`;
        }
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-dots">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Кнопка "Вперед"
    if (currentPage < totalPages) {
        paginationHTML += `<button class="pagination-btn" onclick="goToPage(${currentPage + 1})">›</button>`;
    } else {
        paginationHTML += `<button class="pagination-btn pagination-btn-disabled" disabled>›</button>`;
    }
    
    pagination.innerHTML = paginationHTML;
}

function goToPage(page) {
    const totalPages = Math.ceil(allVideos.length / videosPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displayVideos();
    renderPagination();
    
    // Прокрутка к началу списка видео
    const grid = document.getElementById('videosGrid');
    if (grid) {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

let currentVideoUrl = null;
let currentVideoTitle = null;

function showVideoPlayer(videoUrl, videoTitle, videoStatus) {
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
    
    titleElement.textContent = currentVideoTitle;
    videoElement.src = videoUrl;
    modal.style.display = 'block';
    
    // Скрываем кнопку поделиться для скрытых и неопубликованных видео
    // Если статус не передан, считаем видео опубликованным (для публичной части)
    if (shareButton) {
        const isPublished = !videoStatus || videoStatus === 'published';
        shareButton.style.display = isPublished ? 'flex' : 'none';
    }
    
    // Автоматически запускаем воспроизведение
    videoElement.play().catch(error => {
        console.log('Автозапуск видео заблокирован браузером:', error);
    });
}

function shareVideo() {
    if (!currentVideoUrl) return;
    
    const shareText = currentVideoTitle ? `${currentVideoTitle}\n${currentVideoUrl}` : currentVideoUrl;
    
    // Проверяем поддержку Web Share API
    if (navigator.share) {
        navigator.share({
            title: currentVideoTitle || 'Видео',
            text: currentVideoTitle || '',
            url: currentVideoUrl
        }).catch(err => {
            console.log('Ошибка при использовании Web Share API:', err);
            copyToClipboard(currentVideoUrl);
        });
    } else {
        // Копируем ссылку в буфер обмена
        copyToClipboard(currentVideoUrl);
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Ссылка скопирована в буфер обмена!');
        }).catch(err => {
            console.error('Ошибка копирования:', err);
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        alert('Ссылка скопирована в буфер обмена!');
    } catch (err) {
        console.error('Ошибка копирования:', err);
        alert('Не удалось скопировать ссылку. Ссылка: ' + text);
    }
    document.body.removeChild(textArea);
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
    const videoPlayerModal = document.getElementById('videoPlayerModal');
    if (videoPlayerModal && event.target === videoPlayerModal) {
        closeVideoPlayer();
    }
});

// Загружаем видео при загрузке страницы
if (document.getElementById('videosGrid')) {
    loadVideos();
}
