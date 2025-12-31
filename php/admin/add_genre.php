<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$name = $data['name'] ?? '';
$icon = $data['icon'] ?? 'fas fa-question';
$description = $data['description'] ?? '';

if (!$name) {
    echo json_encode(['error' => 'Genre name is required']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO genres (name, icon, description) VALUES (:name, :icon, :description)");
    $stmt->execute([
        'name' => $name,
        'icon' => $icon,
        'description' => $description
    ]);
    
    $genre_id = $pdo->lastInsertId();
    echo json_encode([
        'success' => true,
        'genre' => [
            'id' => $genre_id,
            'name' => $name,
            'icon' => $icon,
            'description' => $description
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}