/**
 * Скрипт управления турами (только для админов)
 */

// Проверка авторизации
if (!isAuthenticated()) {
    window.location.href = 'login.html';
}

// Проверка прав доступа - только админы
if (!isAdmin()) {
    document.getElementById('accessDenied').style.display = 'block';
    document.getElementById('toursContent').style.display = 'none';
} else {
    document.getElementById('accessDenied').style.display = 'none';
    document.getElementById('toursContent').style.display = 'block';
}

const userData = getUserData();
if (userData) {
    document.getElementById('userEmail').textContent = userData.email;
}

let currentTourId = null;

// Загрузка списка туров
async function loadTours() {
    const tbody = document.getElementById('toursTableBody');
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

// Форматирование диапазона дат
function formatDateRange(startDate, endDate) {
    if (!startDate || !endDate) return '-';
    const start = new Date(startDate).toLocaleDateString('ru-RU');
    const end = new Date(endDate).toLocaleDateString('ru-RU');
    return `${start} - ${end}`;
}

// Показать модальное окно добавления
function showAddTourModal() {
    currentTourId = null;
    document.getElementById('modalTitle').textContent = 'Добавить тур';
    document.getElementById('tourForm').reset();
    document.getElementById('galleryPreview').innerHTML = '';
    document.getElementById('tourModal').style.display = 'block';
}

// Закрыть модальное окно
function closeTourModal() {
    document.getElementById('tourModal').style.display = 'none';
    currentTourId = null;
}

// Редактировать тур
async function editTour(id) {
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
}

// Удалить тур
async function deleteTour(id) {
    if (!confirm('Вы уверены, что хотите удалить этот тур?')) {
        return;
    }

    try {
        await api.delete(`/admin/tours/${id}`);
        loadTours();
    } catch (error) {
        alert('Ошибка удаления: ' + error.message);
    }
}

// Сохранение тура
document.getElementById('tourForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', document.getElementById('tourTitle').value);
    formData.append('description', document.getElementById('tourDescription').value);
    formData.append('start_date', document.getElementById('tourStartDate').value);
    formData.append('end_date', document.getElementById('tourEndDate').value);
    formData.append('location', document.getElementById('tourLocation').value);
    formData.append('program', document.getElementById('tourProgram').value);
    formData.append('price', document.getElementById('tourPrice').value);
    formData.append('booking_url', document.getElementById('tourBookingUrl').value);

    const galleryFiles = document.getElementById('tourGallery').files;
    for (let i = 0; i < galleryFiles.length; i++) {
        formData.append('gallery[]', galleryFiles[i]);
    }

    try {
        if (currentTourId) {
            await api.put(`/admin/tours/${currentTourId}`, Object.fromEntries(formData));
        } else {
            await api.post('/admin/tours', Object.fromEntries(formData));
        }
        
        closeTourModal();
        loadTours();
    } catch (error) {
        alert('Ошибка сохранения: ' + error.message);
    }
});

// Превью галереи
document.getElementById('tourGallery').addEventListener('change', function(e) {
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

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('tourModal');
    if (event.target === modal) {
        closeTourModal();
    }
}

// Загружаем туры при загрузке страницы
if (isAdmin()) {
    loadTours();
}
