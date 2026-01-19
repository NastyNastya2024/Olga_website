/**
 * Страница управления турами (только для админов)
 */

export default {
    render: async () => {
        return `
            <div id="tours-page">
                <div class="page-header">
                    <h1>Туры</h1>
                    <button class="btn btn-primary" onclick="showAddTourModal()">Добавить тур</button>
                </div>

                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Название</th>
                                <th>Даты</th>
                                <th>Локация</th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody id="toursTableBody">
                            <tr>
                                <td colspan="6" class="loading">Загрузка...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            ${getTourModal()}
            
            <script>
                (async function() {
                    document.getElementById('page-title').textContent = 'Управление турами';
                    await loadTours();
                })();
            </script>
        `;
    },
    
    init: async () => {
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = 'Управление турами';
        }
        window.loadTours = loadTours;
        window.showAddTourModal = showAddTourModal;
        window.closeTourModal = closeTourModal;
        window.editTour = editTour;
        window.deleteTour = deleteTour;
        await loadTours();
        setTimeout(() => {
            setupTourForm();
        }, 100);
    }
};

function getTourModal() {
    return `
        <div id="tourModal" class="modal" style="display: none;">
            <div class="modal-content">
                <span class="close" onclick="closeTourModal()">&times;</span>
                <h2 id="modalTitle">Добавить тур</h2>
                <form id="tourForm">
                    <div class="form-group">
                        <label>Название тура</label>
                        <input type="text" id="tourTitle" required>
                    </div>
                    <div class="form-group">
                        <label>Описание</label>
                        <textarea id="tourDescription" rows="5"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Дата начала</label>
                        <input type="date" id="tourStartDate" required>
                    </div>
                    <div class="form-group">
                        <label>Дата окончания</label>
                        <input type="date" id="tourEndDate" required>
                    </div>
                    <div class="form-group">
                        <label>Локация</label>
                        <input type="text" id="tourLocation" required>
                    </div>
                    <div class="form-group">
                        <label>Программа</label>
                        <textarea id="tourProgram" rows="5"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Цена</label>
                        <input type="number" id="tourPrice" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>URL для записи</label>
                        <input type="url" id="tourBookingUrl">
                    </div>
                    <div class="form-group">
                        <label>Галерея (загрузить фото)</label>
                        <input type="file" id="tourGallery" multiple accept="image/*">
                        <div id="galleryPreview" style="margin-top: 1rem;"></div>
                    </div>
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                </form>
            </div>
        </div>
    `;
}

let currentTourId = null;

async function loadTours() {
    const tbody = document.getElementById('toursTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Загрузка...</td></tr>';

    try {
        const response = await api.get('/admin/tours');
        const tours = response.data || response;

        if (tours.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Нет туров</td></tr>';
            return;
        }

        tbody.innerHTML = tours.map(tour => `
            <tr>
                <td>${tour.id}</td>
                <td>${tour.title}</td>
                <td>${formatDateRange(tour.start_date, tour.end_date)}</td>
                <td>${tour.location || '-'}</td>
                <td><span class="status-badge ${tour.status}">${tour.status === 'upcoming' ? 'Предстоящий' : 'Прошедший'}</span></td>
                <td>
                    <button class="btn btn-primary" onclick="editTour(${tour.id})">Редактировать</button>
                    <button class="btn btn-danger" onclick="deleteTour(${tour.id})">Удалить</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки туров:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Ошибка загрузки данных</td></tr>';
    }
}

function formatDateRange(startDate, endDate) {
    if (!startDate || !endDate) return '-';
    const start = new Date(startDate).toLocaleDateString('ru-RU');
    const end = new Date(endDate).toLocaleDateString('ru-RU');
    return `${start} - ${end}`;
}

window.showAddTourModal = function() {
    currentTourId = null;
    document.getElementById('modalTitle').textContent = 'Добавить тур';
    document.getElementById('tourForm').reset();
    document.getElementById('galleryPreview').innerHTML = '';
    document.getElementById('tourModal').style.display = 'block';
};

window.closeTourModal = function() {
    document.getElementById('tourModal').style.display = 'none';
    currentTourId = null;
};

window.editTour = async function(id) {
    try {
        const tour = await api.get(`/admin/tours/${id}`);
        currentTourId = id;
        
        document.getElementById('modalTitle').textContent = 'Редактировать тур';
        document.getElementById('tourTitle').value = tour.title || '';
        document.getElementById('tourDescription').value = tour.description || '';
        document.getElementById('tourStartDate').value = tour.start_date || '';
        document.getElementById('tourEndDate').value = tour.end_date || '';
        document.getElementById('tourLocation').value = tour.location || '';
        document.getElementById('tourProgram').value = tour.program || '';
        document.getElementById('tourPrice').value = tour.price || '';
        document.getElementById('tourBookingUrl').value = tour.booking_url || '';
        
        document.getElementById('tourModal').style.display = 'block';
    } catch (error) {
        alert('Ошибка загрузки тура: ' + error.message);
    }
};

window.deleteTour = async function(id) {
    if (!confirm('Вы уверены, что хотите удалить этот тур?')) {
        return;
    }

    try {
        await api.delete(`/admin/tours/${id}`);
        loadTours();
    } catch (error) {
        alert('Ошибка удаления: ' + error.message);
    }
};

function setupTourForm() {
    const form = document.getElementById('tourForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            title: document.getElementById('tourTitle').value,
            description: document.getElementById('tourDescription').value,
            start_date: document.getElementById('tourStartDate').value || null,
            end_date: document.getElementById('tourEndDate').value || null,
            location: document.getElementById('tourLocation').value || '',
            program: document.getElementById('tourProgram').value || '',
            price: document.getElementById('tourPrice').value ? parseFloat(document.getElementById('tourPrice').value) : null,
            booking_url: document.getElementById('tourBookingUrl').value || '',
            status: 'upcoming',
        };

        try {
            if (currentTourId) {
                await api.put(`/admin/tours/${currentTourId}`, data);
            } else {
                await api.post('/admin/tours', data);
            }
            
            closeTourModal();
            loadTours();
        } catch (error) {
            alert('Ошибка сохранения: ' + error.message);
        }
    });

    // Превью галереи
    const galleryInput = document.getElementById('tourGallery');
    if (galleryInput) {
        galleryInput.addEventListener('change', function(e) {
            const preview = document.getElementById('galleryPreview');
            preview.innerHTML = '';
            
            Array.from(e.target.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.maxWidth = '150px';
                    img.style.margin = '5px';
                    img.style.borderRadius = '5px';
                    preview.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        });
    }
}

// Закрытие модального окна при клике вне его
document.addEventListener('click', function(event) {
    const modal = document.getElementById('tourModal');
    if (modal && event.target === modal) {
        closeTourModal();
    }
});
