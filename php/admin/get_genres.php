<?php
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT * FROM genres");
    $genres = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($genres);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}