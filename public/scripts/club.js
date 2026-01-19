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
            list.innerHTML = '<p class="empty-state">Отзывов пока нет</p>';
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
