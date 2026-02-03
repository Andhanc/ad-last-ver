# Настройка DNS для guard-main.by

Для работы приложения по адресу `http://guard-main.by:3000` необходимо настроить DNS запись.

## Настройка DNS записи

### Вариант 1: A-запись (рекомендуется)

Создайте A-запись в DNS вашего домена:

```
Тип: A
Имя: guard-main (или @ для корневого домена)
Значение: <IP_адрес_вашего_сервера>
TTL: 3600 (или по умолчанию)
```

**Пример:**
- Если ваш домен `bsuir.by`, создайте поддомен `guard-main.bsuir.by`
- Если у вас отдельный домен `guard-main.by`, создайте A-запись для корневого домена

### Вариант 2: CNAME-запись

Если у вас уже есть A-запись для основного домена:

```
Тип: CNAME
Имя: guard-main
Значение: <основной_домен> (например, bsuir.by)
TTL: 3600
```

## Проверка настройки DNS

После настройки DNS подождите несколько минут (время распространения DNS) и проверьте:

```bash
# Проверка DNS записи
nslookup guard-main.by

# Или
dig guard-main.by

# Проверка доступности
ping guard-main.by
```

## Настройка на сервере

### 1. Убедитесь, что порт 3000 открыт в firewall

```bash
# Для Ubuntu/Debian с ufw
sudo ufw allow 3000/tcp

# Для CentOS/RHEL с firewalld
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# Проверка открытых портов
sudo netstat -tulpn | grep 3000
```

### 2. Проверьте, что nginx слушает на правильном порту

```bash
# Внутри контейнера nginx
docker-compose exec nginx cat /etc/nginx/conf.d/default.conf

# Проверка портов контейнера
docker-compose ps
```

### 3. Проверьте доступность извне

```bash
# С другого компьютера или через онлайн-сервис
curl http://guard-main.by:3000
```

## Альтернатива: Использование IP адреса

Если DNS еще не настроен, можно временно использовать IP адрес:

```
http://<IP_адрес_сервера>:3000
```

Найдите IP адрес сервера:

```bash
# На сервере
hostname -I
# Или
ip addr show
```

## Настройка для локальной разработки

Для локальной разработки добавьте в файл `/etc/hosts` (Linux/Mac) или `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 guard-main.by
```

Теперь `http://guard-main.by:3000` будет работать локально.

## Troubleshooting

### DNS не резолвится

1. Проверьте, что DNS запись создана правильно
2. Подождите время распространения DNS (может занять до 24 часов, обычно 5-15 минут)
3. Используйте другой DNS сервер для проверки:
   ```bash
   nslookup guard-main.by 8.8.8.8  # Google DNS
   ```

### Порт недоступен извне

1. Проверьте firewall на сервере
2. Проверьте настройки firewall у провайдера/облачного сервиса
3. Убедитесь, что порт 3000 открыт в security groups (для облачных сервисов)

### Nginx не проксирует запросы

1. Проверьте логи nginx:
   ```bash
   docker-compose logs nginx
   ```

2. Проверьте, что приложение запущено:
   ```bash
   docker-compose ps
   docker-compose logs app
   ```

3. Проверьте конфигурацию nginx:
   ```bash
   docker-compose exec nginx nginx -t
   ```
