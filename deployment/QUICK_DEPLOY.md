# 🚀 Быстрая настройка для продакшн-сервера

## Для Linux сервера (Ubuntu/Debian/CentOS)

### Автоматическая настройка:

```bash
cd /path/to/lgoty-backend/backend
chmod +x deployment/setup_production.sh
sudo ./deployment/setup_production.sh
```

Скрипт предложит выбрать вариант и автоматически настроит всё.

---

## Ручная настройка (Cron - самый простой)

### 1. Создайте cron задачу:

```bash
sudo nano /etc/cron.d/lgoty-news
```

### 2. Добавьте строку (замените пути!):

```bash
0 */6 * * * www-data cd /var/www/lgoty-backend/backend && /var/www/lgoty-backend/venv/bin/python manage.py fetch_news --limit 10 >> /var/log/lgoty/news-fetcher.log 2>&1
```

### 3. Сохраните и установите права:

```bash
sudo chmod 644 /etc/cron.d/lgoty-news
```

### 4. Создайте директорию для логов:

```bash
sudo mkdir -p /var/log/lgoty
sudo chown www-data:www-data /var/log/lgoty
```

**Готово!** Новости будут собираться каждые 6 часов автоматически.

---

## Проверка работы:

```bash
# Проверка логов
sudo tail -f /var/log/lgoty/news-fetcher.log

# Ручной запуск для проверки
cd /var/www/lgoty-backend/backend
python manage.py fetch_news --limit 5
```

---

## Важно заменить пути:

- `/var/www/lgoty-backend/backend` → ваш путь к проекту
- `/var/www/lgoty-backend/venv/bin/python` → ваш путь к Python
- `www-data` → пользователь вашего сервера (может быть `nginx`, `apache` и т.д.)

---

## Альтернатива: Systemd Timer

Если хотите использовать systemd:

```bash
# 1. Отредактируйте файлы (укажите пути)
sudo nano deployment/systemd/lgoty-news-fetcher.service
sudo nano deployment/systemd/lgoty-news-fetcher.timer

# 2. Скопируйте
sudo cp deployment/systemd/lgoty-news-fetcher.* /etc/systemd/system/

# 3. Запустите
sudo systemctl daemon-reload
sudo systemctl enable lgoty-news-fetcher.timer
sudo systemctl start lgoty-news-fetcher.timer

# 4. Проверка
sudo systemctl status lgoty-news-fetcher.timer
```

---

Подробная инструкция: `PRODUCTION_SETUP.md`

