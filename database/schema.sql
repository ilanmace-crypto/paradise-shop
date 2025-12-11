-- SQLite схема для Paradise Shop

-- Таблица товаров
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'liquids',
    price REAL NOT NULL DEFAULT 0,
    description TEXT DEFAULT '',
    image TEXT DEFAULT '',
    in_stock BOOLEAN DEFAULT 1,
    flavors TEXT DEFAULT '{}', -- JSON объект с вкусами и количеством
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица категорий
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

-- Таблица пользователей (для будущих расширений)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_info TEXT NOT NULL, -- JSON с контактными данными
    items TEXT NOT NULL, -- JSON с товарами заказа
    total_price REAL NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, processing, completed, cancelled
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Заполняем категории
INSERT OR IGNORE INTO categories (id, name, description) VALUES
('liquids', 'Жидкости', 'Жидкости для вейпинга'),
('cartridges', 'Картриджи', 'Сменные картриджи'),
('disposable', 'Одноразовые', 'Одноразовые вейпы');

-- Создаем админа по умолчанию (пароль: paradise123)
INSERT OR IGNORE INTO users (username, password_hash, is_admin) VALUES
('admin', 'paradise123', 1);
