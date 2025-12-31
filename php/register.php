<?php
header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['username']) || !isset($data['password'])) {
    echo json_encode(['error' => 'Missing username or password']);
    exit;
}

$username = trim($data['username']);
$password = password_hash($data['password'], PASSWORD_DEFAULT);

try {
    // Check if username exists
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        echo json_encode(['error' => 'Username already taken']);
        exit;
    }

    // Insert new user
    $insert = $pdo->prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    $insert->execute([$username, $password]);

    echo json_encode(['success' => true, 'message' => 'User registered']);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
