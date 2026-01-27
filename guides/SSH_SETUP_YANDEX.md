# Настройка SSH подключения к Yandex Cloud

## Проблема: Permission denied (publickey)

Эта ошибка означает, что SSH-ключ не настроен или не используется правильно.

## Решение 1: Создание нового SSH-ключа

### Шаг 1: Создайте SSH-ключ на вашем Mac

```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com" -f ~/.ssh/yandex_cloud
```

При запросе пароля можете нажать Enter (без пароля) или ввести пароль для защиты ключа.

### Шаг 2: Скопируйте публичный ключ

```bash
cat ~/.ssh/yandex_cloud.pub
```

Скопируйте весь вывод (начинается с `ssh-rsa ...`).

### Шаг 3: Добавьте ключ в Yandex Cloud

**Вариант A: Через веб-консоль Yandex Cloud**

1. Откройте [Yandex Cloud Console](https://console.cloud.yandex.ru)
2. Перейдите в раздел **Compute Cloud** → **Виртуальные машины**
3. Выберите вашу ВМ: `compute-vm-2-4-20-ssd-1769470006848`
4. Перейдите на вкладку **SSH-ключи**
5. Нажмите **Добавить SSH-ключ**
6. Вставьте скопированный публичный ключ
7. Сохраните

**Вариант B: Через метаданные ВМ**

1. В консоли Yandex Cloud откройте вашу ВМ
2. Перейдите в раздел **Метаданные** или **SSH-ключи**
3. Добавьте ваш публичный ключ

### Шаг 4: Подключитесь к серверу

```bash
ssh -i ~/.ssh/yandex_cloud admin@158.160.192.242
```

Если хотите использовать ключ по умолчанию, добавьте его в SSH config:

```bash
cat >> ~/.ssh/config << EOF
Host yandex-cloud
    HostName 158.160.192.242
    User admin
    IdentityFile ~/.ssh/yandex_cloud
    IdentitiesOnly yes
EOF
```

Теперь можно подключаться просто:
```bash
ssh yandex-cloud
```

---

## Решение 2: Использование существующего ключа из user-data

Если у вас уже есть приватный ключ, соответствующий публичному ключу из user-data ВМ:

```bash
# Сохраните приватный ключ в файл
nano ~/.ssh/yandex_cloud

# Вставьте приватный ключ (начинается с -----BEGIN OPENSSH PRIVATE KEY-----)
# Сохраните и закройте (Ctrl+X, Y, Enter)

# Установите правильные права
chmod 600 ~/.ssh/yandex_cloud

# Подключитесь
ssh -i ~/.ssh/yandex_cloud admin@158.160.192.242
```

---

## Решение 3: Включение доступа по паролю (не рекомендуется для production)

Если нужно временно включить доступ по паролю:

### На сервере (через веб-консоль Yandex Cloud):

1. Откройте **Серийную консоль** в веб-интерфейсе Yandex Cloud
2. Войдите как root или admin
3. Выполните:

```bash
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

4. Установите пароль для пользователя admin:

```bash
sudo passwd admin
```

5. Теперь можно подключаться по паролю:

```bash
ssh admin@158.160.192.242
```

**⚠️ ВАЖНО**: Доступ по паролю менее безопасен. Рекомендуется использовать SSH-ключи.

---

## Решение 4: Использование веб-консоли Yandex Cloud

Если SSH не работает, можно использовать встроенную веб-консоль:

1. Откройте [Yandex Cloud Console](https://console.cloud.yandex.ru)
2. Перейдите в **Compute Cloud** → **Виртуальные машины**
3. Выберите вашу ВМ
4. Нажмите **Подключиться** → **Серийная консоль**
5. Войдите в систему через веб-интерфейс

---

## Проверка подключения

После настройки ключа проверьте подключение:

```bash
ssh -i ~/.ssh/yandex_cloud admin@158.160.192.242
```

Или если настроили SSH config:

```bash
ssh yandex-cloud
```

---

## Автоматическая настройка SSH config

Создайте удобный алиас для подключения:

```bash
cat >> ~/.ssh/config << 'EOF'
Host yandex-olga
    HostName 158.160.192.242
    User admin
    IdentityFile ~/.ssh/yandex_cloud
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
EOF
```

Теперь можно подключаться просто:
```bash
ssh yandex-olga
```

---

## Решение проблем

### Ошибка: "Bad permissions"

```bash
chmod 600 ~/.ssh/yandex_cloud
chmod 644 ~/.ssh/yandex_cloud.pub
```

### Ошибка: "Host key verification failed"

```bash
ssh-keygen -R 158.160.192.242
```

### Проверка подключения с подробным выводом

```bash
ssh -v -i ~/.ssh/yandex_cloud admin@158.160.192.242
```

Флаг `-v` покажет подробную информацию о процессе подключения.

---

## Рекомендации по безопасности

1. ✅ **Используйте SSH-ключи** вместо паролей
2. ✅ **Защитите приватный ключ паролем** при создании
3. ✅ **Не передавайте приватные ключи** по незащищенным каналам
4. ✅ **Используйте разные ключи** для разных серверов
5. ✅ **Регулярно обновляйте ключи**

---

## Быстрая команда для создания и настройки ключа

Выполните эту команду для автоматической настройки:

```bash
# Создание ключа
ssh-keygen -t rsa -b 4096 -f ~/.ssh/yandex_cloud -N ""

# Показ публичного ключа для копирования
echo "=========================================="
echo "Скопируйте этот публичный ключ:"
echo "=========================================="
cat ~/.ssh/yandex_cloud.pub
echo "=========================================="
echo ""
echo "Добавьте этот ключ в Yandex Cloud Console"
echo "Затем подключитесь: ssh -i ~/.ssh/yandex_cloud admin@158.160.192.242"
```
