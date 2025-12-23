<?php
require_once 'config.php';
require_once 'getDB.php';

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            getCategories($db);
            break;
            
        case 'POST':
            createCategory($db);
            break;
            
        default:
            jsonResponse(['error' => 'Method not allowed'], 405);
    }
} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}

function getCategories($db) {
    $stmt = $db->prepare("SELECT c.*, COUNT(p.id) as products_count 
                          FROM categories c 
                          LEFT JOIN products p ON c.id = p.category_id AND p.active = 1
                          GROUP BY c.id 
                          ORDER BY c.name");
    $stmt->execute();
    $categories = $stmt->fetchAll();
    
    jsonResponse($categories);
}

function createCategory($db) {
    $data = getInputData();
    
    if (empty($data['name'])) {
        jsonResponse(['error' => 'Category name is required'], 400);
    }
    
    $stmt = $db->prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
    
    if ($stmt->execute([$data['name'], $data['description'] ?? ''])) {
        $categoryId = $db->lastInsertId();
        jsonResponse(['id' => $categoryId, 'message' => 'Category created successfully'], 201);
    } else {
        jsonResponse(['error' => 'Failed to create category'], 500);
    }
}
?>
