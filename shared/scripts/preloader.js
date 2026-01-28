/**
 * Скрипт прелоадера для предзагрузки видео
 * Показывает индикатор загрузки пока все видео не загрузятся
 */

class VideoPreloader {
    constructor() {
        this.videosToPreload = [];
        this.loadedCount = 0;
        this.failedCount = 0;
        this.preloaderElement = null;
        this.progressBar = null;
        this.progressText = null;
        this.isMobile = this.detectMobile();
        this.isSlowConnection = this.detectSlowConnection();
        this.init();
    }

    /**
     * Определение мобильного устройства
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 768);
    }

    /**
     * Определение медленного соединения
     */
    detectSlowConnection() {
        // Network Information API (поддерживается не везде)
        if ('connection' in navigator) {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (connection) {
                // slow-2g, 2g, 3g считаем медленными
                const slowTypes = ['slow-2g', '2g', '3g'];
                if (slowTypes.includes(connection.effectiveType)) {
                    return true;
                }
                // Если saveData включен, считаем медленным
                if (connection.saveData) {
                    return true;
                }
            }
        }
        return false;
    }

    createPreloader() {
        // Проверяем, не создан ли уже прелоадер
        if (document.getElementById('videoPreloader')) {
            return;
        }

        const preloader = document.createElement('div');
        preloader.id = 'videoPreloader';
        preloader.className = 'video-preloader';
        preloader.innerHTML = `
            <div class="preloader-content">
                <div class="preloader-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <div class="preloader-text">
                    <p class="preloader-title">Загрузка видео...</p>
                    <p class="preloader-progress" id="preloaderProgress">0%</p>
                </div>
            </div>
        `;

        document.body.appendChild(preloader);
        this.preloaderElement = preloader;
        this.progressText = document.getElementById('preloaderProgress');
    }

    /**
     * Добавить видео для предзагрузки
     * @param {string} url - URL видео
     * @param {string} type - Тип видео: 'file', 'youtube', 'vimeo'
     * @param {boolean} priority - Приоритетное видео (например, hero видео)
     */
    addVideo(url, type = 'file', priority = false) {
        if (!url) return;
        
        // На мобильных с медленным интернетом предзагружаем только приоритетные видео
        if (this.isMobile && this.isSlowConnection && !priority) {
            console.log('⏭️ Пропускаем предзагрузку видео на мобильном с медленным интернетом:', url);
            return;
        }
        
        // На мобильных предзагружаем только приоритетные видео и YouTube/Vimeo (они легкие)
        if (this.isMobile && !priority && type === 'file') {
            console.log('⏭️ Пропускаем предзагрузку файлового видео на мобильном:', url);
            return;
        }
        
        this.videosToPreload.push({ url, type, priority });
    }

    /**
     * Предзагрузка одного видео
     */
    async preloadVideo(video) {
        return new Promise((resolve) => {
            const { url, type } = video;

            if (type === 'youtube' || type === 'vimeo') {
                // Для YouTube и Vimeo просто помечаем как загруженное
                // (они загружаются через iframe при показе)
                resolve({ success: true, url });
                return;
            }

            // Для файловых видео создаем временный элемент для предзагрузки
            const videoElement = document.createElement('video');
            // На мобильных используем metadata вместо auto для экономии трафика
            videoElement.preload = (this.isMobile && !video.priority) ? 'metadata' : 'auto';
            videoElement.style.display = 'none';

            let resolved = false;

            const handleCanPlay = () => {
                if (!resolved) {
                    resolved = true;
                    videoElement.removeEventListener('canplay', handleCanPlay);
                    videoElement.removeEventListener('error', handleError);
                    document.body.removeChild(videoElement);
                    resolve({ success: true, url });
                }
            };

            const handleError = () => {
                if (!resolved) {
                    resolved = true;
                    videoElement.removeEventListener('canplay', handleCanPlay);
                    videoElement.removeEventListener('error', handleError);
                    document.body.removeChild(videoElement);
                    resolve({ success: false, url });
                }
            };

            videoElement.addEventListener('canplay', handleCanPlay);
            videoElement.addEventListener('error', handleError);

            // Устанавливаем таймаут на случай зависания
            // На мобильных с медленным интернетом уменьшаем таймаут
            const timeout = (this.isMobile && this.isSlowConnection) ? 15000 : 30000;
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    videoElement.removeEventListener('canplay', handleCanPlay);
                    videoElement.removeEventListener('error', handleError);
                    if (document.body.contains(videoElement)) {
                        document.body.removeChild(videoElement);
                    }
                    resolve({ success: false, url, timeout: true });
                }
            }, timeout);

            videoElement.src = url;
            document.body.appendChild(videoElement);
        });
    }

    /**
     * Обновить прогресс загрузки
     */
    updateProgress() {
        const total = this.videosToPreload.length;
        const loaded = this.loadedCount + this.failedCount;
        const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;

        if (this.progressText) {
            this.progressText.textContent = `${percent}%`;
        }

        return percent;
    }

    /**
     * Начать предзагрузку всех видео
     */
    async startPreloading() {
        if (this.videosToPreload.length === 0) {
            this.hide();
            return;
        }

        this.loadedCount = 0;
        this.failedCount = 0;

        // На мобильных с медленным интернетом не показываем прелоадер долго
        // Сортируем видео: приоритетные первыми
        this.videosToPreload.sort((a, b) => {
            if (a.priority && !b.priority) return -1;
            if (!a.priority && b.priority) return 1;
            return 0;
        });

        // На мобильных ограничиваем количество предзагружаемых видео
        if (this.isMobile) {
            const maxVideos = this.isSlowConnection ? 1 : 3; // На медленном только 1, на быстром 3
            this.videosToPreload = this.videosToPreload.slice(0, maxVideos);
            console.log(`📱 Мобильное устройство: предзагружаем только ${this.videosToPreload.length} видео`);
        }

        // Добавляем класс для скрытия контента
        document.body.classList.add('preloading');

        // Показываем прелоадер
        if (this.preloaderElement) {
            this.preloaderElement.classList.add('active');
        }

        // На мобильных с медленным интернетом не ждем полной загрузки
        if (this.isMobile && this.isSlowConnection) {
            // Загружаем только первое приоритетное видео
            const priorityVideo = this.videosToPreload.find(v => v.priority);
            if (priorityVideo) {
                try {
                    await this.preloadVideo(priorityVideo);
                    this.loadedCount++;
                } catch (error) {
                    console.warn('Ошибка предзагрузки приоритетного видео:', error);
                }
            }
            // Сразу скрываем прелоадер
            setTimeout(() => {
                this.hide();
            }, 1000);
            return;
        }

        // Предзагружаем видео по очереди (чтобы не перегружать сеть)
        for (let i = 0; i < this.videosToPreload.length; i++) {
            const video = this.videosToPreload[i];
            
            try {
                const result = await this.preloadVideo(video);
                
                if (result.success) {
                    this.loadedCount++;
                } else {
                    this.failedCount++;
                }
            } catch (error) {
                console.warn('Ошибка предзагрузки видео:', video.url, error);
                this.failedCount++;
            }

            // Обновляем прогресс
            this.updateProgress();
        }

        // Скрываем прелоадер после загрузки всех видео
        setTimeout(() => {
            this.hide();
        }, 500); // Небольшая задержка для плавности
    }

    /**
     * Скрыть прелоадер
     */
    hide() {
        // Убираем класс для показа контента
        document.body.classList.remove('preloading');
        
        if (this.preloaderElement) {
            this.preloaderElement.classList.remove('active');
            setTimeout(() => {
                if (this.preloaderElement && this.preloaderElement.parentNode) {
                    this.preloaderElement.parentNode.removeChild(this.preloaderElement);
                }
            }, 500); // Ждем завершения анимации
        }
    }

    /**
     * Показать прелоадер (если нужно показать снова)
     */
    show() {
        if (this.preloaderElement) {
            this.preloaderElement.classList.add('active');
        } else {
            this.createPreloader();
            this.preloaderElement.classList.add('active');
        }
    }
}

// Создаем глобальный экземпляр
window.videoPreloader = new VideoPreloader();
