<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php'; // Fix the path

$username = $_GET['username'] ?? '';
if (empty($username)) {
    echo json_encode(['error' => 'Username required']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT diamonds FROM leaderboard WHERE username = ?");
    $stmt->execute([$username]);
    $data = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'diamonds' => $data ? (int)$data['diamonds'] : 0,
        'success' => true
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'error' => $e->getMessage(),
        'success' => false
    ]);
}