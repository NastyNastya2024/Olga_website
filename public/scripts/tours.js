/**
 * Скрипт загрузки туров на публичной странице
 */

async function loadTours() {
    const list = document.getElementById('toursList');
    list.innerHTML = '<p class="loading">Загрузка туров...</p>';

    try {
        const response = await api.get('/public/tours');
        const tours = response.data || response;

        if (!tours || tours.length === 0) {
            list.innerHTML = '<p class="empty-state">Туры пока не добавлены</p>';
            return;
        }

        list.innerHTML = tours.map(tour => `
            <div class="tour-card">
                <div class="tour-header">
                    <h3>${tour.title}</h3>
                    ${tour.price ? `<div class="tour-price">${tour.price.toLocaleString('ru-RU')} ₽</div>` : ''}
                </div>
                <div class="tour-info">
                    <p class="tour-date">📅 ${formatDateRange(tour.start_date, tour.end_date)}</p>
                    ${tour.location ? `<p class="tour-location">📍 ${tour.location}</p>` : ''}
                </div>
                ${tour.description ? `<p class="tour-description">${tour.description}</p>` : ''}
                ${tour.program ? `<div class="tour-program"><strong>Программа:</strong><p>${tour.program}</p></div>` : ''}
                ${tour.booking_url ? `<a href="${tour.booking_url}" class="btn btn-primary" target="_blank">Записаться</a>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки туров:', error);
        list.innerHTML = '<p class="empty-state">Ошибка загрузки туров</p>';
    }
}

function formatDateRange(startDate, endDate) {
    if (!startDate || !endDate) return '-';
    const start = new Date(startDate).toLocaleDateString('ru-RU');
    const end = new Date(endDate).toLocaleDateString('ru-RU');
    return `${start} - ${end}`;
}

if (document.getElementById('toursList')) {
    loadTours();
}
