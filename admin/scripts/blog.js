/**
 * Скрипт управления блогом (только для админов)
 */

// Проверка авторизации
if (!isAuthenticated()) {
    window.location.href = 'login.html';
}

// Проверка прав доступа - только админы
if (!isAdmin()) {
    document.getElementById('accessDenied').style.display = 'block';
    document.getElementById('blogContent').style.display = 'none';
} else {
    document.getElementById('accessDenied').style.display = 'none';
    document.getElementById('blogContent').style.display = 'block';
}

const userData = getUserData();
if (userData) {
    document.getElementById('userEmail').textContent = userData.email;
}

let currentPostId = null;

// Загрузка списка статей
async function loadPosts() {
    const tbody = document.getElementById('blogTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Загрузка...</td></tr>';

    try {
        const response = await api.get('/admin/blog');
        const posts = response.data || response;

        if (posts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Нет статей</td></tr>';
            return;
        }

        tbody.innerHTML = posts.map(post => `
            <tr>
                <td>${post.id}</td>
                <td>${post.title}</td>
                <td>${post.category || '-'}</td>
                <td>${post.published_at ? new Date(post.published_at).toLocaleDateString('ru-RU') : '-'}</td>
                <td><span class="status-badge ${post.status}">${post.status === 'published' ? 'Опубликовано' : 'Черновик'}</span></td>
                <td>
                    <button class="btn btn-primary" onclick="editPost(${post.id})">Редактировать</button>
                    <button class="btn btn-danger" onclick="deletePost(${post.id})">Удалить</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки статей:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Ошибка загрузки данных</td></tr>';
    }
}

// Показать модальное окно добавления
function showAddPostModal() {
    currentPostId = null;
    document.getElementById('modalTitle').textContent = 'Добавить статью';
    document.getElementById('postForm').reset();
    document.getElementById('coverPreview').innerHTML = '';
    document.getElementById('postModal').style.display = 'block';
}

// Закрыть модальное окно
function closePostModal() {
    document.getElementById('postModal').style.display = 'none';
    currentPostId = null;
}

// Редактировать статью
async function editPost(id) {
    try {
        const post = await api.get(`/admin/blog/${id}`);
        currentPostId = id;
        
        document.getElementById('modalTitle').textContent = 'Редактировать статью';
        document.getElementById('postTitle').value = post.title || '';
        document.getElementById('postContent').value = post.content || '';
        document.getElementById('postStatus').value = post.status || 'draft';
        document.getElementById('postMetaTitle').value = post.meta_title || '';
        document.getElementById('postMetaDescription').value = post.meta_description || '';
        
        if (post.cover_url) {
            document.getElementById('coverPreview').innerHTML = `
                <img src="${post.cover_url}" alt="Обложка" style="max-width: 200px; border-radius: 5px;">
            `;
        }
        
        document.getElementById('postModal').style.display = 'block';
    } catch (error) {
        alert('Ошибка загрузки статьи: ' + error.message);
    }
}

// Удалить статью
async function deletePost(id) {
    if (!confirm('Вы уверены, что хотите удалить эту статью?')) {
        return;
    }

    try {
        await api.delete(`/admin/blog/${id}`);
        loadPosts();
    } catch (error) {
        alert('Ошибка удаления: ' + error.message);
    }
}

// Сохранение статьи
document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', document.getElementById('postTitle').value);
    formData.append('content', document.getElementById('postContent').value);
    formData.append('status', document.getElementById('postStatus').value);
    formData.append('meta_title', document.getElementById('postMetaTitle').value);
    formData.append('meta_description', document.getElementById('postMetaDescription').value);

    const coverFile = document.getElementById('postCover').files[0];
    if (coverFile) {
        formData.append('cover', coverFile);
    }

    try {
        if (currentPostId) {
            await api.put(`/admin/blog/${currentPostId}`, Object.fromEntries(formData));
        } else {
            await api.post('/admin/blog', Object.fromEntries(formData));
        }
        
        closePostModal();
        loadPosts();
    } catch (error) {
        alert('Ошибка сохранения: ' + error.message);
    }
});

// Превью обложки
document.getElementById('postCover').addEventListener('change', function(e) {
    const preview = document.getElementById('coverPreview');
    if (e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Обложка" style="max-width: 200px; border-radius: 5px;">`;
        };
        reader.readAsDataURL(e.target.files[0]);
    }
});

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('postModal');
    if (event.target === modal) {
        closePostModal();
    }
}

// Загружаем статьи при загрузке страницы
if (isAdmin()) {
    loadPosts();
}
