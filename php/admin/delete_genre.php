<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$id = $data['id'];

try {
    // Delete related questions first
    $stmt = $pdo->prepare("DELETE FROM questions WHERE genre_id = ?");
    $stmt->execute([$id]);
    
    // Then delete genre
    $stmt = $pdo->prepare("DELETE FROM genres WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>