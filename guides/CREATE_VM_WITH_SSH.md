# Создание ВМ в Yandex Cloud с SSH-ключом

## Ваш публичный SSH-ключ

Скопируйте этот ключ для добавления при создании ВМ:

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDX3gyVm/tK0poYIN+7mGk+uw44D1vdwscsWHDHtgo/fa21N6SAkCsBe5I2OabZEMT9f0ldie3tTPdnL8B/fq2e/9lu4Ot0xAZnLoRi12dKeavl8MX/CrIiKqXZdXVbIvIIqS2CVgkCnPDySi5hq1xNNll2qvz669CWsjc1B0vProMgbU76n61y7cthTXPReWzEDzNRpknRMnstuHh1JvdBOMbDprFn16hj2R1RVohpF+2HCtAWBU97ppOy0PKVLPxmn3hAmCuR9PnJask0ozFfDQcsxs/n8zZzHMUfhfmsLASxVspaf9KgbgLDQG7VQ1p41gr0DGWKiBaIQnxBb0U6KIJAEmNV6n0um6jS7lc8es5fGrLcdRi6pa9NtG7cYUARFrwYIo1fBQTb8vmVoVBXqjqhOi/9eu60XWtSk3m5E9vjVhFA/nemtaS6tCeKCJ8Q1yMpk3j3zDoWb7o015ff6tn2kCMgT1vX6zYcFHRjx5PVWsxI75yZYtkqNpMvsB3xvcGe0FobvKuVG1e9Jjmyf3V+c+sYtM3we/rqoly5q2sEIS7wz++Vs0KnpqRcBjxSLxvHvfzD0SHICHJrgmdvs6tz1R6bezgNiM7T2/B3gATjxTkZ+5SbdNxWIY7jtLcswf5Jmaxt+1QpyvInbsVWPRFhwzdawAPEDZzIlV0rMw== yandex-cloud-20260127
```

## Пошаговая инструкция

### Шаг 1: Удалите старую ВМ

1. Откройте Yandex Cloud Console: https://console.cloud.yandex.ru
2. Перейдите: Compute Cloud → Виртуальные машины
3. Найдите ВМ: `compute-vm-2-4-20-ssd-1769470006848`
4. Нажмите на три точки (⋮) → **"Удалить"**
5. Подтвердите удаление

### Шаг 2: Создайте новую ВМ

1. Нажмите **"Создать ВМ"**

2. **Основные параметры**:
   - **Имя**: `olga-website-vm` (или любое другое)
   - **Зона доступности**: `ru-central1-d` (или другая)
   - **Платформа**: Intel Ice Lake
   - **vCPU**: 2
   - **RAM**: 4 ГБ
   - **Диск**: 20 ГБ SSD

3. **Образ**:
   - Выберите: **Ubuntu 24.04 LTS**

4. **Сеть**:
   - Выберите сеть или создайте новую
   - **Публичный IP**: Включите (автоматическое выделение)

5. **Доступ** (ВАЖНО!):
   - Найдите раздел **"Доступ"** или **"SSH-ключи"**
   - В поле **"SSH-ключи"** или **"Метаданные"** → **"ssh-keys"**
   - Добавьте ваш публичный ключ в формате:
     ```
     admin:ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDX3gyVm/tK0poYIN+7mGk+uw44D1vdwscsWHDHtgo/fa21N6SAkCsBe5I2OabZEMT9f0ldie3tTPdnL8B/fq2e/9lu4Ot0xAZnLoRi12dKeavl8MX/CrIiKqXZdXVbIvIIqS2CVgkCnPDySi5hq1xNNll2qvz669CWsjc1B0vProMgbU76n61y7cthTXPReWzEDzNRpknRMnstuHh1JvdBOMbDprFn16hj2R1RVohpF+2HCtAWBU97ppOy0PKVLPxmn3hAmCuR9PnJask0ozFfDQcsxs/n8zZzHMUfhfmsLASxVspaf9KgbgLDQG7VQ1p41gr0DGWKiBaIQnxBb0U6KIJAEmNV6n0um6jS7lc8es5fGrLcdRi6pa9NtG7cYUARFrwYIo1fBQTb8vmVoVBXqjqhOi/9eu60XWtSk3m5E9vjVhFA/nemtaS6tCeKCJ8Q1yMpk3j3zDoWb7o015ff6tn2kCMgT1vX6zYcFHRjx5PVWsxI75yZYtkqNpMvsB3xvcGe0FobvKuVG1e9Jjmyf3V+c+sYtM3we/rqoly5q2sEIS7wz++Vs0KnpqRcBjxSLxvHvfzD0SHICHJrgmdvs6tz1R6bezgNiM7T2/B3gATjxTkZ+5SbdNxWIY7jtLcswf5Jmaxt+1QpyvInbsVWPRFhwzdawAPEDZzIlV0rMw== yandex-cloud-20260127
     ```
   - **ВАЖНО**: Формат `admin:` в начале обязателен!

6. **Метаданные** (если есть отдельный раздел):
   - В поле `user-data` можно добавить:
     ```yaml
     #cloud-config
     users:
       - name: admin
         sudo: ALL=(ALL) NOPASSWD:ALL
         shell: /bin/bash
         ssh_authorized_keys:
           - ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDX3gyVm/tK0poYIN+7mGk+uw44D1vdwscsWHDHtgo/fa21N6SAkCsBe5I2OabZEMT9f0ldie3tTPdnL8B/fq2e/9lu4Ot0xAZnLoRi12dKeavl8MX/CrIiKqXZdXVbIvIIqS2CVgkCnPDySi5hq1xNNll2qvz669CWsjc1B0vProMgbU76n61y7cthTXPReWzEDzNRpknRMnstuHh1JvdBOMbDprFn16hj2R1RVohpF+2HCtAWBU97ppOy0PKVLPxmn3hAmCuR9PnJask0ozFfDQcsxs/n8zZzHMUfhfmsLASxVspaf9KgbgLDQG7VQ1p41gr0DGWKiBaIQnxBb0U6KIJAEmNV6n0um6jS7lc8es5fGrLcdRi6pa9NtG7cYUARFrwYIo1fBQTb8vmVoVBXqjqhOi/9eu60XWtSk3m5E9vjVhFA/nemtaS6tCeKCJ8Q1yMpk3j3zDoWb7o015ff6tn2kCMgT1vX6zYcFHRjx5PVWsxI75yZYtkqNpMvsB3xvcGe0FobvKuVG1e9Jjmyf3V+c+sYtM3we/rqoly5q2sEIS7wz++Vs0KnpqRcBjxSLxvHvfzD0SHICHJrgmdvs6tz1R6bezgNiM7T2/B3gATjxTkZ+5SbdNxWIY7jtLcswf5Jmaxt+1QpyvInbsVWPRFhwzdawAPEDZzIlV0rMw== yandex-cloud-20260127
     ```

7. **Создайте ВМ**

### Шаг 3: Подключитесь к новой ВМ

После создания ВМ:

1. Дождитесь полного запуска (1-2 минуты)
2. Запишите новый публичный IP адрес
3. Подключитесь:

```bash
ssh -i ~/.ssh/yandex_cloud admin@НОВЫЙ_IP_АДРЕС
```

Если IP изменился, удалите старую запись из known_hosts:

```bash
ssh-keygen -R СТАРЫЙ_IP
```

---

## Быстрый способ получить ключ

Если нужно снова получить ваш публичный ключ:

```bash
cat ~/.ssh/yandex_cloud.pub
```

---

## После успешного подключения

После того как подключитесь к новой ВМ, продолжайте деплой по инструкции:
- `guides/DEPLOY_YANDEX_CLOUD.md`
- Или `guides/QUICK_DEPLOY_YANDEX.md`
