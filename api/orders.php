<?php
require_once 'config.php';
require_once 'getDB.php';

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            getOrders($db);
            break;
            
        case 'POST':
            createOrder($db);
            break;
            
        default:
            jsonResponse(['error' => 'Method not allowed'], 405);
    }
} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}

function getOrders($db) {
    $stmt = $db->prepare("SELECT o.*, oi.product_id, oi.quantity, oi.price as item_price, p.name as product_name
                          FROM orders o 
                          LEFT JOIN order_items oi ON o.id = oi.order_id 
                          LEFT JOIN products p ON oi.product_id = p.id 
                          ORDER BY o.created_at DESC");
    $stmt->execute();
    $orders = $stmt->fetchAll();
    
    // Группируем элементы заказа
    $groupedOrders = [];
    foreach ($orders as $order) {
        $orderId = $order['id'];
        if (!isset($groupedOrders[$orderId])) {
            $groupedOrders[$orderId] = [
                'id' => $order['id'],
                'customer_name' => $order['customer_name'],
                'customer_phone' => $order['customer_phone'],
                'customer_address' => $order['customer_address'],
                'total_amount' => $order['total_amount'],
                'status' => $order['status'],
                'created_at' => $order['created_at'],
                'items' => []
            ];
        }
        
        if ($order['product_id']) {
            $groupedOrders[$orderId]['items'][] = [
                'product_id' => $order['product_id'],
                'product_name' => $order['product_name'],
                'quantity' => $order['quantity'],
                'price' => $order['item_price']
            ];
        }
    }
    
    jsonResponse(array_values($groupedOrders));
}

function createOrder($db) {
    $data = getInputData();
    
    // Валидация
    $required = ['customer_name', 'customer_phone', 'total_amount', 'items'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            jsonResponse(['error' => "Field '$field' is required"], 400);
        }
    }
    
    if (!is_array($data['items']) || empty($data['items'])) {
        jsonResponse(['error' => 'Order items are required'], 400);
    }
    
    try {
        $db->beginTransaction();
        
        // Создаем заказ
        $stmt = $db->prepare("INSERT INTO orders (customer_name, customer_phone, customer_address, total_amount) 
                              VALUES (?, ?, ?, ?)");
        
        $stmt->execute([
            $data['customer_name'],
            $data['customer_phone'],
            $data['customer_address'] ?? '',
            $data['total_amount']
        ]);
        
        $orderId = $db->lastInsertId();
        
        // Добавляем элементы заказа
        $stmt = $db->prepare("INSERT INTO order_items (order_id, product_id, quantity, price) 
                              VALUES (?, ?, ?, ?)");
        
        foreach ($data['items'] as $item) {
            if (empty($item['product_id']) || empty($item['quantity']) || empty($item['price'])) {
                throw new Exception('Invalid item data');
            }
            
            $stmt->execute([
                $orderId,
                $item['product_id'],
                $item['quantity'],
                $item['price']
            ]);
        }
        
        $db->commit();
        
        jsonResponse(['id' => $orderId, 'message' => 'Order created successfully'], 201);
        
    } catch (Exception $e) {
        $db->rollback();
        jsonResponse(['error' => 'Failed to create order: ' . $e->getMessage()], 500);
    }
}
?>
