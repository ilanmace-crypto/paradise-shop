<?php
require_once 'config.php';
require_once 'getDB.php';

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Обработка логина
if ($method === 'POST' && count($pathParts) >= 3 && 
    $pathParts[0] === 'api' && $pathParts[1] === 'admin' && $pathParts[2] === 'login') {
    handleLogin($db);
    exit;
}

// Проверка авторизации для других эндпоинтов
if (!isAdminAuthorized()) {
    jsonResponse(['error' => 'Unauthorized'], 401);
}

try {
    // Здесь можно добавить другие админские эндпоинты
    jsonResponse(['message' => 'Admin endpoint']);
    
} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}

function handleLogin($db) {
    $data = getInputData();
    
    if (empty($data['username']) || empty($data['password'])) {
        jsonResponse(['error' => 'Username and password are required'], 400);
    }
    
    $stmt = $db->prepare("SELECT * FROM admins WHERE username = ?");
    $stmt->execute([$data['username']]);
    $admin = $stmt->fetch();
    
    if (!$admin || !password_verify($data['password'], $admin['password'])) {
        jsonResponse(['error' => 'Invalid credentials'], 401);
    }
    
    // Создаем простой токен сессии
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    // В реальном приложении здесь лучше хранить токены в БД
    jsonResponse([
        'token' => $token,
        'expires' => $expires,
        'admin' => [
            'id' => $admin['id'],
            'username' => $admin['username']
        ]
    ]);
}

function isAdminAuthorized() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (str_starts_with($authHeader, 'Bearer ')) {
        $token = substr($authHeader, 7);
        // Простая проверка токена (в реальном приложении проверять по БД)
        return strlen($token) === 64; // Простая валидация
    }
    
    return false;
}
?>
