<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');

// Clears all leaderboard rows.
// Production: set env var ADMIN_SEED_KEY and call with ?key=YOUR_KEY
// Local XAMPP: if ADMIN_SEED_KEY isn't set, use ?key=dev (localhost only).

$providedKey = $_GET['key'] ?? '';
$expectedKey = getenv('ADMIN_SEED_KEY') ?: '';

if ($expectedKey === '') {
    $remote = $_SERVER['REMOTE_ADDR'] ?? '';
    $isLocal = ($remote === '127.0.0.1' || $remote === '::1');
    if ($isLocal) {
        $expectedKey = 'dev';
    }
}

if ($expectedKey === '' || !hash_equals($expectedKey, $providedKey)) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'error' => 'Forbidden. Set ADMIN_SEED_KEY on the server and provide ?key=... (or use ?key=dev from localhost)'
    ]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed. Use POST.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // If you have foreign keys referencing leaderboard, TRUNCATE may fail.
    // DELETE is safer.
    $deleted = $pdo->exec('DELETE FROM leaderboard');

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'deleted_rows' => (int)$deleted
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
