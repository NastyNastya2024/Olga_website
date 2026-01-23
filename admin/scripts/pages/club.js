/**
 * Страница управления клубом (цены и отзывы)
 */

export default {
    render: async () => {
        return `
            <div id="club-page">
                <div class="page-header">
                    <h1>Клуб</h1>
                </div>

                <!-- Секция цен -->
                <div class="club-prices-section">
                    <h2>Цены клуба</h2>
                    <form id="clubPricesForm" class="club-prices-form">
                        <div class="price-form-group">
                            <div class="price-input-group">
                                <label for="price1Month">1 месяц</label>
                                <input type="number" id="price1Month" step="0.01" min="0" placeholder="0.00">
                                <span class="price-currency">руб.</span>
                            </div>
                            <div class="price-description-group">
                                <label for="description1Month">Описание (1 месяц)</label>
                                <textarea id="description1Month" rows="3" placeholder="Описание тарифа на 1 месяц"></textarea>
                            </div>
                        </div>
                        
                        <div class="price-form-group">
                            <div class="price-input-group">
                                <label for="price3Months">3 месяца</label>
                                <input type="number" id="price3Months" step="0.01" min="0" placeholder="0.00">
                                <span class="price-currency">руб.</span>
                            </div>
                            <div class="price-description-group">
                                <label for="description3Months">Описание (3 месяца)</label>
                                <textarea id="description3Months" rows="3" placeholder="Описание тарифа на 3 месяца"></textarea>
                            </div>
                        </div>
                        
                        <div class="price-form-group">
                            <div class="price-input-group">
                                <label for="price6Months">6 месяцев</label>
                                <input type="number" id="price6Months" step="0.01" min="0" placeholder="0.00">
                                <span class="price-currency">руб.</span>
                            </div>
                            <div class="price-description-group">
                                <label for="description6Months">Описание (6 месяцев)</label>
                                <textarea id="description6Months" rows="3" placeholder="Описание тарифа на 6 месяцев"></textarea>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary">Сохранить цены и описания</button>
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

                <!-- Секция мероприятий -->
                <div class="club-events-section">
                    <div class="club-events-header">
                        <h2>Мероприятия</h2>
                        <button class="btn btn-primary" onclick="showAddEventModal()">Добавить мероприятие</button>
                    </div>

                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Название</th>
                                    <th>Дата</th>
                                    <th>Статус</th>
                                    <th>Галерея</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody id="eventsTableBody">
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
            ${getEventModal()}
        `;
    },
    
    init: async () => {
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = 'Клуб';
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
        
        // Инициализация функций для мероприятий
        window.loadEvents = loadEvents;
        window.showAddEventModal = showAddEventModal;
        window.closeEventModal = closeEventModal;
        window.editEvent = editEvent;
        window.deleteEvent = deleteEvent;
        
        // Загружаем данные
        await loadPrices();
        await loadReviews();
        await loadTariffs();
        await loadEvents();
        
        // Настраиваем формы
        setupPricesForm();
        setTimeout(() => {
            setupReviewForm();
            setupTariffForm();
            setupEventForm();
        }, 100);
    }
};

// ========== Функции для цен ==========

async function loadPrices() {
    try {
        const response = await api.get('/admin/club/prices');
        const prices = response.data || response;
        
        console.log('Загруженные цены:', prices);
        
        const price1MonthEl = document.getElementById('price1Month');
        const price3MonthsEl = document.getElementById('price3Months');
        const price6MonthsEl = document.getElementById('price6Months');
        const description1MonthEl = document.getElementById('description1Month');
        const description3MonthsEl = document.getElementById('description3Months');
        const description6MonthsEl = document.getElementById('description6Months');
        
        if (!price1MonthEl || !price3MonthsEl || !price6MonthsEl || !description1MonthEl || !description3MonthsEl || !description6MonthsEl) {
            console.error('Элементы формы не найдены, повторная попытка через 200ms');
            setTimeout(loadPrices, 200);
            return;
        }
        
        // Загружаем цены
        if (prices.price_1_month !== null && prices.price_1_month !== undefined) {
            price1MonthEl.value = prices.price_1_month;
        } else {
            price1MonthEl.value = '';
        }
        
        if (prices.price_3_months !== null && prices.price_3_months !== undefined) {
            price3MonthsEl.value = prices.price_3_months;
        } else {
            price3MonthsEl.value = '';
        }
        
        if (prices.price_6_months !== null && prices.price_6_months !== undefined) {
            price6MonthsEl.value = prices.price_6_months;
        } else {
            price6MonthsEl.value = '';
        }
        
        // Загружаем описания
        description1MonthEl.value = prices.description_1_month || '';
        description3MonthsEl.value = prices.description_3_months || '';
        description6MonthsEl.value = prices.description_6_months || '';
        
        console.log('Цены успешно загружены в форму');
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
        
        const price1Month = document.getElementById('price1Month');
        const price3Months = document.getElementById('price3Months');
        const price6Months = document.getElementById('price6Months');
        const description1Month = document.getElementById('description1Month');
        const description3Months = document.getElementById('description3Months');
        const description6Months = document.getElementById('description6Months');
        
        if (!price1Month || !price3Months || !price6Months || !description1Month || !description3Months || !description6Months) {
            console.error('Не найдены элементы формы');
            alert('Ошибка: элементы формы не найдены');
            return;
        }
        
        const data = {
            price_1_month: price1Month.value ? parseFloat(price1Month.value) : null,
            price_3_months: price3Months.value ? parseFloat(price3Months.value) : null,
            price_6_months: price6Months.value ? parseFloat(price6Months.value) : null,
            description_1_month: description1Month.value || '',
            description_3_months: description3Months.value || '',
            description_6_months: description6Months.value || '',
        };
        
        console.log('Отправка данных:', data);
        
        try {
            const response = await api.put('/admin/club/prices', data);
            console.log('Ответ от сервера:', response);
            alert('Цены и описания успешно сохранены!');
            // Перезагружаем данные после сохранения
            await loadPrices();
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Ошибка сохранения цен: ' + (error.message || 'Неизвестная ошибка'));
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
    try {
        // Перезагружаем тарифы, чтобы получить актуальные данные
        await loadTariffs();
        
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
    } catch (error) {
        alert('Ошибка загрузки тарифа: ' + (error.message || 'Неизвестная ошибка'));
    }
}

async function deleteTariff(id) {
    if (!confirm('Вы уверены, что хотите удалить этот тариф?')) {
        return;
    }

    try {
        await api.delete(`/admin/club/lesson-tariffs/${id}`);
        loadTariffs();
    } catch (error) {
        alert('Ошибка удаления: ' + (error.message || 'Неизвестная ошибка'));
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
                await api.put(`/admin/club/lesson-tariffs/${currentTariffId}`, data);
            } else {
                // Добавление
                await api.post('/admin/club/lesson-tariffs', data);
            }
            
            closeTariffModal();
            loadTariffs();
        } catch (error) {
            alert('Ошибка сохранения: ' + (error.message || 'Неизвестная ошибка'));
        }
    });
}

// ========== Функции для мероприятий ==========

function getEventModal() {
    return `
        <div id="eventModal" class="modal" style="display: none;">
            <div class="modal-content" style="max-width: 800px;">
                <span class="close" onclick="closeEventModal()">&times;</span>
                <h2 id="eventModalTitle">Добавить мероприятие</h2>
                <form id="eventForm">
                    <div class="form-group">
                        <label>Название мероприятия</label>
                        <input type="text" id="eventTitle" required>
                    </div>
                    <div class="form-group">
                        <label>Описание</label>
                        <textarea id="eventDescription" rows="4"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Дата мероприятия</label>
                        <input type="date" id="eventDate" required>
                    </div>
                    <div class="form-group">
                        <label>Статус</label>
                        <select id="eventStatus">
                            <option value="upcoming">Предстоящее</option>
                            <option value="past">Прошедшее</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Обложка (загрузить изображение)</label>
                        <input type="file" id="eventCover" accept="image/*">
                        <div id="eventCoverPreview" style="margin-top: 1rem;"></div>
                        <div id="eventCoverUploadProgress" style="margin-top: 1rem; display: none;">
                            <div style="background: #f0f0f0; border-radius: 4px; height: 20px; position: relative;">
                                <div id="eventCoverProgressFill" style="background: #48BDCC; height: 100%; width: 0%; border-radius: 4px; transition: width 0.3s;"></div>
                            </div>
                            <p id="eventCoverUploadStatus" style="margin-top: 5px; font-size: 0.9rem; color: #666;"></p>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                </form>
            </div>
        </div>
    `;
}

let currentEventId = null;
let eventCover = null;

async function loadEvents() {
    const tbody = document.getElementById('eventsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Загрузка...</td></tr>';

    try {
        const response = await api.get('/admin/club/events');
        const events = response.data || response;

        if (events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Нет мероприятий</td></tr>';
            return;
        }

        tbody.innerHTML = events.map(event => `
            <tr>
                <td>${event.id}</td>
                <td>${event.title || ''}</td>
                <td>${event.date ? new Date(event.date).toLocaleDateString('ru-RU') : '-'}</td>
                <td><span class="status-badge ${event.status}">${event.status === 'upcoming' ? 'Предстоящее' : 'Прошедшее'}</span></td>
                <td>${event.cover ? 'Есть' : 'Нет'}</td>
                <td>
                    <button class="btn btn-primary" onclick="editEvent(${event.id})">Редактировать</button>
                    <button class="btn btn-danger" onclick="deleteEvent(${event.id})">Удалить</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки мероприятий:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Ошибка загрузки данных</td></tr>';
    }
}

function showAddEventModal() {
    currentEventId = null;
    eventCover = null;
    document.getElementById('eventModalTitle').textContent = 'Добавить мероприятие';
    document.getElementById('eventForm').reset();
    document.getElementById('eventCoverPreview').innerHTML = '';
    document.getElementById('eventCover').value = '';
    
    const eventModal = document.getElementById('eventModal');
    if (eventModal) {
        eventModal.style.display = 'block';
    }
}

function closeEventModal() {
    const eventModal = document.getElementById('eventModal');
    if (!eventModal) return;
    eventModal.style.display = 'none';
    currentEventId = null;
    eventCover = null;
    
    const form = document.getElementById('eventForm');
    if (form) form.reset();
    
    document.getElementById('eventCoverPreview').innerHTML = '';
}

async function editEvent(id) {
    try {
        const event = await api.get(`/admin/club/events/${id}`);
        currentEventId = id;
        eventCover = event.cover || null;
        
        document.getElementById('eventModalTitle').textContent = 'Редактировать мероприятие';
        document.getElementById('eventTitle').value = event.title || '';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventDate').value = event.date || '';
        document.getElementById('eventStatus').value = event.status || 'upcoming';
        
        // Отображаем существующую обложку
        renderEventCoverPreview();
        
        const eventModal = document.getElementById('eventModal');
        if (eventModal) {
            eventModal.style.display = 'block';
        }
    } catch (error) {
        alert('Ошибка загрузки мероприятия: ' + error.message);
    }
}

async function deleteEvent(id) {
    if (!confirm('Вы уверены, что хотите удалить это мероприятие?')) {
        return;
    }

    try {
        await api.delete(`/admin/club/events/${id}`);
        loadEvents();
    } catch (error) {
        alert('Ошибка удаления: ' + error.message);
    }
}

function renderEventCoverPreview() {
    const preview = document.getElementById('eventCoverPreview');
    if (!preview) return;
    
    if (eventCover) {
        preview.innerHTML = `
            <div style="position: relative; width: 200px; height: 200px; border-radius: 8px; overflow: hidden; background: #f0f0f0;">
                <img src="${eventCover}" style="width: 100%; height: 100%; object-fit: cover;" alt="Preview">
                <button type="button" onclick="removeEventCover()" style="position: absolute; top: 5px; right: 5px; background: red; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px;">×</button>
            </div>
        `;
    } else {
        preview.innerHTML = '';
    }
}

window.removeEventCover = function() {
    eventCover = null;
    renderEventCoverPreview();
};

function setupEventForm() {
    const form = document.getElementById('eventForm');
    if (!form) {
        setTimeout(setupEventForm, 200);
        return;
    }
    
    // Превью и загрузка обложки
    const coverInput = document.getElementById('eventCover');
    if (coverInput) {
        coverInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const preview = document.getElementById('eventCoverPreview');
            const progressContainer = document.getElementById('eventCoverUploadProgress');
            const progressFill = document.getElementById('eventCoverProgressFill');
            const uploadStatus = document.getElementById('eventCoverUploadStatus');
            
            progressContainer.style.display = 'block';
            progressFill.style.width = '0%';
            uploadStatus.textContent = 'Подготовка к загрузке...';
            
            try {
                // Создаем FormData для загрузки
                const formData = new FormData();
                formData.append('file', file);
                
                // Загружаем файл
                const response = await api.uploadFile('/upload', formData, (percent) => {
                    progressFill.style.width = percent + '%';
                    uploadStatus.textContent = `Загрузка ${file.name}... ${Math.round(percent)}%`;
                });
                
                if (response.success && response.data) {
                    eventCover = response.data.publicUrl || response.data.url;
                    renderEventCoverPreview();
                }
                
                progressContainer.style.display = 'none';
                coverInput.value = '';
            } catch (error) {
                console.error('Ошибка загрузки файла:', error);
                alert('Ошибка загрузки файла: ' + error.message);
                progressContainer.style.display = 'none';
            }
        });
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            title: document.getElementById('eventTitle').value,
            description: document.getElementById('eventDescription').value || '',
            date: document.getElementById('eventDate').value || null,
            status: document.getElementById('eventStatus').value || 'upcoming',
            cover: eventCover || null,
        };

        try {
            if (currentEventId) {
                await api.put(`/admin/club/events/${currentEventId}`, data);
            } else {
                await api.post('/admin/club/events', data);
            }
            
            closeEventModal();
            loadEvents();
        } catch (error) {
            alert('Ошибка сохранения: ' + error.message);
        }
    });
}
