/**
 * Страница управления тарифами на главной странице
 */

export default {
    render: async () => {
        return `
            <div id="pricing-tariffs-page">
                <div class="page-header">
                    <h1>Тарифы</h1>
                    <button class="btn btn-primary" onclick="showAddTariffModal()">Добавить тариф</button>
                </div>

                <div class="pricing-tariffs-section">

                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Название</th>
                                    <th>Цена</th>
                                    <th>Описание</th>
                                    <th>Популярный</th>
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

                <!-- Модальное окно для добавления/редактирования тарифа -->
                <div id="tariffModal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2 id="tariffModalTitle">Добавить тариф</h2>
                            <button class="modal-close" onclick="closeTariffModal()">&times;</button>
                        </div>
                        <form id="tariffForm" class="modal-body">
                            <input type="hidden" id="tariffId">
                            
                            <div class="form-group">
                                <label for="tariffName">Название тарифа *</label>
                                <input type="text" id="tariffName" required placeholder="Например: Пробное занятие">
                            </div>
                            
                            <div class="form-group">
                                <label for="tariffPrice">Цена *</label>
                                <input type="text" id="tariffPrice" required placeholder="Например: 500₽ или 3500₽ / месяц">
                            </div>
                            
                            <div class="form-group">
                                <label for="tariffDescription">Описание</label>
                                <textarea id="tariffDescription" rows="5" placeholder="Введите описание тарифа. Каждое преимущество с новой строки (например: ✓ Одно занятие)"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="tariffIsPopular">
                                    <span>Пометить как популярный</span>
                                </label>
                            </div>
                            
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" onclick="closeTariffModal()">Отмена</button>
                                <button type="submit" class="btn btn-primary">Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    init: async () => {
        await loadTariffs();
        setupTariffForm();
    }
};

/**
 * Загрузка тарифов
 */
async function loadTariffs() {
    const tbody = document.getElementById('tariffsTableBody');
    if (!tbody) return;

    try {
        const response = await api.get('/admin/pricing-tariffs');
        const data = response.data || response;
        const tariffs = data.items || [];

        if (tariffs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Тарифы пока не добавлены</td></tr>';
            return;
        }

        tbody.innerHTML = tariffs.map(tariff => `
            <tr>
                <td>${tariff.id}</td>
                <td>${escapeHtml(tariff.name || '')}</td>
                <td>${escapeHtml(tariff.price || '')}</td>
                <td>${escapeHtml(tariff.description || '').substring(0, 50)}${tariff.description && tariff.description.length > 50 ? '...' : ''}</td>
                <td>${tariff.is_popular ? '✓' : ''}</td>
                <td>
                    <button class="btn btn-sm btn-edit" onclick="editTariff(${tariff.id})">Редактировать</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTariff(${tariff.id})">Удалить</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки тарифов:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="error">Ошибка загрузки тарифов</td></tr>';
    }
}

/**
 * Показать модальное окно для добавления тарифа
 */
window.showAddTariffModal = function() {
    const modal = document.getElementById('tariffModal');
    const title = document.getElementById('tariffModalTitle');
    const form = document.getElementById('tariffForm');
    
    if (modal && title && form) {
        title.textContent = 'Добавить тариф';
        form.reset();
        document.getElementById('tariffId').value = '';
        modal.style.display = 'flex';
    }
};

/**
 * Редактировать тариф
 */
window.editTariff = async function(id) {
    try {
        const response = await api.get('/admin/pricing-tariffs');
        const data = response.data || response;
        const tariffs = data.items || [];
        const tariff = tariffs.find(t => t.id === id);
        
        if (!tariff) {
            alert('Тариф не найден');
            return;
        }
        
        const modal = document.getElementById('tariffModal');
        const title = document.getElementById('tariffModalTitle');
        
        if (modal && title) {
            title.textContent = 'Редактировать тариф';
            document.getElementById('tariffId').value = tariff.id;
            document.getElementById('tariffName').value = tariff.name || '';
            document.getElementById('tariffPrice').value = tariff.price || '';
            document.getElementById('tariffDescription').value = tariff.description || '';
            document.getElementById('tariffIsPopular').checked = tariff.is_popular || false;
            modal.style.display = 'flex';
        }
    } catch (error) {
        console.error('Ошибка загрузки тарифа:', error);
        alert('Ошибка загрузки тарифа');
    }
};

/**
 * Удалить тариф
 */
window.deleteTariff = async function(id) {
    if (!confirm('Вы уверены, что хотите удалить этот тариф?')) {
        return;
    }
    
    try {
        await api.delete(`/admin/pricing-tariffs/${id}`);
        await loadTariffs();
        alert('Тариф удален');
    } catch (error) {
        console.error('Ошибка удаления тарифа:', error);
        alert('Ошибка удаления тарифа');
    }
};

/**
 * Закрыть модальное окно
 */
window.closeTariffModal = function() {
    const modal = document.getElementById('tariffModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

/**
 * Настройка формы тарифа
 */
function setupTariffForm() {
    const form = document.getElementById('tariffForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('tariffId').value;
        const name = document.getElementById('tariffName').value.trim();
        const price = document.getElementById('tariffPrice').value.trim();
        const description = document.getElementById('tariffDescription').value.trim();
        const isPopular = document.getElementById('tariffIsPopular').checked;
        
        if (!name || !price) {
            alert('Название и цена обязательны');
            return;
        }
        
        try {
            const tariffData = {
                name,
                price,
                description,
                is_popular: isPopular
            };
            
            if (id) {
                // Редактирование
                await api.put(`/admin/pricing-tariffs/${id}`, tariffData);
                alert('Тариф обновлен');
            } else {
                // Создание
                await api.post('/admin/pricing-tariffs', tariffData);
                alert('Тариф создан');
            }
            
            closeTariffModal();
            await loadTariffs();
        } catch (error) {
            console.error('Ошибка сохранения тарифа:', error);
            alert('Ошибка сохранения тарифа');
        }
    });
    
    // Закрытие модального окна при клике вне его
    const modal = document.getElementById('tariffModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeTariffModal();
            }
        });
    }
}

/**
 * Экранирование HTML
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
