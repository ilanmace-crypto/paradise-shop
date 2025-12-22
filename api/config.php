<?php
// Настройки для работы с SQLite и CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Обработка OPTIONS запросов
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Настройки базы данных
define('DB_PATH', __DIR__ . '/../database/shop.db');

// Функция для подключения к SQLite
function getDB() {
    static $db = null;
    
    if ($db === null) {
        try {
            // Создаем директорию для БД если ее нет
            $dbDir = dirname(DB_PATH);
            if (!is_dir($dbDir)) {
                mkdir($dbDir, 0755, true);
            }
            
            $db = new PDO('sqlite:' . DB_PATH);
            $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            // Включаем внешние ключи
            $db->exec('PRAGMA foreign_keys = ON');
            
            // Создаем таблицы если их нет
            createTables($db);
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit;
        }
    }
    
    return $db;
}

// Создание таблиц
function createTables($db) {
    // Таблица категорий
    $db->exec("
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Таблица товаров
    $db->exec("
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            category_id INTEGER,
            image TEXT,
            stock INTEGER DEFAULT 0,
            active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories (id)
        )
    ");
    
    // Таблица заказов
    $db->exec("
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            customer_address TEXT,
            total_amount DECIMAL(10,2) NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Таблица элементов заказа
    $db->exec("
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        )
    ");
    
    // Таблица администраторов
    $db->exec("
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Добавляем администратора по умолчанию если его нет
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM admins WHERE username = 'admin'");
    $stmt->execute();
    $result = $stmt->fetch();
    
    if ($result['count'] == 0) {
        $hashedPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $db->prepare("INSERT INTO admins (username, password) VALUES (?, ?)");
        $stmt->execute(['admin', $hashedPassword]);
    }
    
    // Добавляем базовые категории если их нет
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM categories");
    $stmt->execute();
    $result = $stmt->fetch();
    
    if ($result['count'] == 0) {
        $categories = [
            ['Электроника', 'Гаджеты и аксессуары'],
            ['Одежда', 'Одежда для всей семьи'],
            ['Дом и сад', 'Товары для дома и сада'],
            ['Спорт', 'Спортивные товары']
        ];
        
        $stmt = $db->prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
        foreach ($categories as $category) {
            $stmt->execute($category);
        }
    }
}

// Функция для отправки JSON ответа
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

// Функция для получения входных данных
function getInputData() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}
?>
