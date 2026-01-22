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
            // Инициализируем галерею для каждого тура
            if (tour.gallery && Array.isArray(tour.gallery) && tour.gallery.length > 0) {
                setTimeout(() => {
                    initTourGallery(tour.id || index, tour.gallery, tour.title || '');
                }, 0);
            }
            
            return `
            <div class="tour-card" data-tour-id="${tour.id || index}">
                <div class="tour-header">
                    <h3>${tour.title}</h3>
                </div>
                
                <button class="btn btn-secondary tour-toggle-btn" onclick="toggleTourDetails(${tour.id || index})">
                    <span class="btn-text">Подробнее</span>
                    <span class="btn-icon">▼</span>
                </button>
                
                ${tour.gallery && Array.isArray(tour.gallery) && tour.gallery.length > 0 ? `
                    <div class="tour-gallery-container">
                        <div class="tour-gallery" id="tourGallery-${tour.id || index}" data-tour-index="${index}">
                            <!-- Галерея будет заполнена динамически -->
                        </div>
                        ${tour.gallery.filter(item => item && String(item).trim()).length > 6 ? `
                            <div class="tour-gallery-pagination" id="tourGalleryPagination-${tour.id || index}">
                                <!-- Пагинация будет добавлена динамически -->
                            </div>
                        ` : ''}
                    </div>
                ` : '<p class="gallery-empty">Галерея пока не добавлена</p>'}
                
                <div class="tour-details" id="tourDetails-${tour.id || index}" style="display: none;">
                    <div class="tour-info">
                        ${tour.price ? `<div class="tour-price">${tour.price.toLocaleString('ru-RU')} ₽</div>` : ''}
                        <p class="tour-date">📅 ${formatDateRange(tour.start_date, tour.end_date)}</p>
                        ${tour.location ? `<p class="tour-location">📍 ${tour.location}</p>` : ''}
                    </div>
                    ${tour.description ? `<p class="tour-description">${tour.description}</p>` : ''}
                    ${tour.program ? `<div class="tour-program"><strong>Программа:</strong><p>${tour.program}</p></div>` : ''}
                    ${tour.booking_url ? `<a href="${tour.booking_url}" class="btn btn-primary" target="_blank">Записаться</a>` : ''}
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

// Функция для инициализации галереи тура с пагинацией
function initTourGallery(tourId, gallery, tourTitle) {
    const galleryContainer = document.getElementById(`tourGallery-${tourId}`);
    const paginationContainer = document.getElementById(`tourGalleryPagination-${tourId}`);
    
    if (!galleryContainer) return;
    
    const validItems = gallery.filter(item => item && String(item).trim());
    const itemsPerPage = 6;
    const totalPages = Math.ceil(validItems.length / itemsPerPage);
    
    // Сохраняем данные галереи для этого тура
    tourGalleriesData[tourId] = {
        items: validItems,
        title: tourTitle,
        currentPage: 1,
        itemsPerPage: itemsPerPage,
        totalPages: totalPages
    };
    
    renderTourGallery(tourId, 1);
}

// Функция для отрисовки галереи тура
function renderTourGallery(tourId, page) {
    const data = tourGalleriesData[tourId];
    if (!data) return;
    
    const galleryContainer = document.getElementById(`tourGallery-${tourId}`);
    const paginationContainer = document.getElementById(`tourGalleryPagination-${tourId}`);
    
    if (!galleryContainer) return;
    
    if (page < 1 || page > data.totalPages) return;
    
    data.currentPage = page;
    const startIndex = (page - 1) * data.itemsPerPage;
    const endIndex = startIndex + data.itemsPerPage;
    const pageItems = data.items.slice(startIndex, endIndex);
    
    galleryContainer.innerHTML = pageItems.map((item) => {
        const itemUrl = String(item).trim();
        const isVideo = itemUrl.match(/\.(mp4|webm|mov|avi|mkv)(\?|$)/i) || itemUrl.includes('/videos/');
        const escapedUrl = escapeHtml(itemUrl);
        const escapedTitle = escapeHtml(data.title);
        
        if (isVideo) {
            return `
                <div class="gallery-item gallery-video" onclick="playGalleryVideo(event, '${escapedUrl}')">
                    <video src="${escapedUrl}" muted loop playsinline preload="metadata"></video>
                    <div class="play-overlay">▶</div>
                </div>
            `;
        } else {
            return `
                <div class="gallery-item gallery-image" onclick="openGalleryImage('${escapedUrl}')">
                    <img src="${escapedUrl}" alt="${escapedTitle}" loading="lazy">
                </div>
            `;
        }
    }).join('');
    
    // Обновляем пагинацию
    if (paginationContainer && data.totalPages > 1) {
        let paginationHTML = '';
        
        if (data.currentPage > 1) {
            paginationHTML += `<button class="gallery-pagination-btn" onclick="goToGalleryPage(${tourId}, ${data.currentPage - 1})">‹</button>`;
        }
        
        for (let i = 1; i <= data.totalPages; i++) {
            if (i === 1 || i === data.totalPages || (i >= data.currentPage - 1 && i <= data.currentPage + 1)) {
                paginationHTML += `<button class="gallery-pagination-btn ${i === data.currentPage ? 'active' : ''}" onclick="goToGalleryPage(${tourId}, ${i})">${i}</button>`;
            } else if (i === data.currentPage - 2 || i === data.currentPage + 2) {
                paginationHTML += `<span class="gallery-pagination-dots">...</span>`;
            }
        }
        
        if (data.currentPage < data.totalPages) {
            paginationHTML += `<button class="gallery-pagination-btn" onclick="goToGalleryPage(${tourId}, ${data.currentPage + 1})">›</button>`;
        }
        
        paginationContainer.innerHTML = paginationHTML;
    }
}

// Глобальная функция для переключения страниц галереи
window.goToGalleryPage = function(tourId, page) {
    renderTourGallery(tourId, page);
};

function formatDateRange(startDate, endDate) {
    if (!startDate || !endDate) return '-';
    const start = new Date(startDate).toLocaleDateString('ru-RU');
    const end = new Date(endDate).toLocaleDateString('ru-RU');
    return `${start} - ${end}`;
}

function toggleTourDetails(tourId) {
    const details = document.getElementById(`tourDetails-${tourId}`);
    const btn = event.target.closest('.tour-toggle-btn');
    const btnText = btn.querySelector('.btn-text');
    const btnIcon = btn.querySelector('.btn-icon');
    
    if (details.style.display === 'none') {
        details.style.display = 'block';
        btnText.textContent = 'Скрыть';
        btnIcon.textContent = '▲';
        btn.classList.add('active');
    } else {
        details.style.display = 'none';
        btnText.textContent = 'Подробнее';
        btnIcon.textContent = '▼';
        btn.classList.remove('active');
    }
}

// Функция для воспроизведения видео из галереи
function playGalleryVideo(event, videoUrl) {
    event.stopPropagation();
    
    // Создаем модальное окно для видео
    const modal = document.createElement('div');
    modal.className = 'gallery-video-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; cursor: pointer;';
    
    const video = document.createElement('video');
    video.src = videoUrl;
    video.controls = true;
    video.autoplay = true;
    video.style.cssText = 'max-width: 90vw; max-height: 90vh; cursor: default;';
    
    modal.appendChild(video);
    document.body.appendChild(modal);
    
    // Закрытие при клике вне видео
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
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
window.toggleTourDetails = toggleTourDetails;
window.playGalleryVideo = playGalleryVideo;
window.openGalleryImage = openGalleryImage;

if (document.getElementById('toursList')) {
    loadTours();
}
