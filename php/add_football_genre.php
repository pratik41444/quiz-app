<?php
require_once __DIR__ . '/config.php';
header('Content-Type: application/json');

try {
    // Check if Football genre already exists
    $stmt = $pdo->prepare("SELECT id FROM genres WHERE name = 'Football'");
    $stmt->execute();
    $genre = $stmt->fetch();
    
    if (!$genre) {
        // Insert Football genre
        $insert = $pdo->prepare("INSERT INTO genres (name, icon, description) VALUES (?, ?, ?)");
        $insert->execute([
            'Football',
            'fas fa-futbol',
            'Test your knowledge of football history, players, and events'
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Football genre added']);
    } else {
        echo json_encode(['success' => true, 'message' => 'Football genre already exists']);
    }
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}