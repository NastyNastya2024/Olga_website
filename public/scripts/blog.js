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
                    <a href="#" class="read-more" onclick="viewPost(${post.id}); return false;">Читать далее</a>
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
        // Не блокируем прокрутку страницы, так как модальное окно само скроллится
    } catch (error) {
        console.error('Ошибка загрузки статьи:', error);
        alert('Ошибка загрузки статьи');
    }
}

function closeBlogModal() {
    const modal = document.getElementById('blogModal');
    if (modal) {
        modal.style.display = 'none';
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
                    <button class="pricing-button" onclick="handlePayment(${tariff.id})">Выбрать тариф</button>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Ошибка загрузки тарифов:', error);
        container.innerHTML = '<p class="empty-state">Ошибка загрузки тарифов</p>';
    }
}

function selectTariff(period, price, months, tariffId) {
    if (tariffId != null) {
        handlePayment(tariffId);
    } else {
        window.open('https://web.telegram.org/a/#295895912', '_blank');
    }
}

window.selectTariff = selectTariff;

// Загружаем тарифы при загрузке страницы
if (document.getElementById('pricingCards')) {
    loadPricingTariffs();
}
