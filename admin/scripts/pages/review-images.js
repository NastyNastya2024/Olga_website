/**
 * Страница управления отзывами-скриншотами (фото отзывов для главной)
 */

export default {
    render: async () => {
        return `
            <div id="review-images-page">
                <div class="page-header">
                    <h1>Отзывы</h1>
                    <div class="review-images-upload-area">
                        <input type="file" id="reviewImageFile" accept="image/*" style="display: none;">
                        <button type="button" class="btn btn-primary" onclick="document.getElementById('reviewImageFile').click()">Загрузить фото отзыва</button>
                    </div>
                </div>

                <p class="review-images-hint">Скриншоты отзывов отображаются на главной странице в горизонтальной прокрутке.</p>

                <div class="review-images-list" id="reviewImagesList">
                    <div class="loading">Загрузка...</div>
                </div>
            </div>
        `;
    },

    init: async () => {
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = 'Отзывы';

        window.loadReviewImages = loadReviewImages;
        window.deleteReviewImage = deleteReviewImage;

        await loadReviewImages();
        setupUpload();
    }
};

async function loadReviewImages() {
    const list = document.getElementById('reviewImagesList');
    if (!list) return;

    try {
        const items = await api.get('/admin/review-images');

        if (!items || items.length === 0) {
            list.innerHTML = '<div class="review-images-empty">Пока нет отзывов. Загрузите скриншоты отзывов.</div>';
            return;
        }

        list.innerHTML = items.map(item => `
            <div class="review-image-card" data-id="${item.id}">
                <img src="${escapeHtml(item.image_url)}" alt="Отзыв ${item.id}" class="review-image-thumb">
                <div class="review-image-actions">
                    <button type="button" class="btn btn-danger btn-sm" onclick="deleteReviewImage(${item.id})">Удалить</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        list.innerHTML = `<div class="review-images-error">Ошибка: ${error.message}</div>`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

async function deleteReviewImage(id) {
    if (!confirm('Удалить этот отзыв?')) return;

    try {
        await api.delete(`/admin/review-images/${id}`);
        await loadReviewImages();
    } catch (error) {
        alert('Ошибка удаления: ' + error.message);
    }
}

function setupUpload() {
    const input = document.getElementById('reviewImageFile');
    if (!input) return;

    input.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Выберите изображение (jpg, png, gif, webp)');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await api.uploadFile('/upload', formData, (p) => {
                console.log('Загрузка:', p + '%');
            });

            if (!uploadRes.success || !uploadRes.data) {
                throw new Error(uploadRes.error || 'Ошибка загрузки');
            }

            const imageUrl = uploadRes.data.publicUrl || uploadRes.data.url;
            await api.post('/admin/review-images', { image_url: imageUrl });

            await loadReviewImages();
            input.value = '';
        } catch (error) {
            alert('Ошибка: ' + (error.message || 'Не удалось загрузить'));
        }
    });
}
