<?php
require_once __DIR__ . '/config.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['username']) || !isset($data['score']) || !isset($data['diamonds']) || !isset($data['genreId'])) {
    echo json_encode(['error' => 'Missing required data']);
    exit;
}

$username = $data['username'];
$score = (int)$data['score'];
$diamonds = (int)$data['diamonds'];
$genreId = (int)$data['genreId'];

try {
    // Find or create user
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    
    if (!$user) {
        $insertUser = $pdo->prepare('INSERT INTO users (username) VALUES (?)');
        $insertUser->execute([$username]);
        $userId = $pdo->lastInsertId();
    } else {
        $userId = $user['id'];
    }
    
    // Save quiz result
    $insert = $pdo->prepare('INSERT INTO leaderboard (user_id, genre_id, score, diamonds) VALUES (?, ?, ?, ?)');
    $insert->execute([$userId, $genreId, $score, $diamonds]);
    
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}