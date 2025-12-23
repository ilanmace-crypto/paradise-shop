<?php
// Вспомогательный файл для подключения к БД
function getDB() {
    static $db = null;
    
    if ($db === null) {
        try {
            $dbDir = dirname(__DIR__) . '/database';
            if (!is_dir($dbDir)) {
                mkdir($dbDir, 0755, true);
            }
            
            $db = new PDO('sqlite:' . $dbDir . '/shop.db');
            $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $db->exec('PRAGMA foreign_keys = ON');
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit;
        }
    }
    
    return $db;
}
?>
