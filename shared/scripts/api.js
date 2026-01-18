/**
 * Общий API клиент для всего проекта
 */

const API_BASE_URL = 'http://localhost:5000/api';

class ApiClient {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Получить токен из localStorage
     */
    getToken() {
        return localStorage.getItem('auth_token');
    }

    /**
     * Установить токен
     */
    setToken(token) {
        localStorage.setItem('auth_token', token);
    }

    /**
     * Удалить токен
     */
    removeToken() {
        localStorage.removeItem('auth_token');
    }

    /**
     * Базовый метод для запросов
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const token = this.getToken();

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                // Авторизация отключена - токен не требуется, но оставляем для совместимости
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);
            
            // Проверяем, что ответ является JSON
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(text || 'Ошибка сервера');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Ошибка запроса');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            
            // Улучшенная обработка ошибок
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Не удалось подключиться к серверу. Убедитесь, что backend запущен на порту 5000.');
            }
            
            throw error;
        }
    }

    /**
     * GET запрос
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    /**
     * POST запрос
     */
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * PUT запрос
     */
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * DELETE запрос
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    /**
     * Загрузка файла
     */
    async uploadFile(endpoint, formData) {
        const url = `${this.baseUrl}${endpoint}`;
        const token = this.getToken();

        const config = {
            method: 'POST',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: formData,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка загрузки файла');
            }

            return data;
        } catch (error) {
            console.error('Upload Error:', error);
            throw error;
        }
    }
}

// Создаем глобальный экземпляр
const api = new ApiClient();

// Экспорт для использования в модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient, api };
}
