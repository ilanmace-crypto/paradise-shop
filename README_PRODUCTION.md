# Продакшн развертывание Paradise Shop

## Архитектура

- **Frontend**: React приложение (порт 3000)
- **Backend**: Express.js с SQLite базой данных (порт 5001)
- **Database**: SQLite файл `database/paradise-shop.db`

## Запуск в продакшн

### 1. Установка зависимостей

```bash
# Frontend зависимости
npm install

# Backend зависимости
cd server
npm install
```

### 2. Инициализация базы данных

```bash
cd server
npm run init-db
```

### 3. Запуск серверов

```bash
# Запуск backend (в одном терминале)
cd server
PORT=5001 npm start

# Запуск frontend (в другом терминале)
REACT_APP_API_URL=http://your-server-ip:5001/api npm start
```

### 4. Для продакшн с помощью PM2

Установите PM2:
```bash
npm install -g pm2
```

Создайте конфигурационный файл `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'paradise-shop-backend',
      cwd: './server',
      script: 'server.js',
      env: {
        PORT: 5001,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'paradise-shop-frontend',
      script: 'npm',
      args: 'start',
      env: {
        REACT_APP_API_URL: 'http://your-server-ip:5001/api',
        PORT: 3000
      }
    }
  ]
};
```

Запустите приложения:
```bash
pm2 start ecosystem.config.js
```

## Настройка для отдельного сервера

### 1. Перенос базы данных

Скопируйте файл `database/paradise-shop.db` на продакшн сервер:
```bash
scp database/paradise-shop.db user@server:/path/to/paradise-shop/database/
```

### 2. Настройка фаервола

Откройте порты:
```bash
sudo ufw allow 3000  # Frontend
sudo ufw allow 5001  # Backend API
```

### 3. Настройка Nginx (опционально)

Создайте конфиг `/etc/nginx/sites-available/paradise-shop`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте сайт:
```bash
sudo ln -s /etc/nginx/sites-available/paradise-shop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Резервное копирование

### Базы данных

```bash
# Создание бэкапа
cp database/paradise-shop.db backups/paradise-shop-$(date +%Y%m%d).db

# Восстановление из бэкапа
cp backups/paradise-shop-20231211.db database/paradise-shop.db
```

### Автоматический бэкап

Добавьте в cron:
```bash
# Каждый день в 3 часа ночи
0 3 * * * /path/to/paradise-shop/scripts/backup.sh
```

## Мониторинг

Проверка статуса сервисов:
```bash
pm2 status
pm2 logs paradise-shop-backend
pm2 logs paradise-shop-frontend
```

Проверка API:
```bash
curl http://localhost:5001/api/health
```

## Безопасность

1. **Поменяйте пароль админа** в базе данных:
   ```sql
   UPDATE users SET password_hash = 'new-secure-password' WHERE username = 'admin';
   ```

2. **Используйте HTTPS** в продакшн с Let's Encrypt

3. **Ограничьте доступ** к API по IP при необходимости

4. **Регулярно обновляйте** зависимости

## Масштабирование

При росте нагрузки можно перейти на PostgreSQL:
1. Установить PostgreSQL
2. Изменить подключение в `server.js`
3. Мигрировать данные с SQLite на PostgreSQL

## Траблшутинг

### Проблема: База данных не найдена
```bash
cd server && npm run init-db
```

### Проблема: Порт занят
```bash
# Найдите процесс
lsof -i :5001

# Убейте процесс
kill -9 PID
```

### Проблема: CORS ошибки
Проверьте что `REACT_APP_API_URL` правильно настроен в `.env`
