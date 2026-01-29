#!/bin/bash

# Скрипт для обновления проекта с Git на сервере
# Использование: ./update-from-git.sh

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Обновление проекта с Git${NC}"
echo "=================================================="

# Определяем путь к git
GIT_PATH=""

# Пробуем найти git в стандартных местах
for path in "/usr/bin/git" "/usr/local/bin/git" "$(which git 2>/dev/null)"; do
    if [ -n "$path" ] && [ -f "$path" ] && [ -x "$path" ]; then
        GIT_PATH="$path"
        break
    fi
done

# Если не нашли, пробуем установить
if [ -z "$GIT_PATH" ]; then
    echo -e "${YELLOW}⚠️  Git не найден в PATH. Ищем в системе...${NC}"
    
    # Ищем git через find
    FOUND_GIT=$(find /usr -name git -type f -executable 2>/dev/null | head -n 1)
    
    if [ -n "$FOUND_GIT" ]; then
        GIT_PATH="$FOUND_GIT"
        echo -e "${GREEN}✓${NC} Git найден: $GIT_PATH"
    else
        echo -e "${RED}❌ Git не найден. Устанавливаем...${NC}"
        sudo apt update
        sudo apt install -y git
        GIT_PATH="/usr/bin/git"
        
        if [ ! -f "$GIT_PATH" ]; then
            echo -e "${RED}❌ Не удалось установить git${NC}"
            exit 1
        fi
    fi
fi

echo -e "${GREEN}✓${NC} Используем Git: $GIT_PATH"

# Определяем директорию проекта
PROJECT_DIR="${1:-$HOME/olga-website}"

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Директория проекта не найдена: $PROJECT_DIR${NC}"
    exit 1
fi

cd "$PROJECT_DIR"
echo -e "${GREEN}✓${NC} Перешли в директорию: $PROJECT_DIR"

# Проверяем, что это git репозиторий
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Это не git репозиторий!${NC}"
    exit 1
fi

# Получаем текущую ветку
CURRENT_BRANCH=$($GIT_PATH branch --show-current)
echo -e "${GREEN}✓${NC} Текущая ветка: $CURRENT_BRANCH"

# Сохраняем изменения, если есть (stash)
if [ -n "$($GIT_PATH status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Обнаружены локальные изменения. Сохраняем в stash...${NC}"
    $GIT_PATH stash push -m "Auto-stash before update $(date +%Y-%m-%d_%H:%M:%S)"
fi

# Получаем последние изменения
echo -e "${GREEN}📥 Получаем изменения с сервера...${NC}"
$GIT_PATH fetch origin

# Показываем статус
echo -e "${GREEN}📊 Статус репозитория:${NC}"
$GIT_PATH status

# Обновляем код
echo -e "${GREEN}🔄 Обновляем код...${NC}"
$GIT_PATH pull origin "$CURRENT_BRANCH"

# Проверяем, нужно ли перезапустить приложение
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}🔄 Перезапускаем приложение...${NC}"
    pm2 restart olga-backend || echo -e "${YELLOW}⚠️  PM2 не запущен или приложение не найдено${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 не установлен, перезапустите приложение вручную${NC}"
fi

echo -e "${GREEN}✅ Обновление завершено успешно!${NC}"
