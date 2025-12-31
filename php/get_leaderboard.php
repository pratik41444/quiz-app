<?php
require_once __DIR__ . '/config.php';
header('Content-Type: application/json');

try {
    $stmt = $pdo->query("
        SELECT u.username, SUM(l.score) AS total_score, SUM(l.diamonds) AS total_diamonds
        FROM leaderboard l
        JOIN users u ON l.user_id = u.id
        GROUP BY u.id
        ORDER BY total_score DESC
        LIMIT 10
    ");
    $leaderboard = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($leaderboard);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}