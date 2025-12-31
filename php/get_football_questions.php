<?php
require_once __DIR__ . '/config.php';
header('Content-Type: application/json');

try {
    // Using API-SPORTS for football data (you'll need to get an API key)
    $apiKey = 'YOUR_API_KEY_HERE'; // Get from https://api-sports.io/
    $url = 'https://v3.football.api-sports.io/questions?category=general&limit=10';
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'x-rapidapi-host: v3.football.api-sports.io',
        'x-rapidapi-key: ' . $apiKey
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $data = json_decode($response, true);
    
    if (isset($data['errors'])) {
        throw new Exception('API Error: ' . json_encode($data['errors']));
    }
    
    // Format the questions for our app
    $formattedQuestions = [];
    if (isset($data['response']) && is_array($data['response'])) {
        foreach ($data['response'] as $item) {
            $formattedQuestions[] = [
                'question' => $item['question'],
                'correctAnswer' => $item['answer'],
                'options' => $item['options']
            ];
        }
    }
    
    echo json_encode($formattedQuestions);
} catch (Exception $e) {
    // Fallback to local questions if API fails
    $fallbackQuestions = [
        [
            'question' => 'Which country won the FIFA World Cup in 2018?',
            'correctAnswer' => 'France',
            'options' => ['Brazil', 'Germany', 'France', 'Argentina']
        ],
        [
            'question' => 'Which player has scored the most goals in Champions League history?',
            'correctAnswer' => 'Cristiano Ronaldo',
            'options' => ['Lionel Messi', 'Cristiano Ronaldo', 'Raul', 'Robert Lewandowski']
        ],
        // Add more fallback questions here
    ];
    echo json_encode($fallbackQuestions);
}