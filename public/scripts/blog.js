/**
 * Скрипт загрузки блога на публичной странице
 */

async function loadBlogPosts() {
    const list = document.getElementById('blogList');
    list.innerHTML = '<p class="loading">Загрузка статей...</p>';

    try {
        const response = await api.get('/public/blog');
        const posts = response.data || response;

        if (!posts || posts.length === 0) {
            list.innerHTML = '<p class="empty-state">Статьи пока не добавлены</p>';
            return;
        }

        list.innerHTML = posts.map(post => `
            <article class="blog-card">
                ${post.cover_url ? `
                    <div class="blog-image">
                        <img src="${post.cover_url}" alt="${post.title}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                ` : '<div class="blog-image">Изображение</div>'}
                <div class="blog-content">
                    <h3>${post.title}</h3>
                    <p class="blog-date">${post.published_at ? new Date(post.published_at).toLocaleDateString('ru-RU') : ''}</p>
                    <p>${post.content ? post.content.substring(0, 150) + '...' : ''}</p>
                    <a href="#" class="read-more" onclick="viewPost(${post.id})">Читать далее →</a>
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки статей:', error);
        list.innerHTML = '<p class="empty-state">Ошибка загрузки статей</p>';
    }
}

function viewPost(id) {
    // TODO: Реализовать просмотр полной статьи
    alert('Просмотр статьи ' + id);
}

if (document.getElementById('blogList')) {
    loadBlogPosts();
}
