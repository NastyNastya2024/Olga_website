/**
 * Страница управления ценами клуба
 */

export default {
    render: async () => {
        return `
            <div id="club-prices-page">
                <div class="page-header">
                    <h1>Цены клуба</h1>
                </div>

                <div class="admin-content">
                    <form id="clubPricesForm" class="club-prices-form">
                        <div class="form-group">
                            <label for="price1Month">Цена на 1 месяц (руб.)</label>
                            <input type="number" id="price1Month" step="0.01" min="0" placeholder="0.00">
                        </div>
                        
                        <div class="form-group">
                            <label for="price3Months">Цена на 3 месяца (руб.)</label>
                            <input type="number" id="price3Months" step="0.01" min="0" placeholder="0.00">
                        </div>
                        
                        <div class="form-group">
                            <label for="price6Months">Цена на 6 месяцев (руб.)</label>
                            <input type="number" id="price6Months" step="0.01" min="0" placeholder="0.00">
                        </div>
                        
                        <button type="submit" class="btn btn-primary">Сохранить цены</button>
                    </form>
                </div>
            </div>
        `;
    },
    
    init: async () => {
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = 'Цены клуба';
        }
        
        await loadPrices();
        setupPricesForm();
    }
};

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
