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
                <div class="blog-full-content" id="blogFullContent-${post.id}" style="display: none;">
                    <div class="blog-full-text">${post.content ? escapeHtml(post.content).replace(/\n/g, '<br>') : ''}</div>
                    <a href="#" class="read-less" onclick="hidePost(${post.id}); return false;">Свернуть ↑</a>
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки статей:', error);
        list.innerHTML = '<p class="empty-state">Ошибка загрузки статей</p>';
    }
}

function viewPost(id) {
    const fullContent = document.getElementById(`blogFullContent-${id}`);
    const card = document.querySelector(`[data-post-id="${id}"]`);
    const readMoreLink = card.querySelector('.read-more');
    
    if (fullContent) {
        fullContent.style.display = 'block';
        readMoreLink.style.display = 'none';
        
        // Плавная прокрутка к развернутой статье
        setTimeout(() => {
            fullContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

function hidePost(id) {
    const fullContent = document.getElementById(`blogFullContent-${id}`);
    const card = document.querySelector(`[data-post-id="${id}"]`);
    const readMoreLink = card.querySelector('.read-more');
    
    if (fullContent) {
        fullContent.style.display = 'none';
        readMoreLink.style.display = 'inline';
    }
}

// Делаем функции доступными глобально
window.viewPost = viewPost;
window.hidePost = hidePost;

if (document.getElementById('blogList')) {
    loadBlogPosts();
}
