/**
 * Страница управления клубом (цены и отзывы)
 */

export default {
    render: async () => {
        return `
            <div id="club-page">
                <div class="page-header">
                    <h1>Тарифы</h1>
                </div>

                <!-- Секция цен -->
                <div class="club-prices-section">
                    <h2>Цены клуба</h2>
                    <form id="clubPricesForm" class="club-prices-form-inline">
                        <div class="price-input-group">
                            <label for="price1Month">1 месяц</label>
                            <input type="number" id="price1Month" step="0.01" min="0" placeholder="0.00">
                            <span class="price-currency">руб.</span>
                        </div>
                        
                        <div class="price-input-group">
                            <label for="price3Months">3 месяца</label>
                            <input type="number" id="price3Months" step="0.01" min="0" placeholder="0.00">
                            <span class="price-currency">руб.</span>
                        </div>
                        
                        <div class="price-input-group">
                            <label for="price6Months">6 месяцев</label>
                            <input type="number" id="price6Months" step="0.01" min="0" placeholder="0.00">
                            <span class="price-currency">руб.</span>
                        </div>
                        
                        <button type="submit" class="btn btn-primary">Сохранить цены</button>
                    </form>
                </div>

                <!-- Секция отзывов -->
                <div class="club-reviews-section">
                    <div class="reviews-header">
                        <h2>Отзывы</h2>
                        <button class="btn btn-primary" onclick="showAddReviewModal()">Добавить отзыв</button>
                    </div>

                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Автор</th>
                                    <th>Рейтинг</th>
                                    <th>Текст</th>
                                    <th>Статус</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody id="reviewsTableBody">
                                <tr>
                                    <td colspan="6" class="loading">Загрузка...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Секция тарифов занятий -->
                <div class="lesson-tariffs-section">
                    <div class="lesson-tariffs-header">
                        <h2>Тарифы занятий</h2>
                        <button class="btn btn-primary" onclick="showAddTariffModal()">Добавить тариф</button>
                    </div>

                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Название</th>
                                    <th>Цена</th>
                                    <th>Описание</th>
                                    <th>Особенности</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody id="tariffsTableBody">
                                <tr>
                                    <td colspan="6" class="loading">Загрузка...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            ${getReviewModal()}
            ${getTariffModal()}
        `;
    },
    
    init: async () => {
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = 'Тарифы';
        }
        
        // Инициализация функций для отзывов
        window.loadReviews = loadReviews;
        window.showAddReviewModal = showAddReviewModal;
        window.closeReviewModal = closeReviewModal;
        window.editReview = editReview;
        window.deleteReview = deleteReview;
        
        // Инициализация функций для тарифов
        window.loadTariffs = loadTariffs;
        window.showAddTariffModal = showAddTariffModal;
        window.closeTariffModal = closeTariffModal;
        window.editTariff = editTariff;
        window.deleteTariff = deleteTariff;
        
        // Загружаем данные
        await loadPrices();
        await loadReviews();
        await loadTariffs();
        
        // Настраиваем формы
        setupPricesForm();
        setTimeout(() => {
            setupReviewForm();
            setupTariffForm();
        }, 100);
    }
};

// ========== Функции для цен ==========

async function loadPrices() {
    try {
        const response = await api.get('/admin/club/prices');
        const prices = response.data || response;
        
        if (prices.price_1_month !== null && prices.price_1_month !== undefined) {
            document.getElementById('price1Month').value = prices.price_1_month;
        }
        if (prices.price_3_months !== null && prices.price_3_months !== undefined) {
            document.getElementById('price3Months').value = prices.price_3_months;
        }
        if (prices.price_6_months !== null && prices.price_6_months !== undefined) {
            document.getElementById('price6Months').value = prices.price_6_months;
        }
    } catch (error) {
        console.error('Ошибка загрузки цен:', error);
        alert('Ошибка загрузки цен: ' + error.message);
    }
}

function setupPricesForm() {
    const form = document.getElementById('clubPricesForm');
    if (!form) {
        setTimeout(setupPricesForm, 100);
        return;
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            price_1_month: document.getElementById('price1Month').value || null,
            price_3_months: document.getElementById('price3Months').value || null,
            price_6_months: document.getElementById('price6Months').value || null,
        };
        
        try {
            await api.put('/admin/club/prices', data);
            alert('Цены успешно сохранены!');
        } catch (error) {
            alert('Ошибка сохранения цен: ' + error.message);
        }
    });
}

// ========== Функции для отзывов ==========

function getReviewModal() {
    return `
        <div id="reviewModal" class="modal" style="display: none;">
            <div class="modal-content">
                <span class="close" onclick="closeReviewModal()">&times;</span>
                <h2 id="modalTitle">Добавить отзыв</h2>
                <form id="reviewForm">
                    <div class="form-group">
                        <label>Имя автора</label>
                        <input type="text" id="reviewAuthorName" required>
                    </div>
                    <div class="form-group">
                        <label>Фото автора (URL)</label>
                        <input type="url" id="reviewAuthorPhoto" placeholder="http://...">
                        <div id="photoPreview" style="margin-top: 0.5rem;"></div>
                    </div>
                    <div class="form-group">
                        <label>Рейтинг (1-5)</label>
                        <input type="number" id="reviewRating" min="1" max="5" value="5" required>
                    </div>
                    <div class="form-group">
                        <label>Текст отзыва</label>
                        <textarea id="reviewText" rows="5" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Статус</label>
                        <select id="reviewStatus">
                            <option value="published">Опубликовано</option>
                            <option value="hidden">Скрыто</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                </form>
            </div>
        </div>
    `;
}

let currentReviewId = null;

async function loadReviews() {
    const tbody = document.getElementById('reviewsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Загрузка...</td></tr>';

    try {
        const response = await api.get('/admin/reviews');
        const reviews = response.data || response;

        if (reviews.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Нет отзывов</td></tr>';
            return;
        }

        tbody.innerHTML = reviews.map(review => `
            <tr>
                <td>${review.id}</td>
                <td>${review.author_name}</td>
                <td>${'⭐'.repeat(review.rating || 5)}</td>
                <td>${(review.text || '').substring(0, 50)}${review.text && review.text.length > 50 ? '...' : ''}</td>
                <td><span class="status-badge ${review.status}">${review.status === 'published' ? 'Опубликовано' : 'Скрыто'}</span></td>
                <td>
                    <button class="btn btn-primary" onclick="editReview(${review.id})">Редактировать</button>
                    <button class="btn btn-danger" onclick="deleteReview(${review.id})">Удалить</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Ошибка загрузки данных</td></tr>';
    }
}

function showAddReviewModal() {
    currentReviewId = null;
    document.getElementById('modalTitle').textContent = 'Добавить отзыв';
    document.getElementById('reviewForm').reset();
    document.getElementById('photoPreview').innerHTML = '';
    
    const reviewModal = document.getElementById('reviewModal');
    if (reviewModal) {
        reviewModal.style.display = 'block';
    }
}

function closeReviewModal() {
    const reviewModal = document.getElementById('reviewModal');
    if (!reviewModal) return;
    reviewModal.style.display = 'none';
    currentReviewId = null;
    
    const form = document.getElementById('reviewForm');
    if (form) form.reset();
    
    document.getElementById('photoPreview').innerHTML = '';
}

async function editReview(id) {
    try {
        const review = await api.get(`/admin/reviews/${id}`);
        currentReviewId = id;
        
        document.getElementById('modalTitle').textContent = 'Редактировать отзыв';
        document.getElementById('reviewAuthorName').value = review.author_name || '';
        document.getElementById('reviewAuthorPhoto').value = review.author_photo || '';
        document.getElementById('reviewRating').value = review.rating || 5;
        document.getElementById('reviewText').value = review.text || '';
        document.getElementById('reviewStatus').value = review.status || 'published';
        
        if (review.author_photo) {
            document.getElementById('photoPreview').innerHTML = `<img src="${review.author_photo}" alt="Preview" style="max-width: 100px; border-radius: 50%;">`;
        }
        
        const reviewModal = document.getElementById('reviewModal');
        if (reviewModal) {
            reviewModal.style.display = 'block';
        }
    } catch (error) {
        alert('Ошибка загрузки отзыва: ' + error.message);
    }
}

async function deleteReview(id) {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) {
        return;
    }

    try {
        await api.delete(`/admin/reviews/${id}`);
        loadReviews();
    } catch (error) {
        alert('Ошибка удаления: ' + error.message);
    }
}

function setupReviewForm() {
    const form = document.getElementById('reviewForm');
    if (!form) {
        console.warn('Форма reviewForm не найдена в DOM. Повторная попытка через 200ms...');
        setTimeout(setupReviewForm, 200);
        return;
    }
    
    const photoInput = document.getElementById('reviewAuthorPhoto');
    const photoPreview = document.getElementById('photoPreview');
    
    if (photoInput && photoPreview) {
        photoInput.addEventListener('input', (e) => {
            const url = e.target.value;
            if (url) {
                photoPreview.innerHTML = `<img src="${url}" alt="Preview" style="max-width: 100px; border-radius: 50%;" onerror="this.style.display='none'">`;
            } else {
                photoPreview.innerHTML = '';
            }
        });
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            author_name: document.getElementById('reviewAuthorName').value,
            author_photo: document.getElementById('reviewAuthorPhoto').value || null,
            rating: parseInt(document.getElementById('reviewRating').value),
            text: document.getElementById('reviewText').value,
            status: document.getElementById('reviewStatus').value,
        };
        
        try {
            if (currentReviewId) {
                await api.put(`/admin/reviews/${currentReviewId}`, data);
            } else {
                await api.post('/admin/reviews', data);
            }
            closeReviewModal();
            loadReviews();
        } catch (error) {
            alert('Ошибка сохранения: ' + error.message);
        }
    });
}

// ========== Функции для тарифов занятий ==========

function getTariffModal() {
    return `
        <div id="tariffModal" class="modal" style="display: none;">
            <div class="modal-content">
                <span class="close" onclick="closeTariffModal()">&times;</span>
                <h2 id="tariffModalTitle">Добавить тариф</h2>
                <form id="tariffForm">
                    <div class="form-group">
                        <label>Название тарифа</label>
                        <input type="text" id="tariffName" required placeholder="Например: Пробное занятие">
                    </div>
                    <div class="form-group">
                        <label>Цена (руб.)</label>
                        <input type="number" id="tariffPrice" step="0.01" min="0" required placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label>Описание</label>
                        <textarea id="tariffDescription" rows="3" placeholder="Краткое описание тарифа"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Особенности (каждая с новой строки)</label>
                        <textarea id="tariffFeatures" rows="5" placeholder="Одно занятие&#10;Знакомство с инструктором&#10;Оценка уровня подготовки"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                </form>
            </div>
        </div>
    `;
}

let currentTariffId = null;
let tariffsData = [];

async function loadTariffs() {
    const tbody = document.getElementById('tariffsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Загрузка...</td></tr>';

    try {
        // Загружаем тарифы из локального хранилища или создаем дефолтные
        const storedTariffs = localStorage.getItem('lessonTariffs');
        if (storedTariffs) {
            tariffsData = JSON.parse(storedTariffs);
        } else {
            // Дефолтные тарифы
            tariffsData = [
                {
                    id: 1,
                    name: 'Пробное занятие',
                    price: 500,
                    description: 'Одно занятие для знакомства',
                    features: 'Одно занятие\nЗнакомство с инструктором\nОценка уровня подготовки'
                },
                {
                    id: 2,
                    name: 'Базовый',
                    price: 3500,
                    description: 'Базовый тариф на месяц',
                    features: '8 занятий в месяц\nДоступ к утренним медитациям\nЧат поддержки'
                },
                {
                    id: 3,
                    name: 'Премиум',
                    price: 6000,
                    description: 'Премиум тариф на месяц',
                    features: 'Безлимитные занятия\nЛичная консультация\nДоступ к видеотеке\nУчастие в мастер-классах'
                }
            ];
            localStorage.setItem('lessonTariffs', JSON.stringify(tariffsData));
        }

        if (tariffsData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Нет тарифов</td></tr>';
            return;
        }

        tbody.innerHTML = tariffsData.map(tariff => `
            <tr>
                <td>${tariff.id}</td>
                <td>${tariff.name || ''}</td>
                <td>${tariff.price ? tariff.price.toFixed(2) + ' ₽' : '0.00 ₽'}</td>
                <td>${(tariff.description || '').substring(0, 50)}${tariff.description && tariff.description.length > 50 ? '...' : ''}</td>
                <td>${(tariff.features || '').replace(/\n/g, ', ').substring(0, 50)}${tariff.features && tariff.features.replace(/\n/g, ', ').length > 50 ? '...' : ''}</td>
                <td>
                    <button class="btn btn-primary" onclick="editTariff(${tariff.id})">Редактировать</button>
                    <button class="btn btn-danger" onclick="deleteTariff(${tariff.id})">Удалить</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки тарифов:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Ошибка загрузки данных</td></tr>';
    }
}

function showAddTariffModal() {
    currentTariffId = null;
    document.getElementById('tariffModalTitle').textContent = 'Добавить тариф';
    document.getElementById('tariffForm').reset();
    
    const tariffModal = document.getElementById('tariffModal');
    if (tariffModal) {
        tariffModal.style.display = 'block';
    }
}

function closeTariffModal() {
    const tariffModal = document.getElementById('tariffModal');
    if (!tariffModal) return;
    tariffModal.style.display = 'none';
    currentTariffId = null;
    
    const form = document.getElementById('tariffForm');
    if (form) form.reset();
}

async function editTariff(id) {
    const tariff = tariffsData.find(t => t.id === id);
    if (!tariff) {
        alert('Тариф не найден');
        return;
    }
    
    currentTariffId = id;
    
    document.getElementById('tariffModalTitle').textContent = 'Редактировать тариф';
    document.getElementById('tariffName').value = tariff.name || '';
    document.getElementById('tariffPrice').value = tariff.price || '';
    document.getElementById('tariffDescription').value = tariff.description || '';
    document.getElementById('tariffFeatures').value = tariff.features || '';
    
    const tariffModal = document.getElementById('tariffModal');
    if (tariffModal) {
        tariffModal.style.display = 'block';
    }
}

async function deleteTariff(id) {
    if (!confirm('Вы уверены, что хотите удалить этот тариф?')) {
        return;
    }

    try {
        tariffsData = tariffsData.filter(t => t.id !== id);
        localStorage.setItem('lessonTariffs', JSON.stringify(tariffsData));
        loadTariffs();
    } catch (error) {
        alert('Ошибка удаления: ' + error.message);
    }
}

function setupTariffForm() {
    const form = document.getElementById('tariffForm');
    if (!form) {
        setTimeout(setupTariffForm, 200);
        return;
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            name: document.getElementById('tariffName').value,
            price: parseFloat(document.getElementById('tariffPrice').value) || 0,
            description: document.getElementById('tariffDescription').value || '',
            features: document.getElementById('tariffFeatures').value || '',
        };
        
        try {
            if (currentTariffId) {
                // Редактирование
                const index = tariffsData.findIndex(t => t.id === currentTariffId);
                if (index !== -1) {
                    tariffsData[index] = { ...tariffsData[index], ...data };
                }
            } else {
                // Добавление
                const newId = tariffsData.length > 0 ? Math.max(...tariffsData.map(t => t.id)) + 1 : 1;
                tariffsData.push({ id: newId, ...data });
            }
            
            localStorage.setItem('lessonTariffs', JSON.stringify(tariffsData));
            closeTariffModal();
            loadTariffs();
        } catch (error) {
            alert('Ошибка сохранения: ' + error.message);
        }
    });
}
