/**
 * Общий API клиент для всего проекта
 */

// Автоматически определяем API URL на основе текущего хоста
const getApiBaseUrl = () => {
    const { protocol, hostname, port } = window.location;
    const currentPort = port || (protocol === 'https:' ? '443' : '80');
    const baseHost = `${protocol}//${hostname}`;

    // Если мы на порту 3000 (dev-server), используем тот же порт
    if (currentPort === '3000') {
        return `${baseHost}:${currentPort}/api`;
    }

    // Для localhost (разработка) всегда используем порт 5000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }

    // Для production (порты 80/443) используем относительный путь через Nginx
    // Nginx проксирует /api на localhost:5000
    if (currentPort === '80' || currentPort === '443' || !port) {
        return '/api';
    }

    // В остальных случаях по умолчанию используем backend на 5000
    return `${baseHost}:5000/api`;
};

const API_BASE_URL = getApiBaseUrl();

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
        
        console.log('API Request:', { url, endpoint, baseUrl: this.baseUrl, hasToken: !!token });

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
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
     * Загрузка файла с отслеживанием прогресса
     */
    async uploadFile(endpoint, formData, onProgress) {
        const url = `${this.baseUrl}${endpoint}`;
        const token = this.getToken();

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Отслеживание прогресса
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        onProgress(percentComplete);
                    }
                });
            }

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        resolve(data);
                    } catch (error) {
                        reject(new Error('Ошибка парсинга ответа'));
                    }
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText);
                        reject(new Error(error.error || 'Ошибка загрузки файла'));
                    } catch {
                        reject(new Error('Ошибка загрузки файла'));
                    }
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Ошибка сети при загрузке файла'));
            });

            xhr.addEventListener('abort', () => {
                reject(new Error('Загрузка отменена'));
            });

            xhr.open('POST', url);
            
            // Добавляем токен авторизации если есть
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }

            xhr.send(formData);
        });
    }
}

// Создаем глобальный экземпляр
const api = new ApiClient();

// Делаем доступным глобально для использования в скриптах
window.api = api;

// Экспорт для использования в модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient, api };
}
