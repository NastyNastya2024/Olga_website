# Обновление проекта с Git на сервере

## Быстрый способ (рекомендуется)

Используйте готовый скрипт для обновления:

```bash
cd ~/olga-website
bash scripts/update-from-git.sh
```

Скрипт автоматически:
- Найдет git (даже если он не в PATH)
- Сохранит локальные изменения (если есть)
- Получит последние изменения с сервера
- Обновит код
- Перезапустит приложение через PM2

## Ручной способ

Если скрипт не работает, выполните команды вручную:

### 1. Найдите git

```bash
# Проверьте, где находится git
ls -la /usr/bin/git
ls -la /usr/local/bin/git

# Или используйте find
find /usr -name git 2>/dev/null
```

### 2. Используйте полный путь к git

```bash
cd ~/olga-website

# Используйте полный путь
/usr/bin/git fetch origin
/usr/bin/git pull origin main

# Или создайте алиас
alias git='/usr/bin/git'
git fetch origin
git pull origin main
```

### 3. Перезапустите приложение

```bash
pm2 restart olga-backend
```

## Постоянное решение проблемы с PATH

Добавьте git в PATH в ваш `.bashrc` или `.zshrc`:

```bash
# Откройте файл конфигурации shell
nano ~/.bashrc

# Добавьте в конец файла:
export PATH="/usr/bin:/usr/local/bin:$PATH"

# Сохраните и перезагрузите
source ~/.bashrc
```

## Альтернативный способ - через SSH с локального компьютера

Если проблемы с git на сервере продолжаются, можно обновить код локально и загрузить через SCP:

```bash
# На локальном компьютере
git pull origin main
git push origin main

# Затем на сервере используйте скрипт или команды выше
```

## Проверка обновлений

После обновления проверьте:

```bash
# Проверьте статус git
/usr/bin/git status

# Проверьте логи приложения
pm2 logs olga-backend --lines 50

# Проверьте, что приложение работает
pm2 status
```
