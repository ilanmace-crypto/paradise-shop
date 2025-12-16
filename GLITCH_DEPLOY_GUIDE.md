# Деплой на Glitch - Пошаговая инструкция

## Шаг 1: Подготовка проекта
1. Убедись что все файлы запушены в GitHub
2. Проверь что `server-glitch.js` создан
3. Проверь что `glitch.json` создан

## Шаг 2: Создание проекта на Glitch
1. Зайди на https://glitch.com
2. Нажми "New Project" → "Import from GitHub"
3. Введи URL репозитория: `https://github.com/ilanmace-crypto/paradise-shop.git`
4. Нажми "Import Project"

## Шаг 3: Настройка проекта
1. В файле `package.json` измени основной скрипт:
   ```json
   "scripts": {
     "start": "node server-glitch.js"
   }
   ```

2. Установи зависимости:
   - Нажми "Tools" → "Terminal"
   - Введи: `npm install express pg cors body-parser dotenv`

## Шаг 4: Настройка базы данных
1. В проекте Glitch нажми ".env" (в левом меню)
2. Добавь переменные окружения:
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

3. Для тестов можно использовать бесплатную PostgreSQL:
   - Создай аккаунт на https://elephantsql.com
   - Создай базу данных
   - Скопируй connection string

## Шаг 5: Инициализация базы данных
1. В Terminal Glitch введи:
   ```bash
   node server/init-db.js
   ```

## Шаг 6: Запуск проекта
1. Нажми "Show" (вверху) → "In a new window"
2. Сайт откроется по адресу: `https://project-name.glitch.me`
3. API будет доступен на: `https://project-name.glitch.me/api`

## Шаг 7: Проверка работы
1. Проверь API: `https://project-name.glitch.me/api/health`
2. Проверь товары: `https://project-name.glitch.me/api/products`
3. Открой фронтенд: `https://project-name.glitch.me`

## Преимущества Glitch:
- **Полностью бесплатно**
- **Онлайн редактор** кода
- **Мгновенный деплой**
- **Автосохранение**
- **Git интеграция**

## Ограничения:
- **5GB** хранилища
- **4000** запросов/час
- **Проект спит** через 5 минут неактивности
- **Просыпается** при первом запросе (3-5 секунд)

## Если база данных не работает:
1. Используй mock data (уже настроено в server-glitch.js)
2. Или создай бесплатную PostgreSQL на ElephantSQL

## Готово!
Твой проект будет доступен на Glitch с бэкендом и фронтендом вместе!
