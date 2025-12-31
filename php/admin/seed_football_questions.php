<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');

// One-time admin utility to add Football questions.
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

$questions = [
    [
        'difficulty' => 'easy',
        'text' => 'How many players does each team have on the field in a standard football match (excluding substitutes)?',
        'options' => ['9', '10', '11', '12'],
        'answer' => 3
    ],
    [
        'difficulty' => 'easy',
        'text' => 'What is the duration of a standard football match (not including extra time)?',
        'options' => ['60 minutes', '70 minutes', '80 minutes', '90 minutes'],
        'answer' => 4
    ],
    [
        'difficulty' => 'easy',
        'text' => 'What is a match called when no goals are scored by either team?',
        'options' => ['Golden match', 'Clean sheet', 'Goalless draw', 'Deadlock win'],
        'answer' => 3
    ],
    [
        'difficulty' => 'easy',
        'text' => 'Which card does a referee show for a sending-off (red card offense)?',
        'options' => ['Green card', 'Yellow card', 'Red card', 'Blue card'],
        'answer' => 3
    ],
    [
        'difficulty' => 'easy',
        'text' => 'What is the name of the tournament played between European national teams every four years?',
        'options' => ['UEFA Champions League', 'UEFA Europa League', 'UEFA European Championship (EURO)', 'Copa Libertadores'],
        'answer' => 3
    ],
    [
        'difficulty' => 'easy',
        'text' => 'Which country has won the most FIFA World Cups (as of 2022)?',
        'options' => ['Germany', 'Italy', 'Brazil', 'Argentina'],
        'answer' => 3
    ],
    [
        'difficulty' => 'easy',
        'text' => 'What is the maximum number of substitutions allowed in a match under the common modern 5-sub rule?',
        'options' => ['3', '4', '5', '6'],
        'answer' => 3
    ],
    [
        'difficulty' => 'easy',
        'text' => 'What does VAR stand for in football?',
        'options' => ['Video Assistant Referee', 'Virtual Action Review', 'Verified Automatic Result', 'Video Approved Replay'],
        'answer' => 1
    ],
    [
        'difficulty' => 'easy',
        'text' => 'Which position typically wears gloves and can use hands inside the penalty area?',
        'options' => ['Striker', 'Goalkeeper', 'Winger', 'Sweeper'],
        'answer' => 2
    ],
    [
        'difficulty' => 'medium',
        'text' => 'Which competition is commonly referred to as the top club competition in Europe?',
        'options' => ['UEFA Champions League', 'UEFA Super Cup', 'FIFA Club World Cup', 'UEFA Nations League'],
        'answer' => 1
    ],
    [
        'difficulty' => 'medium',
        'text' => 'Which country hosted the FIFA World Cup in 2014?',
        'options' => ['South Africa', 'Brazil', 'Russia', 'Qatar'],
        'answer' => 2
    ],
    [
        'difficulty' => 'medium',
        'text' => 'What is the name of the annual award given to the world\'s best male footballer by France Football?',
        'options' => ['Golden Boot', 'Ballon d\'Or', 'Puskas Award', 'The Best Award'],
        'answer' => 2
    ],
    [
        'difficulty' => 'medium',
        'text' => 'Which country won the FIFA World Cup in 2010?',
        'options' => ['Spain', 'Netherlands', 'Germany', 'France'],
        'answer' => 1
    ],
    [
        'difficulty' => 'medium',
        'text' => 'Which country won the FIFA World Cup in 2006?',
        'options' => ['Brazil', 'Italy', 'France', 'Portugal'],
        'answer' => 2
    ],
    [
        'difficulty' => 'medium',
        'text' => 'Which city is the home of FC Barcelona?',
        'options' => ['Madrid', 'Valencia', 'Barcelona', 'Seville'],
        'answer' => 3
    ],
    [
        'difficulty' => 'medium',
        'text' => 'Which club plays its home games at Anfield?',
        'options' => ['Chelsea', 'Manchester United', 'Liverpool', 'Tottenham Hotspur'],
        'answer' => 3
    ],
    [
        'difficulty' => 'medium',
        'text' => 'Which club plays its home games at the Santiago Bernabeu?',
        'options' => ['Atletico Madrid', 'Real Madrid', 'Sevilla', 'Villarreal'],
        'answer' => 2
    ],
    [
        'difficulty' => 'medium',
        'text' => 'What is the term for scoring three goals in a single match?',
        'options' => ['Hat-trick', 'Treble', 'Clean sheet', 'Double'],
        'answer' => 1
    ],
    [
        'difficulty' => 'medium',
        'text' => 'Which country won the FIFA World Cup in 2018?',
        'options' => ['Croatia', 'France', 'Germany', 'Brazil'],
        'answer' => 2
    ]
];

try {
    // Find Football genre id (case-insensitive)
    $genreStmt = $pdo->prepare('SELECT id, name FROM genres WHERE LOWER(name) = LOWER(?) LIMIT 1');
    $genreStmt->execute(['football']);
    $genre = $genreStmt->fetch(PDO::FETCH_ASSOC);

    if (!$genre) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Football genre not found. Seed genres first.']);
        exit;
    }

    $genreId = (int)$genre['id'];

    $pdo->beginTransaction();

    $existsStmt = $pdo->prepare('SELECT id FROM questions WHERE genre_id = ? AND text = ? LIMIT 1');
    $insertStmt = $pdo->prepare(
        'INSERT INTO questions (genre_id, difficulty, text, option1, option2, option3, option4, answer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    $inserted = 0;
    $skipped = 0;

    foreach ($questions as $q) {
        $text = trim((string)$q['text']);
        $options = $q['options'] ?? [];

        if ($text === '' || !is_array($options) || count($options) !== 4) {
            continue;
        }

        $answer = (int)($q['answer'] ?? 0);
        if ($answer < 1 || $answer > 4) {
            continue;
        }

        $existsStmt->execute([$genreId, $text]);
        $existing = $existsStmt->fetch(PDO::FETCH_ASSOC);
        if ($existing) {
            $skipped++;
            continue;
        }

        $insertStmt->execute([
            $genreId,
            $q['difficulty'] ?? 'easy',
            $text,
            (string)$options[0],
            (string)$options[1],
            (string)$options[2],
            (string)$options[3],
            $answer
        ]);
        $inserted++;
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'genre_id' => $genreId,
        'inserted' => $inserted,
        'skipped_existing' => $skipped,
        'total_in_payload' => count($questions)
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
