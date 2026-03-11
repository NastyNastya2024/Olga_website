# Деплой на сервер

## Видео/фото не загружаются на сайте

Убедитесь, что в `backend/.env` на сервере указано:
```env
NODE_ENV=production
```
Без этого URL медиа (localhost:9000) не преобразуются в рабочие (/media/...).

---

## 404 на yolga.pro/videos.html или других страницах

### Причина
Nginx не находит файлы — скорее всего, путь к проекту в конфиге не совпадает с реальным расположением.

### Решение

**1. Подключитесь к серверу и проверьте путь к проекту:**
```bash
ssh ... # ваш способ подключения
pwd
# Если вы в ~/olga-website, путь будет /home/ВАШ_ПОЛЬЗОВАТЕЛЬ/olga-website
```

**2. Запустите проверку:**
```bash
cd ~/olga-website
chmod +x deploy/verify-deploy.sh
./deploy/verify-deploy.sh
```

**3. Если путь отличается — отредактируйте конфиг:**
```bash
nano deploy/nginx-olga-website.conf
```
Замените все `/home/anastkomarova/` на ваш путь (например `/home/admin/`).

**4. Примените конфиг:**
```bash
./deploy/apply-nginx.sh
```

**5. Проверьте, что файлы на месте:**
```bash
ls -la ~/olga-website/public/videos.html
ls -la ~/olga-website/public/index.html
```

---

## Полный деплой после git pull

```bash
cd ~/olga-website
git pull origin main

# Применить Nginx (включая client_max_body_size 20G)
./deploy/apply-nginx.sh

# Обновить backend
cd backend && npm install --production && pm2 restart olga-backend
```
