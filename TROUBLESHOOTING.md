# Решение проблем при развертывании

## Проблема: Приложение не загружается

### Правильные адреса для доступа

Приложение доступно по следующим адресам:

1. **Через Nginx (рекомендуется):**
   - `http://guard-main.by:3000` (на сервере с настроенным DNS)
   - `http://localhost:3000` (для локального тестирования)
   - `http://<IP_сервера>:3000` (по IP адресу сервера)

2. **Напрямую к приложению (минуя nginx):**
   - `http://localhost:3000` (если порт проброшен)
   - `http://172.18.0.2:3000` (внутренний IP контейнера app)

### Диагностика

#### 1. Проверьте статус контейнеров

```bash
docker-compose ps
```

Должны быть запущены оба контейнера:
- `plagiarismguard-app` (статус: Up)
- `plagiarismguard-nginx` (статус: Up)

#### 2. Проверьте логи приложения

```bash
# Логи приложения
docker-compose logs app

# Логи nginx
docker-compose logs nginx

# Все логи
docker-compose logs -f
```

#### 3. Проверьте, что приложение запустилось

В логах приложения должно быть:
```
✓ Ready in X ms
○ Compiling / ...
```

Если видите ошибки, исправьте их.

#### 4. Проверьте доступность портов

```bash
# Проверка порта 80 (nginx)
netstat -an | findstr :80

# Проверка порта 3000 (app)
netstat -an | findstr :3000
```

#### 5. Проверьте сеть Docker

```bash
# Проверьте, что контейнеры в одной сети
docker network inspect guard-main_plagiarismguard-network
```

### Частые проблемы и решения

#### Проблема: "Connection refused" или "This site can't be reached"

**Решение:**
1. Убедитесь, что контейнеры запущены:
   ```bash
   docker-compose up -d
   ```

2. Проверьте, что порт 3000 не занят другим приложением:
   ```bash
   # Windows PowerShell
   netstat -ano | findstr :3000
   ```

3. Если порт занят, остановите другое приложение или измените порт в `docker-compose.yml`:
   ```yaml
   ports:
     - "3001:3000"  # Используйте порт 3001 вместо 3000
   ```
   И обновите `nginx.conf` соответственно.

4. **На сервере:** Убедитесь, что DNS запись для `guard-main.by` настроена правильно:
   ```bash
   # Проверка DNS
   nslookup guard-main.by
   ping guard-main.by
   ```

#### Проблема: Nginx возвращает 502 Bad Gateway

**Причина:** Приложение не запустилось или недоступно.

**Решение:**
1. Проверьте логи приложения:
   ```bash
   docker-compose logs app
   ```

2. Убедитесь, что приложение собралось:
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

3. Проверьте, что приложение слушает на порту 3000 внутри контейнера:
   ```bash
   docker-compose exec app netstat -an | grep 3000
   ```

#### Проблема: Страница загружается, но показывает ошибки

**Решение:**
1. Проверьте логи браузера (F12 -> Console)
2. Проверьте логи приложения на сервере
3. Убедитесь, что все зависимости установлены:
   ```bash
   docker-compose exec app npm list
   ```

#### Проблема: LDAP не работает

**Решение:**
1. Проверьте переменные окружения:
   ```bash
   docker-compose exec app env | grep LDAP
   ```

2. Убедитесь, что файл `.env.local` существует и правильно настроен

3. Проверьте логи на ошибки LDAP:
   ```bash
   docker-compose logs app | grep -i ldap
   ```

### Перезапуск с нуля

Если ничего не помогает, перезапустите все с нуля:

```bash
# Остановить и удалить контейнеры
docker-compose down

# Удалить образы (опционально)
docker-compose down --rmi all

# Пересобрать и запустить
docker-compose build --no-cache
docker-compose up -d

# Проверить логи
docker-compose logs -f
```

### Проверка работоспособности

После запуска проверьте:

1. **Статус контейнеров:**
   ```bash
   docker-compose ps
   ```

2. **Доступность через curl (если установлен):**
   ```bash
   curl http://localhost:3000
   curl http://guard-main.by:3000
   # Или по IP сервера
   curl http://<IP_сервера>:3000
   ```

3. **Проверка изнутри контейнера:**
   ```bash
   # Войти в контейнер приложения
   docker-compose exec app sh
   
   # Проверить, что приложение слушает
   wget -O- http://localhost:3000
   ```

### Контакты для поддержки

Если проблема не решена:
1. Соберите логи: `docker-compose logs > logs.txt`
2. Проверьте конфигурацию: `docker-compose config`
3. Создайте issue с описанием проблемы и логами
