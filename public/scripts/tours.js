/**
 * Скрипт загрузки ретритов на публичной странице
 */

// Функция для экранирования HTML
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function loadTours() {
    const list = document.getElementById('toursList');
    list.innerHTML = '<p class="loading">Загрузка ретритов...</p>';

    try {
        const response = await api.get('/public/tours');
        const tours = response.data || response;

        if (!tours || tours.length === 0) {
            list.innerHTML = '<p class="empty-state">Ретриты пока не добавлены</p>';
            return;
        }

        // Отладка: выводим данные туров в консоль
        console.log('Загруженные туры:', tours);
        tours.forEach((tour, idx) => {
            console.log(`Тур ${idx + 1}:`, {
                title: tour.title,
                hasGallery: !!tour.gallery,
                galleryLength: tour.gallery ? tour.gallery.length : 0,
                gallery: tour.gallery
            });
        });

        list.innerHTML = tours.map((tour, index) => {
            const tourId = tour.id || index;
            // Сохраняем данные тура для доступа
            if (!tourGalleriesData[tourId]) {
                tourGalleriesData[tourId] = {};
            }
            tourGalleriesData[tourId].title = tour.title || '';
            
            // Инициализируем галерею для каждого тура
            if (tour.gallery && Array.isArray(tour.gallery) && tour.gallery.length > 0) {
                setTimeout(() => {
                    initTourGallery(tourId, tour.gallery, tour.title || '');
                }, 0);
            }
            
            return `
            <div class="tour-card" data-tour-id="${tour.id || index}">
                <div class="tour-header">
                    <h3>${tour.title}</h3>
                </div>
                
                <div class="tour-content-wrapper">
                    <div class="tour-description-column">
                        <div class="tour-info">
                            <p class="tour-date">📅 ${formatDateRange(tour.start_date, tour.end_date)}</p>
                            ${tour.location ? `<p class="tour-location">📍 ${tour.location}</p>` : ''}
                        </div>
                        ${tour.description ? `<p class="tour-description">${tour.description}</p>` : ''}
                    </div>
                    
                    <div class="tour-gallery-column">
                        ${tour.gallery && Array.isArray(tour.gallery) && tour.gallery.length > 0 ? `
                            <div class="tour-gallery-container">
                                <div class="tour-gallery-main" id="tourGalleryMain-${tour.id || index}">
                                    <!-- Главное изображение/видео будет заполнено динамически -->
                                </div>
                                <div class="tour-gallery-thumbnails" id="tourGalleryThumbnails-${tour.id || index}">
                                    <!-- Миниатюры будут заполнены динамически -->
                                </div>
                            </div>
                        ` : '<p class="gallery-empty">Галерея пока не добавлена</p>'}
                    </div>
                </div>
                
                <div class="tour-actions">
                    <a href="https://web.telegram.org/a/#295895912" class="btn btn-primary tour-booking-btn" target="_blank">Забронировать</a>
                </div>
            </div>
        `;
        }).join('');
    } catch (error) {
        console.error('Ошибка загрузки ретритов:', error);
        list.innerHTML = '<p class="empty-state">Ошибка загрузки ретритов</p>';
    }
}

// Хранилище данных галерей для каждого тура
const tourGalleriesData = {};

// Функция для инициализации галереи тура
function initTourGallery(tourId, gallery, tourTitle) {
    const mainContainer = document.getElementById(`tourGalleryMain-${tourId}`);
    const thumbnailsContainer = document.getElementById(`tourGalleryThumbnails-${tourId}`);
    
    if (!mainContainer || !thumbnailsContainer) return;
    
    const validItems = gallery.filter(item => item && String(item).trim());
    
    if (validItems.length === 0) return;
    
    // Сохраняем данные галереи для этого тура (сохраняем существующие данные если есть)
    if (!tourGalleriesData[tourId]) {
        tourGalleriesData[tourId] = {};
    }
    tourGalleriesData[tourId].items = validItems;
    tourGalleriesData[tourId].title = tourTitle;
    tourGalleriesData[tourId].currentMainIndex = 0;
    
    renderTourGallery(tourId);
}

// Функция для отрисовки галереи тура
function renderTourGallery(tourId) {
    const data = tourGalleriesData[tourId];
    if (!data) return;
    
    const mainContainer = document.getElementById(`tourGalleryMain-${tourId}`);
    const thumbnailsContainer = document.getElementById(`tourGalleryThumbnails-${tourId}`);
    
    if (!mainContainer || !thumbnailsContainer) return;
    
    const mainItem = data.items[data.currentMainIndex];
    const mainItemUrl = String(mainItem).trim();
    const isMainVideo = mainItemUrl.match(/\.(mp4|webm|mov|avi|mkv)(\?|$)/i) || mainItemUrl.includes('/videos/');
    const escapedMainUrl = escapeHtml(mainItemUrl);
    const escapedTitle = escapeHtml(data.title);
    
    // Рендерим главное изображение/видео
    if (isMainVideo) {
        mainContainer.innerHTML = `
            <div class="gallery-main-item gallery-video" onclick="playGalleryVideo(event, '${escapedMainUrl}')">
                <video src="${escapedMainUrl}" muted loop playsinline preload="metadata"></video>
                <div class="play-overlay"><svg class="play-icon-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
            </div>
        `;
    } else {
        mainContainer.innerHTML = `
            <div class="gallery-main-item gallery-image" onclick="openGalleryImage('${escapedMainUrl}')">
                <img src="${escapedMainUrl}" alt="${escapedTitle}" loading="lazy">
            </div>
        `;
    }
    
    // Рендерим миниатюры
    thumbnailsContainer.innerHTML = data.items.map((item, index) => {
        const itemUrl = String(item).trim();
        const isVideo = itemUrl.match(/\.(mp4|webm|mov|avi|mkv)(\?|$)/i) || itemUrl.includes('/videos/');
        const escapedUrl = escapeHtml(itemUrl);
        const isActive = index === data.currentMainIndex;
        
        if (isVideo) {
            return `
                <div class="gallery-thumbnail gallery-video ${isActive ? 'active' : ''}" onclick="setMainGalleryItem(${tourId}, ${index})">
                    <video src="${escapedUrl}" muted loop playsinline preload="metadata"></video>
                    <div class="play-overlay-small"><svg class="play-icon-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
                </div>
            `;
        } else {
            return `
                <div class="gallery-thumbnail gallery-image ${isActive ? 'active' : ''}" onclick="setMainGalleryItem(${tourId}, ${index})">
                    <img src="${escapedUrl}" alt="${escapedTitle}" loading="lazy">
                </div>
            `;
        }
    }).join('');
}

// Глобальная функция для установки главного элемента галереи
window.setMainGalleryItem = function(tourId, index) {
    const data = tourGalleriesData[tourId];
    if (!data || index < 0 || index >= data.items.length) return;
    
    data.currentMainIndex = index;
    renderTourGallery(tourId);
};

function formatDateRange(startDate, endDate) {
    if (!startDate || !endDate) return '-';
    const start = new Date(startDate).toLocaleDateString('ru-RU');
    const end = new Date(endDate).toLocaleDateString('ru-RU');
    return `${start} - ${end}`;
}


// Функция для воспроизведения видео из галереи
function playGalleryVideo(event, videoUrl) {
    event.stopPropagation();
    
    // Создаем модальное окно для видео
    const modal = document.createElement('div');
    modal.className = 'gallery-video-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: auto;';
    
    const videoContainer = document.createElement('div');
    videoContainer.style.cssText = 'position: relative; padding: 2rem; display: flex; align-items: center; justify-content: center; min-height: 100%; width: 100%;';
    
    const video = document.createElement('video');
    video.src = videoUrl;
    video.controls = true;
    video.autoplay = true;
    video.style.cssText = 'max-width: 90vw; max-height: 90vh; cursor: default; width: auto; height: auto;';
    
    videoContainer.appendChild(video);
    modal.appendChild(videoContainer);
    document.body.appendChild(modal);
    
    // Закрытие при клике вне видео
    modal.addEventListener('click', function(e) {
        if (e.target === modal || e.target === videoContainer) {
            document.body.removeChild(modal);
        }
    });
    
    // Предотвращаем закрытие при клике на само видео
    video.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Закрытие по Escape
    const closeHandler = function(e) {
        if (e.key === 'Escape') {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            document.removeEventListener('keydown', closeHandler);
        }
    };
    document.addEventListener('keydown', closeHandler);
}

// Функция для открытия изображения в полном размере
function openGalleryImage(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'gallery-image-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; cursor: pointer;';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = 'max-width: 90vw; max-height: 90vh; object-fit: contain; cursor: default;';
    
    modal.appendChild(img);
    document.body.appendChild(modal);
    
    // Закрытие при клике
    modal.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // Закрытие по Escape
    const closeHandler = function(e) {
        if (e.key === 'Escape') {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            document.removeEventListener('keydown', closeHandler);
        }
    };
    document.addEventListener('keydown', closeHandler);
}

// Делаем функции доступными глобально
window.playGalleryVideo = playGalleryVideo;
window.openGalleryImage = openGalleryImage;

if (document.getElementById('toursList')) {
    loadTours();
}
