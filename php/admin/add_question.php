<?php
header('Content-Type: application/json');
require_once '../config.php'; // contains $pdo

// Read JSON input
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(["success" => false, "error" => "Invalid JSON input"]);
    exit;
}

$genreId = (int)$data['genreId'];
$difficulty = $data['difficulty'];
$text = $data['text'];
$options = $data['options'];
$answer = ((int)$data['answer']) + 1; // Convert to 1-indexed

try {
    $stmt = $pdo->prepare("
        INSERT INTO questions 
        (genre_id, difficulty, text, option1, option2, option3, option4, answer) 
        VALUES (:genre_id, :difficulty, :text, :option1, :option2, :option3, :option4, :answer)
    ");

    $stmt->execute([
        ':genre_id' => $genreId,
        ':difficulty' => $difficulty,
        ':text' => $text,
        ':option1' => $options[0],
        ':option2' => $options[1],
        ':option3' => $options[2],
        ':option4' => $options[3],
        ':answer' => $answer
    ]);

    echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
