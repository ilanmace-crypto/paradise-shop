<?php
require_once 'config.php';
require_once 'getDB.php';

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Получаем ID товара из URL
$productId = null;
if (count($pathParts) > 1 && $pathParts[0] === 'api' && $pathParts[1] === 'products') {
    if (isset($pathParts[2]) && is_numeric($pathParts[2])) {
        $productId = (int)$pathParts[2];
    }
    // Проверяем специальный эндпоинт для обновления изображения
    if ($productId && isset($pathParts[3]) && $pathParts[3] === 'image') {
        handleImageUpdate($db, $productId);
        exit;
    }
}

try {
    switch ($method) {
        case 'GET':
            if ($productId) {
                getProduct($db, $productId);
            } else {
                getProducts($db);
            }
            break;
            
        case 'POST':
            createProduct($db);
            break;
            
        case 'PUT':
            if (!$productId) {
                jsonResponse(['error' => 'Product ID required'], 400);
            }
            updateProduct($db, $productId);
            break;
            
        case 'DELETE':
            if (!$productId) {
                jsonResponse(['error' => 'Product ID required'], 400);
            }
            deleteProduct($db, $productId);
            break;
            
        default:
            jsonResponse(['error' => 'Method not allowed'], 405);
    }
} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}

function getProducts($db) {
    $categoryId = $_GET['category_id'] ?? null;
    $active = $_GET['active'] ?? null;
    
    $sql = "SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE 1=1";
    $params = [];
    
    if ($categoryId) {
        $sql .= " AND p.category_id = ?";
        $params[] = $categoryId;
    }
    
    if ($active !== null) {
        $sql .= " AND p.active = ?";
        $params[] = $active === '1' ? 1 : 0;
    }
    
    $sql .= " ORDER BY p.created_at DESC";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $products = $stmt->fetchAll();
    
    // Конвертируем изображения в base64 если они в бинарном виде
    foreach ($products as &$product) {
        if ($product['image'] && !str_starts_with($product['image'], 'data:')) {
            $product['image'] = $product['image'];
        }
    }
    
    jsonResponse($products);
}

function getProduct($db, $id) {
    $stmt = $db->prepare("SELECT p.*, c.name as category_name 
                          FROM products p 
                          LEFT JOIN categories c ON p.category_id = c.id 
                          WHERE p.id = ?");
    $stmt->execute([$id]);
    $product = $stmt->fetch();
    
    if (!$product) {
        jsonResponse(['error' => 'Product not found'], 404);
    }
    
    jsonResponse($product);
}

function createProduct($db) {
    $data = getInputData();
    
    // Валидация
    $required = ['name', 'price'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            jsonResponse(['error' => "Field '$field' is required"], 400);
        }
    }
    
    $stmt = $db->prepare("INSERT INTO products (name, description, price, category_id, image, stock, active) 
                          VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    $result = $stmt->execute([
        $data['name'],
        $data['description'] ?? '',
        $data['price'],
        $data['category_id'] ?? null,
        $data['image'] ?? '',
        $data['stock'] ?? 0,
        $data['active'] ?? 1
    ]);
    
    if ($result) {
        $productId = $db->lastInsertId();
        jsonResponse(['id' => $productId, 'message' => 'Product created successfully'], 201);
    } else {
        jsonResponse(['error' => 'Failed to create product'], 500);
    }
}

function updateProduct($db, $id) {
    $data = getInputData();
    
    // Проверяем существование товара
    $stmt = $db->prepare("SELECT id FROM products WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonResponse(['error' => 'Product not found'], 404);
    }
    
    // Динамическое построение запроса обновления
    $fields = [];
    $params = [];
    
    $allowedFields = ['name', 'description', 'price', 'category_id', 'image', 'stock', 'active'];
    
    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $data)) {
            $fields[] = "$field = ?";
            $params[] = $data[$field];
        }
    }
    
    if (empty($fields)) {
        jsonResponse(['error' => 'No valid fields to update'], 400);
    }
    
    $fields[] = "updated_at = CURRENT_TIMESTAMP";
    $params[] = $id;
    
    $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    
    if ($stmt->execute($params)) {
        jsonResponse(['message' => 'Product updated successfully']);
    } else {
        jsonResponse(['error' => 'Failed to update product'], 500);
    }
}

function handleImageUpdate($db, $productId) {
    if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
        jsonResponse(['error' => 'Method not allowed'], 405);
    }
    
    $data = getInputData();
    
    if (!isset($data['image'])) {
        jsonResponse(['error' => 'Image data is required'], 400);
    }
    
    // Проверяем существование товара
    $stmt = $db->prepare("SELECT id FROM products WHERE id = ?");
    $stmt->execute([$productId]);
    if (!$stmt->fetch()) {
        jsonResponse(['error' => 'Product not found'], 404);
    }
    
    $stmt = $db->prepare("UPDATE products SET image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    
    if ($stmt->execute([$data['image'], $productId])) {
        jsonResponse(['message' => 'Image updated successfully']);
    } else {
        jsonResponse(['error' => 'Failed to update image'], 500);
    }
}

function deleteProduct($db, $id) {
    // Проверяем существование товара
    $stmt = $db->prepare("SELECT id FROM products WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonResponse(['error' => 'Product not found'], 404);
    }
    
    $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
    
    if ($stmt->execute([$id])) {
        jsonResponse(['message' => 'Product deleted successfully']);
    } else {
        jsonResponse(['error' => 'Failed to delete product'], 500);
    }
}
?>
