/**
 * Скрипт загрузки блога на публичной странице
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

async function loadBlogPosts() {
    const list = document.getElementById('blogList');
    if (!list) {
        console.error('Элемент blogList не найден');
        return;
    }
    
    list.innerHTML = '<p class="loading">Загрузка статей...</p>';

    try {
        console.log('Запрос статей блога...');
        const response = await api.get('/public/blog');
        console.log('Ответ API:', response);
        
        const posts = response.data || response;
        console.log('Статьи:', posts);
        console.log('Количество статей:', posts ? posts.length : 0);

        if (!posts || posts.length === 0) {
            console.log('Статьи не найдены или пустой массив');
            list.innerHTML = '<p class="empty-state">Статьи пока не добавлены</p>';
            return;
        }

        list.innerHTML = posts.map(post => `
            <article class="blog-card" data-post-id="${post.id}">
                ${post.cover_url ? `
                    <div class="blog-image">
                        <img src="${post.cover_url}" alt="${post.title}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                ` : '<div class="blog-image">Изображение</div>'}
                <div class="blog-content">
                    <h3>${escapeHtml(post.title)}</h3>
                    <p class="blog-date">${post.published_at ? new Date(post.published_at).toLocaleDateString('ru-RU') : ''}</p>
                    <p class="blog-excerpt">${post.content ? escapeHtml(post.content.substring(0, 150)) + '...' : ''}</p>
                    <a href="#" class="read-more" onclick="viewPost(${post.id}); return false;">Читать далее →</a>
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки статей:', error);
        list.innerHTML = '<p class="empty-state">Ошибка загрузки статей</p>';
    }
}

async function viewPost(id) {
    try {
        // Загружаем полную информацию о статье
        const response = await api.get('/public/blog');
        const posts = response.data || response;
        const post = posts.find(p => p.id === id);
        
        if (!post) {
            console.error('Статья не найдена');
            return;
        }
        
        // Заполняем модальное окно
        const modal = document.getElementById('blogModal');
        const modalTitle = document.getElementById('blogModalTitle');
        const modalDate = document.getElementById('blogModalDate');
        const modalText = document.getElementById('blogModalText');
        const modalImage = document.getElementById('blogModalImage');
        
        if (!modal || !modalTitle || !modalDate || !modalText || !modalImage) {
            console.error('Элементы модального окна не найдены');
            return;
        }
        
        modalTitle.textContent = post.title || '';
        modalDate.textContent = post.published_at ? new Date(post.published_at).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : '';
        modalText.innerHTML = post.content ? escapeHtml(post.content).replace(/\n/g, '<br>') : '';
        
        // Устанавливаем изображение
        if (post.cover_url) {
            modalImage.innerHTML = `<img src="${escapeHtml(post.cover_url)}" alt="${escapeHtml(post.title)}">`;
        } else {
            modalImage.innerHTML = '';
        }
        
        // Показываем модальное окно
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Блокируем прокрутку страницы
    } catch (error) {
        console.error('Ошибка загрузки статьи:', error);
        alert('Ошибка загрузки статьи');
    }
}

function closeBlogModal() {
    const modal = document.getElementById('blogModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Восстанавливаем прокрутку страницы
    }
}

// Закрытие модального окна по клавише Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeBlogModal();
    }
});

// Делаем функции доступными глобально
window.viewPost = viewPost;
window.closeBlogModal = closeBlogModal;

if (document.getElementById('blogList')) {
    loadBlogPosts();
}

/**
 * Загрузка тарифов клуба
 */
async function loadClubTariffs() {
    const pricesGrid = document.getElementById('clubPricesGrid');
    
    if (!pricesGrid) return;
    
    pricesGrid.innerHTML = '<p class="loading">Загрузка цен...</p>';

    try {
        const response = await api.get('/public/club/tariffs');
        const data = response.data || response;

        if (!data || !data.clubPrices) {
            pricesGrid.innerHTML = '<p class="empty-state">Цены пока не установлены</p>';
            return;
        }

        const prices = data.clubPrices;
        const pricesArray = [
            { period: '1 месяц', price: prices.price_1_month, months: 1, description: prices.description_1_month || '' },
            { period: '3 месяца', price: prices.price_3_months, months: 3, description: prices.description_3_months || '' },
            { period: '6 месяцев', price: prices.price_6_months, months: 6, description: prices.description_6_months || '' }
        ].filter(p => p.price !== null && p.price !== undefined && !isNaN(p.price) && p.price > 0);

        if (pricesArray.length === 0) {
            pricesGrid.innerHTML = '<p class="empty-state">Цены пока не установлены</p>';
        } else {
            pricesGrid.innerHTML = pricesArray.map(p => `
                <div class="club-price-card">
                    <h4 class="price-period">${p.period}</h4>
                    <div class="price-amount">${p.price.toFixed(0)} ₽</div>
                    ${p.months > 1 ? `<div class="price-per-month">${(p.price / p.months).toFixed(0)} ₽/мес</div>` : ''}
                    ${p.description && p.description.trim() ? `<p class="price-description">${escapeHtml(p.description)}</p>` : ''}
                    <button class="price-select-btn" onclick="selectTariff('${p.period}', ${p.price}, ${p.months})">Выбрать тариф</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Ошибка загрузки тарифов:', error);
        pricesGrid.innerHTML = '<p class="empty-state">Ошибка загрузки цен</p>';
    }
}

function selectTariff(period, price, months) {
    // Можно добавить логику для обработки выбора тарифа
    console.log('Выбран тариф:', period, price, months);
    alert(`Выбран тариф: ${period} за ${price} ₽`);
}

// Делаем функции доступными глобально
window.selectTariff = selectTariff;

// Загружаем тарифы при загрузке страницы
if (document.getElementById('clubPricesGrid')) {
    loadClubTariffs();
}
