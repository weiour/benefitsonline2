# 🚀 Настройка автоматизации для продакшн-сервера

После размещения проекта на сервере нужно настроить автоматический сбор новостей.

## ⚡ Быстрая настройка

### Для Linux сервера:

```bash
cd /path/to/lgoty-backend/backend
chmod +x deployment/setup_production.sh
sudo ./deployment/setup_production.sh
```

Скрипт автоматически:
- ✅ Создаст директорию для логов
- ✅ Настроит выбранный вариант автоматизации
- ✅ Запустит сервис

---

## 📋 Ручная настройка

### Вариант 1: Cron (Самый простой)

1. Отредактируйте `deployment/cron/lgoty-news-cron` (укажите реальные пути)
2. Скопируйте в cron:
```bash
sudo cp deployment/cron/lgoty-news-cron /etc/cron.d/lgoty-news
sudo chmod 644 /etc/cron.d/lgoty-news
```

### Вариант 2: Systemd (Рекомендуется)

1. Отредактируйте `deployment/systemd/lgoty-news-fetcher.service` (укажите пути)
2. Установите:
```bash
sudo cp deployment/systemd/lgoty-news-fetcher.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable lgoty-news-fetcher.service
sudo systemctl start lgoty-news-fetcher.service
```

### Вариант 3: Supervisor

1. Отредактируйте `deployment/supervisor/lgoty-news-fetcher.conf`
2. Установите:
```bash
sudo cp deployment/supervisor/lgoty-news-fetcher.conf /etc/supervisor/conf.d/
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start lgoty-news-fetcher
```

---

## 🔍 Проверка

```bash
# Проверка cron
sudo tail -f /var/log/lgoty/news-fetcher.log

# Проверка systemd
sudo systemctl status lgoty-news-fetcher.service

# Проверка supervisor
sudo supervisorctl status lgoty-news-fetcher
```

---

## 📝 Важно!

**Обязательно замените пути в конфигурационных файлах:**
- `/path/to/lgoty-backend/backend` → реальный путь к проекту
- `/path/to/venv/bin/python` → путь к Python из venv
- `www-data` → пользователь вашего сервера

Подробная инструкция: `PRODUCTION_SETUP.md`

