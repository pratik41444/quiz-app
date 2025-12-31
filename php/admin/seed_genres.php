<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');

// One-time admin utility to clean up dummy genres and keep only a known list.
// SECURITY: requires a key. Set env var ADMIN_SEED_KEY, then call:
//   POST /php/admin/seed_genres.php?key=YOUR_KEY

$providedKey = $_GET['key'] ?? '';
$expectedKey = getenv('ADMIN_SEED_KEY') ?: '';

// Developer convenience for local XAMPP: if no env var is set, allow a fixed key
// ONLY when called from localhost.
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
    echo json_encode([
        'success' => false,
        'error' => 'Method Not Allowed. Use POST.'
    ]);
    exit;
}

$desiredGenres = [
    [
        'name' => 'Football',
        'icon' => 'fas fa-futbol',
        'description' => 'Test your knowledge of football history, players, and events'
    ]
];

$normalize = static function (string $value): string {
    $value = trim($value);
    $value = preg_replace('/\s+/', ' ', $value);
    return mb_strtolower($value, 'UTF-8');
};

try {
    $pdo->beginTransaction();

    $existingStmt = $pdo->query('SELECT id, name FROM genres');
    $existing = $existingStmt->fetchAll(PDO::FETCH_ASSOC);

    $desiredByKey = [];
    foreach ($desiredGenres as $genre) {
        $key = $normalize($genre['name']);
        $desiredByKey[$key] = $genre;
    }

    $existingByKey = [];
    foreach ($existing as $genre) {
        $key = $normalize((string)$genre['name']);
        $existingByKey[$key] = $genre;
    }

    // Delete all genres not in desired list (and their questions)
    $deletedGenreIds = [];
    foreach ($existing as $genre) {
        $key = $normalize((string)$genre['name']);
        if (!array_key_exists($key, $desiredByKey)) {
            $deletedGenreIds[] = (int)$genre['id'];
        }
    }

    if (count($deletedGenreIds) > 0) {
        $placeholders = implode(',', array_fill(0, count($deletedGenreIds), '?'));

        $deleteQuestions = $pdo->prepare("DELETE FROM questions WHERE genre_id IN ($placeholders)");
        $deleteQuestions->execute($deletedGenreIds);

        $deleteGenres = $pdo->prepare("DELETE FROM genres WHERE id IN ($placeholders)");
        $deleteGenres->execute($deletedGenreIds);
    }

    // Upsert desired genres (insert missing; update icon/description for existing)
    $inserted = 0;
    $updated = 0;

    $insertStmt = $pdo->prepare('INSERT INTO genres (name, icon, description) VALUES (?, ?, ?)');
    $updateStmt = $pdo->prepare('UPDATE genres SET icon = ?, description = ? WHERE id = ?');

    foreach ($desiredByKey as $key => $genre) {
        if (!isset($existingByKey[$key])) {
            $insertStmt->execute([$genre['name'], $genre['icon'], $genre['description']]);
            $inserted++;
        } else {
            $id = (int)$existingByKey[$key]['id'];
            $updateStmt->execute([$genre['icon'], $genre['description'], $id]);
            $updated++;
        }
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'deleted_genre_count' => count($deletedGenreIds),
        'deleted_genre_ids' => $deletedGenreIds,
        'inserted' => $inserted,
        'updated' => $updated,
        'kept' => array_values(array_map(static fn ($g) => $g['name'], $desiredGenres))
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
