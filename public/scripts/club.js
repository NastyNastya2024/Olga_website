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

        container.innerHTML = events.map(event => renderEventCard(event)).join('');
    } catch (error) {
        console.error('Ошибка загрузки мероприятий:', error);
        container.innerHTML = '<p class="empty-state">Ошибка загрузки мероприятий</p>';
    }
}

function renderEventCard(event) {
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
