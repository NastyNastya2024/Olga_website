/**
 * Страница управления блогом (только для админов)
 */

export default {
    render: async () => {
        return `
            <div id="blog-page">
                <div class="page-header">
                    <h1>Статьи блога</h1>
                    <button class="btn btn-primary" onclick="showAddPostModal()">Добавить статью</button>
                </div>

                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Заголовок</th>
                                <th>Категория</th>
                                <th>Дата публикации</th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody id="blogTableBody">
                            <tr>
                                <td colspan="6" class="loading">Загрузка...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            ${getPostModal()}
            
            <script>
                (async function() {
                    document.getElementById('page-title').textContent = 'Управление блогом';
                    await loadPosts();
                })();
            </script>
        `;
    },
    
    init: async () => {
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = 'Управление блогом';
        }
        window.loadPosts = loadPosts;
        window.showAddPostModal = showAddPostModal;
        window.closePostModal = closePostModal;
        window.editPost = editPost;
        window.deletePost = deletePost;
        window.publishPost = publishPost;
        await loadPosts();
        setTimeout(() => {
            setupPostForm();
        }, 100);
    }
};

function getPostModal() {
    return `
        <div id="postModal" class="modal" style="display: none;">
            <div class="modal-content">
                <span class="close" onclick="closePostModal()">&times;</span>
                <h2 id="modalTitle">Добавить статью</h2>
                <form id="postForm">
                    <div class="form-group">
                        <label>Заголовок</label>
                        <input type="text" id="postTitle" required>
                    </div>
                    <div class="form-group">
                        <label>Содержание</label>
                        <textarea id="postContent" rows="10" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Обложка</label>
                        <input type="file" id="postCover" accept="image/*">
                        <div id="coverPreview" style="margin-top: 1rem;"></div>
                    </div>
                    <div class="form-group">
                        <label>Статус</label>
                        <select id="postStatus">
                            <option value="draft">Черновик</option>
                            <option value="published">Опубликовано</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Meta Title (SEO)</label>
                        <input type="text" id="postMetaTitle">
                    </div>
                    <div class="form-group">
                        <label>Meta Description (SEO)</label>
                        <textarea id="postMetaDescription" rows="3"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                </form>
            </div>
        </div>
    `;
}

let currentPostId = null;

async function loadPosts() {
    const tbody = document.getElementById('blogTableBody');
    if (!tbody) return;
    
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
                    ${post.status === 'draft' ? `<button class="btn btn-success" onclick="publishPost(${post.id})" style="margin-right: 0.5rem;">Опубликовать</button>` : ''}
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

window.showAddPostModal = function() {
    currentPostId = null;
    document.getElementById('modalTitle').textContent = 'Добавить статью';
    document.getElementById('postForm').reset();
    document.getElementById('coverPreview').innerHTML = '';
    document.getElementById('postModal').style.display = 'block';
};

window.closePostModal = function() {
    document.getElementById('postModal').style.display = 'none';
    currentPostId = null;
};

window.editPost = async function(id) {
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
};

window.deletePost = async function(id) {
    if (!confirm('Вы уверены, что хотите удалить эту статью?')) {
        return;
    }

    try {
        await api.delete(`/admin/blog/${id}`);
        loadPosts();
    } catch (error) {
        alert('Ошибка удаления: ' + error.message);
    }
};

window.publishPost = async function(id) {
    if (!confirm('Опубликовать эту статью? Она станет доступна на публичной странице блога.')) {
        return;
    }

    try {
        // Получаем текущую статью
        const post = await api.get(`/admin/blog/${id}`);
        
        // Обновляем статус на published
        const updatedData = {
            ...post,
            status: 'published',
            published_at: post.published_at || new Date().toISOString()
        };
        
        await api.put(`/admin/blog/${id}`, updatedData);
        loadPosts();
    } catch (error) {
        alert('Ошибка публикации: ' + error.message);
    }
};

function setupPostForm() {
    const form = document.getElementById('postForm');
    if (!form) {
        console.warn('Форма postForm не найдена в DOM. Повторная попытка через 200ms...');
        setTimeout(setupPostForm, 200);
        return;
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        let coverUrl = null;
        const coverPreview = document.getElementById('coverPreview');
        if (coverPreview) {
            const existingImg = coverPreview.querySelector('img');
            if (existingImg && existingImg.src && !existingImg.src.startsWith('data:')) {
                coverUrl = existingImg.src;
            }
        }
        
        // Если выбрано новое изображение, загружаем его в S3
        const coverFile = document.getElementById('postCover').files[0];
        if (coverFile) {
            try {
                const formData = new FormData();
                formData.append('file', coverFile);
                
                const uploadResponse = await api.uploadFile('/upload', formData, (percent) => {
                    console.log(`Загрузка обложки: ${percent}%`);
                });
                
                if (uploadResponse.success && uploadResponse.data) {
                    coverUrl = uploadResponse.data.publicUrl || uploadResponse.data.url;
                }
            } catch (error) {
                alert('Ошибка загрузки обложки: ' + error.message);
                return;
            }
        }

        const data = {
            title: document.getElementById('postTitle').value,
            content: document.getElementById('postContent').value,
            status: document.getElementById('postStatus').value,
            meta_title: document.getElementById('postMetaTitle').value || null,
            meta_description: document.getElementById('postMetaDescription').value || null,
            cover_url: coverUrl,
        };

        try {
            if (currentPostId) {
                await api.put(`/admin/blog/${currentPostId}`, data);
            } else {
                await api.post('/admin/blog', data);
            }
            
            closePostModal();
            loadPosts();
        } catch (error) {
            alert('Ошибка сохранения: ' + error.message);
        }
    });

    // Превью обложки
    const coverInput = document.getElementById('postCover');
    if (coverInput) {
        coverInput.addEventListener('change', function(e) {
            const preview = document.getElementById('coverPreview');
            if (e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Обложка" style="max-width: 200px; border-radius: 5px;">`;
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }
}

// Закрытие модального окна при клике вне его
document.addEventListener('click', function(event) {
    const modal = document.getElementById('postModal');
    if (modal && event.target === modal) {
        closePostModal();
    }
});
