<?php
require_once __DIR__ . '/config.php';
header('Content-Type: application/json');

$genreId = isset($_GET['genre_id']) ? (int)$_GET['genre_id'] : 0;

if (!$genreId) {
    echo json_encode(['error' => 'Invalid genre ID']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM questions WHERE genre_id = ?");
    $stmt->execute([$genreId]);
    $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($questions ?: []);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}