/**
 * Скрипт загрузки отзывов на странице клуба
 */

async function loadReviews() {
    const list = document.getElementById('reviewsList');
    if (!list) return;
    
    list.innerHTML = '<p class="loading">Загрузка отзывов...</p>';

    try {
        const response = await api.get('/public/reviews');
        const reviews = response.data || response;

        if (!reviews || reviews.length === 0) {
            // Скрываем секцию отзывов, если их нет
            const reviewsSection = document.querySelector('.reviews-section');
            if (reviewsSection) {
                reviewsSection.style.display = 'none';
            }
            return;
        }

        list.innerHTML = reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    ${review.author_photo ? `
                        <img src="${review.author_photo}" alt="${review.author_name}" class="review-avatar">
                    ` : `
                        <div class="review-avatar-placeholder">${review.author_name.charAt(0).toUpperCase()}</div>
                    `}
                    <div class="review-author">
                        <h4>${review.author_name}</h4>
                        <div class="review-rating">
                            ${'⭐'.repeat(review.rating || 5)}
                        </div>
                    </div>
                </div>
                <p class="review-text">${review.text}</p>
                <p class="review-date">${new Date(review.created_at).toLocaleDateString('ru-RU')}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        list.innerHTML = '<p class="empty-state">Ошибка загрузки отзывов</p>';
    }
}

// Загружаем отзывы при загрузке страницы
if (document.getElementById('reviewsList')) {
    loadReviews();
}

/**
 * Загрузка мероприятий клуба
 */
async function loadClubEvents() {
    const container = document.getElementById('eventsList');
    
    if (!container) return;
    
    container.innerHTML = '<p class="loading">Загрузка мероприятий...</p>';

    try {
        const response = await api.get('/public/club/events');
        const events = Array.isArray(response) ? response : (response.data || []);

        if (!events || events.length === 0) {
            container.innerHTML = '<p class="empty-state">Мероприятий пока нет</p>';
            return;
        }

        clubEventsCache = events;
        container.innerHTML = events.map(event => renderEventCard(event)).join('');
        
        // Добавляем класс для центрирования, если карточек мало (1-2)
        const cardCount = container.querySelectorAll('.event-card, .club-event-card').length;
        if (cardCount <= 2) {
            container.classList.add('events-list-centered');
        }
    } catch (error) {
        console.error('Ошибка загрузки мероприятий:', error);
        container.innerHTML = '<p class="empty-state">Ошибка загрузки мероприятий</p>';
    }
}

let clubEventsCache = [];

function renderEventCard(event) {
    const eventId = event.id || Math.random();
    const dateStr = event.date ? new Date(event.date).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';
    
    const displayStatus = event.displayStatus || event.status || 'upcoming';
    const statusLabel = displayStatus === 'past' ? 'Прошедшее' : 'Предстоящее';
    const statusClass = displayStatus === 'past' ? 'event-status-past' : 'event-status-upcoming';
    
    const hasDetails = event.description || (event.images && event.images.length > 0);
    
    return `
        <div class="event-card" data-event-id="${eventId}">
            ${event.cover ? `
                <div class="event-cover">
                    <img src="${escapeHtml(event.cover)}" alt="${escapeHtml(event.title || '')}" loading="lazy">
                    <div class="event-status-badge ${statusClass}">${statusLabel}</div>
                </div>
            ` : ''}
            <div class="event-content">
                <div class="event-header">
                    <h3 class="event-title">${escapeHtml(event.title || '')}</h3>
                    ${dateStr ? `<p class="event-date">📅 ${dateStr}</p>` : ''}
                </div>
                ${event.description ? `<p class="event-description">${escapeHtml(event.description)}</p>` : ''}
                ${hasDetails ? `<button type="button" class="event-details-btn" onclick="openEventDetails(${eventId})">Подробнее</button>` : ''}
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
if (document.getElementById('eventsList')) {
    loadClubEvents();
    setupEventsScroll();
}

/**
 * Загрузка тарифов (те же, что на главной — из /public/pricing-tariffs)
 */
async function loadPricingTariffs() {
    const container = document.getElementById('pricingCards');
    if (!container) return;

    container.innerHTML = '<p class="loading">Загрузка тарифов...</p>';

    try {
        const response = await api.get('/public/pricing-tariffs');
        const tariffs = response.data || response;

        if (!tariffs || tariffs.length === 0) {
            container.innerHTML = '<p class="empty-state">Тарифы пока не добавлены</p>';
            return;
        }

        container.innerHTML = tariffs.map(tariff => {
            const features = tariff.description 
                ? tariff.description.split('\n').filter(line => line.trim()).map(line => line.trim())
                : [];
            const featuresHtml = features.length > 0 
                ? `<ul class="pricing-features">${features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>`
                : '';
            const popularBadge = tariff.is_popular ? '<span class="pricing-badge">Популярный</span>' : '';
            const popularClass = tariff.is_popular ? 'pricing-card-popular' : '';
            return `
                <div class="pricing-card ${popularClass}">
                    ${popularBadge}
                    <h3 class="pricing-card-title">${escapeHtml(tariff.name || '')}</h3>
                    <div class="pricing-card-price">${escapeHtml(tariff.price || '')}</div>
                    ${featuresHtml}
                    <button class="pricing-button" onclick="window.open('https://web.telegram.org/a/#295895912', '_blank')">Выбрать тариф</button>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Ошибка загрузки тарифов:', error);
        container.innerHTML = '<p class="empty-state">Ошибка загрузки тарифов</p>';
    }
}

// Загружаем тарифы при загрузке страницы
if (document.getElementById('pricingCards')) {
    loadPricingTariffs();
}

/**
 * Настройка стрелок для скролла мероприятий
 */
function setupEventsScroll() {
    const eventsList = document.getElementById('eventsList');
    const scrollLeftBtn = document.getElementById('eventsScrollLeft');
    const scrollRightBtn = document.getElementById('eventsScrollRight');
    
    if (!eventsList || !scrollLeftBtn || !scrollRightBtn) return;
    
    // Функция обновления состояния кнопок
    function updateScrollButtons() {
        const scrollLeft = eventsList.scrollLeft;
        const scrollWidth = eventsList.scrollWidth;
        const clientWidth = eventsList.clientWidth;
        
        // Скрываем/показываем кнопки в зависимости от возможности скролла
        if (scrollWidth <= clientWidth) {
            scrollLeftBtn.style.display = 'none';
            scrollRightBtn.style.display = 'none';
            return;
        }
        
        scrollLeftBtn.style.display = 'flex';
        scrollRightBtn.style.display = 'flex';
        
        // Отключаем кнопку влево, если мы в начале
        scrollLeftBtn.disabled = scrollLeft === 0;
        
        // Отключаем кнопку вправо, если мы в конце
        scrollRightBtn.disabled = scrollLeft + clientWidth >= scrollWidth - 10; // 10px допуск
    }
    
    // Прокрутка влево
    scrollLeftBtn.addEventListener('click', () => {
        const cardWidth = eventsList.querySelector('.event-card')?.offsetWidth || 350;
        const gap = 32; // 2rem gap
        eventsList.scrollBy({
            left: -(cardWidth + gap),
            behavior: 'smooth'
        });
    });
    
    // Прокрутка вправо
    scrollRightBtn.addEventListener('click', () => {
        const cardWidth = eventsList.querySelector('.event-card')?.offsetWidth || 350;
        const gap = 32; // 2rem gap
        eventsList.scrollBy({
            left: cardWidth + gap,
            behavior: 'smooth'
        });
    });
    
    // Обновляем состояние кнопок при скролле
    eventsList.addEventListener('scroll', updateScrollButtons);
    
    // Обновляем состояние кнопок при изменении размера окна
    window.addEventListener('resize', updateScrollButtons);
    
    // Обновляем состояние кнопок после загрузки мероприятий
    const observer = new MutationObserver(() => {
        setTimeout(updateScrollButtons, 100);
    });
    
    observer.observe(eventsList, { childList: true, subtree: true });
    
    // Первоначальное обновление
    setTimeout(updateScrollButtons, 500);
}

/**
 * Обработчик выбора тарифа
 */
function selectTariff(period, price, months) {
    // Открываем Telegram для связи
    window.open('https://web.telegram.org/a/#295895912', '_blank');
}

// Делаем функцию доступной глобально
window.selectTariff = selectTariff;

/**
 * Попап с описанием мероприятия и фотографиями
 */
function openEventDetails(eventId) {
    const event = clubEventsCache.find(e => (e.id || e) === eventId || e.id === parseInt(eventId));
    if (!event) return;
    
    const dateStr = event.date ? new Date(event.date).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';
    
    const images = Array.isArray(event.images) ? event.images : [];
    const imagesHtml = images.length > 0
        ? `<div class="event-detail-gallery">${images.map(url => `<img src="${escapeHtml(url)}" alt="Фото мероприятия" loading="lazy">`).join('')}</div>`
        : '';
    
    let modal = document.getElementById('eventDetailModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'eventDetailModal';
        modal.className = 'event-detail-modal';
        modal.innerHTML = `
            <div class="event-detail-content">
                <button type="button" class="event-detail-close" onclick="closeEventDetails()">&times;</button>
                <div class="event-detail-body"></div>
            </div>
        `;
        modal.onclick = (e) => { if (e.target === modal) closeEventDetails(); };
        document.body.appendChild(modal);
    }
    
    const body = modal.querySelector('.event-detail-body');
    body.innerHTML = `
        <h2 class="event-detail-title">${escapeHtml(event.title || '')}</h2>
        ${dateStr ? `<p class="event-detail-date">📅 ${dateStr}</p>` : ''}
        ${event.description ? `<div class="event-detail-description">${escapeHtml(event.description).replace(/\n/g, '<br>')}</div>` : ''}
        ${imagesHtml}
    `;
    
    modal.classList.add('event-detail-modal-open');
    document.body.style.overflow = 'hidden';
}

function closeEventDetails() {
    const modal = document.getElementById('eventDetailModal');
    if (modal) {
        modal.classList.remove('event-detail-modal-open');
        document.body.style.overflow = '';
    }
}

window.openEventDetails = openEventDetails;
window.closeEventDetails = closeEventDetails;
