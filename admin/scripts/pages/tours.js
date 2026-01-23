/**
 * Страница управления ретритами (только для админов)
 */

export default {
    render: async () => {
        return `
            <div id="tours-page">
                <div class="page-header">
                    <h1>Ретриты</h1>
                    <button class="btn btn-primary" onclick="showAddTourModal()">Добавить ретрит</button>
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
                    document.getElementById('page-title').textContent = 'Управление ретритами';
                    await loadTours();
                })();
            </script>
        `;
    },
    
    init: async () => {
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = 'Управление ретритами';
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
                <h2 id="modalTitle">Добавить ретрит</h2>
                <form id="tourForm">
                    <div class="form-group">
                        <label>Название ретрита</label>
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
                        <label>Цена</label>
                        <input type="number" id="tourPrice" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>URL для записи</label>
                        <input type="url" id="tourBookingUrl">
                    </div>
                    <div class="form-group">
                        <label>Галерея (загрузить фото и видео)</label>
                        <input type="file" id="tourGallery" multiple accept="image/*,video/*">
                        <div id="galleryPreview" style="margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 10px;"></div>
                        <div id="galleryUploadProgress" style="margin-top: 1rem; display: none;">
                            <div style="background: #f0f0f0; border-radius: 4px; height: 20px; position: relative;">
                                <div id="galleryProgressFill" style="background: #48BDCC; height: 100%; width: 0%; border-radius: 4px; transition: width 0.3s;"></div>
                            </div>
                            <p id="galleryUploadStatus" style="margin-top: 5px; font-size: 0.9rem; color: #666;"></p>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                </form>
            </div>
        </div>
    `;
}

let currentTourId = null;
let tourGallery = []; // Массив URL загруженных файлов

async function loadTours() {
    const tbody = document.getElementById('toursTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Загрузка...</td></tr>';

    try {
        const response = await api.get('/admin/tours');
        const tours = response.data || response;

        if (tours.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Нет ретритов</td></tr>';
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
                    <button class="btn btn-edit" onclick="editTour(${tour.id})">Редактировать</button>
                    <button class="btn btn-danger" onclick="deleteTour(${tour.id})">Удалить</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки ретритов:', error);
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
    tourGallery = [];
    document.getElementById('modalTitle').textContent = 'Добавить ретрит';
    document.getElementById('tourForm').reset();
    document.getElementById('galleryPreview').innerHTML = '';
    document.getElementById('tourGallery').value = '';
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
        tourGallery = tour.gallery || [];
        
        document.getElementById('modalTitle').textContent = 'Редактировать ретрит';
        document.getElementById('tourTitle').value = tour.title || '';
        document.getElementById('tourDescription').value = tour.description || '';
        document.getElementById('tourStartDate').value = tour.start_date || '';
        document.getElementById('tourEndDate').value = tour.end_date || '';
        document.getElementById('tourLocation').value = tour.location || '';
        document.getElementById('tourPrice').value = tour.price || '';
        document.getElementById('tourBookingUrl').value = tour.booking_url || '';
        
        // Отображаем существующую галерею
        renderGalleryPreview();
        
        document.getElementById('tourModal').style.display = 'block';
    } catch (error) {
        alert('Ошибка загрузки ретрита: ' + error.message);
    }
};

window.deleteTour = async function(id) {
    if (!confirm('Вы уверены, что хотите удалить этот ретрит?')) {
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
            price: document.getElementById('tourPrice').value ? parseFloat(document.getElementById('tourPrice').value) : null,
            booking_url: document.getElementById('tourBookingUrl').value || '',
            status: 'upcoming',
            gallery: tourGallery,
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

    // Превью и загрузка галереи
    const galleryInput = document.getElementById('tourGallery');
    if (galleryInput) {
        galleryInput.addEventListener('change', async function(e) {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;
            
            const preview = document.getElementById('galleryPreview');
            const progressContainer = document.getElementById('galleryUploadProgress');
            const progressFill = document.getElementById('galleryProgressFill');
            const uploadStatus = document.getElementById('galleryUploadStatus');
            
            progressContainer.style.display = 'block';
            progressFill.style.width = '0%';
            uploadStatus.textContent = 'Подготовка к загрузке...';
            
            try {
                // Загружаем файлы по очереди
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    uploadStatus.textContent = `Загрузка ${i + 1} из ${files.length}: ${file.name}...`;
                    
                    // Создаем FormData для загрузки
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    // Загружаем файл
                    const response = await api.uploadFile('/upload', formData, (percent) => {
                        const totalPercent = ((i / files.length) * 100) + (percent / files.length);
                        progressFill.style.width = totalPercent + '%';
                        uploadStatus.textContent = `Загрузка ${i + 1} из ${files.length}: ${file.name}... ${Math.round(percent)}%`;
                    });
                    
                    if (response.success && response.data) {
                        const fileUrl = response.data.publicUrl || response.data.url;
                        tourGallery.push(fileUrl);
                        
                        // Добавляем превью
                        addGalleryPreviewItem(fileUrl, file.type);
                    } else {
                        throw new Error('Ошибка загрузки файла');
                    }
                }
                
                progressFill.style.width = '100%';
                uploadStatus.textContent = `✅ Загружено ${files.length} файл(ов)`;
                uploadStatus.style.color = '#27ae60';
                
                // Очищаем input
                galleryInput.value = '';
                
                // Скрываем прогресс через 2 секунды
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                }, 2000);
            } catch (error) {
                progressContainer.style.display = 'none';
                alert('Ошибка загрузки файлов: ' + error.message);
                console.error('Upload error:', error);
            }
        });
    }
    
    // Функция для отображения превью элемента галереи
    function addGalleryPreviewItem(url, mimeType) {
        const preview = document.getElementById('galleryPreview');
        const item = document.createElement('div');
        item.style.position = 'relative';
        item.style.width = '150px';
        item.style.height = '150px';
        item.style.margin = '5px';
        item.style.borderRadius = '5px';
        item.style.overflow = 'hidden';
        item.style.background = '#f0f0f0';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'center';
        
        if (mimeType && mimeType.startsWith('video/')) {
            // Для видео показываем видео элемент
            const video = document.createElement('video');
            video.src = url;
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'cover';
            video.controls = false;
            video.muted = true;
            item.appendChild(video);
            
            // Добавляем иконку play
            const playIcon = document.createElement('div');
            playIcon.innerHTML = '▶';
            playIcon.style.position = 'absolute';
            playIcon.style.top = '50%';
            playIcon.style.left = '50%';
            playIcon.style.transform = 'translate(-50%, -50%)';
            playIcon.style.fontSize = '30px';
            playIcon.style.color = 'white';
            playIcon.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)';
            playIcon.style.pointerEvents = 'none';
            item.appendChild(playIcon);
        } else {
            // Для изображений показываем img
            const img = document.createElement('img');
            img.src = url;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            item.appendChild(img);
        }
        
        // Кнопка удаления
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '×';
        removeBtn.style.position = 'absolute';
        removeBtn.style.top = '5px';
        removeBtn.style.right = '5px';
        removeBtn.style.background = 'rgba(255, 0, 0, 0.8)';
        removeBtn.style.color = 'white';
        removeBtn.style.border = 'none';
        removeBtn.style.borderRadius = '50%';
        removeBtn.style.width = '25px';
        removeBtn.style.height = '25px';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.fontSize = '18px';
        removeBtn.style.lineHeight = '1';
        removeBtn.onclick = function(e) {
            e.stopPropagation();
            const index = tourGallery.indexOf(url);
            if (index > -1) {
                tourGallery.splice(index, 1);
            }
            item.remove();
        };
        item.appendChild(removeBtn);
        
        preview.appendChild(item);
    }
    
    // Функция для отображения существующей галереи
    function renderGalleryPreview() {
        const preview = document.getElementById('galleryPreview');
        preview.innerHTML = '';
        
        tourGallery.forEach(url => {
            // Определяем тип файла по расширению или URL
            const isVideo = url.match(/\.(mp4|webm|mov|avi|mkv)(\?|$)/i) || url.includes('/videos/');
            const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
            addGalleryPreviewItem(url, mimeType);
        });
    }
    
    // Делаем функцию доступной глобально
    window.renderGalleryPreview = renderGalleryPreview;
}

// Закрытие модального окна при клике вне его
document.addEventListener('click', function(event) {
    const modal = document.getElementById('tourModal');
    if (modal && event.target === modal) {
        closeTourModal();
    }
});
