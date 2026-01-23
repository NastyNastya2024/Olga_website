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

                <div class="club-sections-container">
                    <!-- Секция цен -->
                    <div class="club-prices-section">
                    <div class="club-prices-header">
                        <h2>Цены клуба</h2>
                        <button type="submit" form="clubPricesForm" class="btn btn-primary">Сохранить цены и описания</button>
                    </div>
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
                    </form>
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
            </div>
            
            ${getEventModal()}
        `;
    },
    
    init: async () => {
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = 'Клуб';
        }
        
        // Инициализация функций для мероприятий
        window.loadEvents = loadEvents;
        window.showAddEventModal = showAddEventModal;
        window.closeEventModal = closeEventModal;
        window.editEvent = editEvent;
        window.deleteEvent = deleteEvent;
        
        // Загружаем данные
        await loadPrices();
        await loadEvents();
        
        // Настраиваем формы
        setupPricesForm();
        setTimeout(() => {
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
                    <button class="btn btn-edit" onclick="editEvent(${event.id})">Редактировать</button>
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
