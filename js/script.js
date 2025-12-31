
// -------- CONFIG --------
// GitHub Pages cannot run PHP. If you host your PHP API elsewhere,
// set `window.QUIZ_API_BASE` (recommended) or pass `?api=https://your-host/php/`.
const API_BASE = (() => {
  const ensureTrailingSlash = (value) => (value.endsWith('/') ? value : `${value}/`);

  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('api');
  if (fromQuery) return ensureTrailingSlash(fromQuery);

  const fromGlobal = (window.QUIZ_API_BASE || '').trim();
  if (fromGlobal) return ensureTrailingSlash(fromGlobal);

  // Default: same-origin PHP folder (works on XAMPP/Apache hosting)
  const parts = window.location.pathname.split('/').filter(Boolean);
  const projectFolder = parts.length > 0 ? `/${parts[0]}` : '';
  return `${window.location.origin}${projectFolder}/php/`;
})();



// Decode HTML entities (needed for Trivia API questions)
function decodeHTML(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

// Handle quiz loading errors
function handleQuizError(error) {
  console.error("Quiz error:", error);
  if (questionText) questionText.textContent = "⚠️ " + error.message;
  if (optionsContainer) optionsContainer.innerHTML = '<button class="start-btn" onclick="showSection(\'genres-section\')">Back to Genres</button>';
}

// Safe JSON parse utility for fetch responses
function safeJSON(response) {
  return response.text().then(text => {
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error("Invalid JSON from server:", text);
      throw err;
    }
  });
}

// =============================
// DOM ELEMENTS
// =============================

// Note: script is included at end of body, so elements should exist.
// If you move script to head, wrap in DOMContentLoaded when selecting.
const modeToggle = document.getElementById('modeToggle');
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');
const genreGrid = document.getElementById('genre-container');
const quizSection = document.getElementById('quiz-section');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const currentQuestionSpan = document.getElementById('current-question');
const totalQuestionsSpan = document.getElementById('total-questions');
const prevQuestionBtn = document.getElementById('prev-question');
const nextQuestionBtn = document.getElementById('next-question');
const submitQuizBtn = document.getElementById('submit-quiz');
const resultsSection = document.getElementById('results-section');
const scorePercent = document.getElementById('score-percent');
const correctAnswersSpan = document.getElementById('correct-answers');
const totalAnswersSpan = document.getElementById('total-answers');
const diamondsEarnedSpan = document.getElementById('diamonds-earned');
const diamondsSpan = document.getElementById('diamonds');
const backToGenresBtn = document.getElementById('back-to-genres');
const retryQuizBtn = document.getElementById('retry-quiz');
const startDailyBtn = document.getElementById('start-daily');
const streakCountSpan = document.getElementById('streak-count');
const lastCompletedSpan = document.getElementById('last-completed');
const leaderboardTable = document.querySelector('#leaderboard-table tbody');
const startQuizBtn = document.getElementById('start-quiz');
const exitQuizBtn = document.getElementById('exit-quiz');
const useHintBtn = document.getElementById('useHint');
const musicToggle = document.getElementById('musicToggle');
const bgMusic = document.getElementById('bgMusic');
const musicStatus = document.getElementById('musicStatus');

// -------- API DEFAULT CATEGORIES --------
const API_CATEGORIES = {
  'general': { id: 9, name: 'General Knowledge', icon: 'fas fa-globe' },
  'science': { id: 17, name: 'Science & Nature', icon: 'fas fa-flask' },
  'history': { id: 23, name: 'History', icon: 'fas fa-landmark' },
  'geography': { id: 22, name: 'Geography', icon: 'fas fa-map' },
  'movies': { id: 11, name: 'Entertainment: Film', icon: 'fas fa-film' },
  'sports': { id: 21, name: 'Sports', icon: 'fas fa-running' },
  'music': { id: 12, name: 'Entertainment: Music', icon: 'fas fa-music' },
  // NOTE: GitHub Pages can't run PHP. Football is rendered as a local fallback
  // unless a DB-backed "Football" genre is available from the backend.
  'football': { id: 'football', name: 'Football', icon: 'fas fa-futbol' },
  // Cricket is also rendered with a local fallback question bank.
  'cricket': { id: 'cricket', name: 'Cricket', icon: 'fas fa-baseball-ball' }
};

// Local fallback question bank for Football (used on GitHub Pages / no backend).
// Format matches the app's internal question model.
const FOOTBALL_QUESTIONS = [
  {
    question: 'How many players does each team have on the field in a standard football match (excluding substitutes)?',
    options: ['9', '10', '11', '12'],
    correctAnswer: '11'
  },
  {
    question: 'What is the duration of a standard football match (not including extra time)?',
    options: ['60 minutes', '70 minutes', '80 minutes', '90 minutes'],
    correctAnswer: '90 minutes'
  },
  {
    question: 'What is a match called when no goals are scored by either team?',
    options: ['Golden match', 'Clean sheet', 'Goalless draw', 'Deadlock win'],
    correctAnswer: 'Goalless draw'
  },
  {
    question: 'Which card does a referee show for a sending-off?',
    options: ['Green card', 'Yellow card', 'Red card', 'Blue card'],
    correctAnswer: 'Red card'
  },
  {
    question: 'Which country has won the most FIFA World Cups (as of 2022)?',
    options: ['Germany', 'Italy', 'Brazil', 'Argentina'],
    correctAnswer: 'Brazil'
  },
  {
    question: 'What does VAR stand for in football?',
    options: ['Video Assistant Referee', 'Virtual Action Review', 'Verified Automatic Result', 'Video Approved Replay'],
    correctAnswer: 'Video Assistant Referee'
  },
  {
    question: 'Which position can use hands inside the penalty area?',
    options: ['Striker', 'Goalkeeper', 'Winger', 'Sweeper'],
    correctAnswer: 'Goalkeeper'
  },
  {
    question: 'What is the term for scoring three goals in a single match?',
    options: ['Hat-trick', 'Treble', 'Clean sheet', 'Double'],
    correctAnswer: 'Hat-trick'
  },
  {
    question: 'Which club plays its home games at Anfield?',
    options: ['Chelsea', 'Manchester United', 'Liverpool', 'Tottenham Hotspur'],
    correctAnswer: 'Liverpool'
  },
  {
    question: 'Which country won the FIFA World Cup in 2018?',
    options: ['Croatia', 'France', 'Germany', 'Brazil'],
    correctAnswer: 'France'
  },
  {
    question: 'Which country hosted the FIFA World Cup in 2014?',
    options: ['South Africa', 'Brazil', 'Russia', 'Qatar'],
    correctAnswer: 'Brazil'
  },
  {
    question: 'Which country won the FIFA World Cup in 2010?',
    options: ['Spain', 'Netherlands', 'Germany', 'France'],
    correctAnswer: 'Spain'
  }
];

// Local fallback question bank for Cricket (used on GitHub Pages / no backend).
const CRICKET_QUESTIONS = [
  {
    question: 'How many players are there in a cricket team on the field?',
    options: ['9', '10', '11', '12'],
    correctAnswer: '11'
  },
  {
    question: 'In ODI cricket, how many overs does each team face?',
    options: ['20', '30', '50', '60'],
    correctAnswer: '50'
  },
  {
    question: 'In T20 cricket, how many overs does each team face?',
    options: ['10', '15', '20', '25'],
    correctAnswer: '20'
  },
  {
    question: 'How many runs is a boundary worth if the ball crosses the rope after bouncing?',
    options: ['2', '4', '5', '6'],
    correctAnswer: '4'
  },
  {
    question: 'How many runs is a boundary worth if the ball crosses the rope without bouncing?',
    options: ['4', '5', '6', '7'],
    correctAnswer: '6'
  },
  {
    question: 'What is it called when a bowler takes three wickets in three consecutive balls?',
    options: ['Hat-trick', 'Triple', 'Clean spell', 'Maiden over'],
    correctAnswer: 'Hat-trick'
  },
  {
    question: 'What is the maximum number of balls in a standard over?',
    options: ['4', '5', '6', '8'],
    correctAnswer: '6'
  },
  {
    question: 'Which format is played over a maximum of five days?',
    options: ['T20', 'ODI', 'Test', 'The Hundred'],
    correctAnswer: 'Test'
  },
  {
    question: 'What is a score of 100 runs by a batsman in an innings called?',
    options: ['Century', 'Double', 'Ton', 'Both A and C'],
    correctAnswer: 'Both A and C'
  },
  {
    question: 'How many stumps are there at each end of the pitch?',
    options: ['2', '3', '4', '5'],
    correctAnswer: '3'
  },
  {
    question: 'In cricket, what is a "maiden over"?',
    options: ['An over with no runs conceded', 'An over with a wicket', 'An over with a no-ball', 'An over with a wide'],
    correctAnswer: 'An over with no runs conceded'
  },
  {
    question: 'What is the playing surface called in cricket?',
    options: ['Court', 'Pitch', 'Field', 'Track'],
    correctAnswer: 'Pitch'
  }
];

// -------- APP STATE --------
const AppState = {
  currentGenre: null,
  currentQuestions: [],
  userAnswers: [],
  currentQuestionIndex: 0,
  diamonds: 0,
  streak: 0,
  lastCompletedDate: null,
  leaderboard: [],
  questions: [],
  genres: [],
  currentPlayer: null
};

// -------- INIT FUNCTIONS --------

function loadUserData() {
  AppState.diamonds = parseInt(localStorage.getItem('diamonds')) || 0;
  AppState.streak = parseInt(localStorage.getItem('streak')) || 0;
  AppState.lastCompletedDate = localStorage.getItem('lastCompletedDate');
}

function saveUserData() {
  localStorage.setItem('diamonds', AppState.diamonds.toString());
  localStorage.setItem('streak', AppState.streak.toString());
  if (AppState.lastCompletedDate) {
    localStorage.setItem('lastCompletedDate', AppState.lastCompletedDate);
  }
}

// =============================
// MUSIC PLAYER
// =============================
function initMusicPlayer() {
  if (!bgMusic || !musicToggle || !musicStatus) return;

  // Load saved preference
  const musicOn = localStorage.getItem('musicEnabled') === 'true';
  bgMusic.volume = 0.3;
  musicStatus.textContent = musicOn ? 'ON' : 'OFF';

  if (musicOn) {
    // Try to play (browsers may block until user interacts)
    bgMusic.play().catch(e => {
      console.log("Autoplay blocked:", e);
      // We'll still reflect the desired state in the UI
      musicStatus.textContent = 'OFF';
    });
  } else {
    bgMusic.pause();
  }

  musicToggle.addEventListener('click', toggleMusic);

  // Play on first user click if user wanted music but autoplay blocked
  function handleFirstInteraction() {
    if (localStorage.getItem('musicEnabled') === 'true' && bgMusic.paused) {
      bgMusic.play().catch(e => console.log("Autoplay blocked on first interaction:", e));
    }
    document.removeEventListener('click', handleFirstInteraction);
  }
  document.addEventListener('click', handleFirstInteraction, { once: true });

  function toggleMusic() {
    if (bgMusic.paused) {
      bgMusic.play()
        .then(() => {
          musicStatus.textContent = 'ON';
          localStorage.setItem('musicEnabled', 'true');
        })
        .catch(e => {
          console.log("Music play failed:", e);
          musicStatus.textContent = 'OFF';
          localStorage.setItem('musicEnabled', 'false');
        });
    } else {
      bgMusic.pause();
      musicStatus.textContent = 'OFF';
      localStorage.setItem('musicEnabled', 'false');
    }
  }
}

// =============================
// GENRES and QUESTIONS
// =============================
async function renderGenres() {
  if (!genreGrid) return;
  genreGrid.innerHTML = '';

  const normalize = (s) => String(s ?? '').trim().toLowerCase();

  // Fetch custom genres from server (MySQL). GitHub Pages can't run PHP, so this
  // typically fails there.
  let customGenres = [];
  try {
    const response = await fetch(`${API_BASE}admin/get_genres.php?nocache=${Date.now()}`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        customGenres = data;
        AppState.genres = customGenres;
        localStorage.setItem('quizGenres', JSON.stringify(customGenres));
      }
    } else {
      console.warn('Could not fetch custom genres (network):', response.status);
    }
  } catch (error) {
    console.error('Error loading custom genres:', error);
  }

  const customFootball = customGenres.find(g => normalize(g.name) === 'football');
  const customCricket = customGenres.find(g => normalize(g.name) === 'cricket');

  // Render fixed API categories EXCEPT football/cricket (special-cased below)
  for (const [genreId, category] of Object.entries(API_CATEGORIES)) {
    if (genreId === 'football' || genreId === 'cricket') continue;
    const genreCard = createGenreCard(category.icon, category.name, () => startQuiz(genreId));
    genreGrid.appendChild(genreCard);
  }

  // Render Football: use DB-backed Football if present, else local fallback
  if (customFootball) {
    const genreCard = createGenreCard(
      customFootball.icon || API_CATEGORIES.football.icon,
      customFootball.name || API_CATEGORIES.football.name,
      () => startCustomQuiz(customFootball.id)
    );
    genreGrid.appendChild(genreCard);
  } else {
    const football = API_CATEGORIES.football;
    const genreCard = createGenreCard(football.icon, football.name, () => startQuiz('football'));
    genreGrid.appendChild(genreCard);
  }

  // Render Cricket: use DB-backed Cricket if present, else local fallback
  if (customCricket) {
    const genreCard = createGenreCard(
      customCricket.icon || API_CATEGORIES.cricket.icon,
      customCricket.name || API_CATEGORIES.cricket.name,
      () => startCustomQuiz(customCricket.id)
    );
    genreGrid.appendChild(genreCard);
  } else {
    const cricket = API_CATEGORIES.cricket;
    const genreCard = createGenreCard(cricket.icon, cricket.name, () => startQuiz('cricket'));
    genreGrid.appendChild(genreCard);
  }

  // Render remaining custom genres (skip Football/Cricket to avoid duplicates)
  customGenres
    .filter(g => {
      const name = normalize(g.name);
      return name !== 'football' && name !== 'cricket';
    })
    .forEach(genre => {
      const genreCard = createGenreCard(
        genre.icon || 'fas fa-question',
        genre.name,
        () => startCustomQuiz(genre.id)
      );
      genreGrid.appendChild(genreCard);
    });
}

function createGenreCard(icon, name, clickHandler) {
  const genreCard = document.createElement('div');
  genreCard.className = 'genre-card';
  genreCard.innerHTML = `<i class="${icon}"></i><h3>${name}</h3>`;
  genreCard.addEventListener('click', clickHandler);
  return genreCard;
}

// =============================
// START QUIZ FLOW
// =============================
async function promptPlayerNameAndSyncDiamonds() {
  // Using SweetAlert2 to prompt for player name
  const { value: playerName } = await Swal.fire({
    title: 'Enter Your Name',
    input: 'text',
    inputPlaceholder: 'e.g. QuizMaster',
    allowOutsideClick: false,
    showCancelButton: false,
    inputValidator: (value) => value ? null : 'You need a name to play!'
  });
  if (!playerName) throw new Error("No name entered");
  AppState.currentPlayer = playerName;

  // Attempt to fetch diamonds & data from server
  try {
    const res = await fetch(`${API_BASE}admin/get_player_data.php?username=${encodeURIComponent(playerName)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.diamonds !== 'undefined') {
        AppState.diamonds = parseInt(data.diamonds) || AppState.diamonds;
        updateDiamondsDisplay();
        saveUserData();
      }
    }
  } catch (e) {
    console.warn("Could not sync diamonds from server:", e);
  }
}

async function startQuiz(genreKey) {
  try {
    await promptPlayerNameAndSyncDiamonds();
    const genre = API_CATEGORIES[genreKey];
    if (!genre) throw new Error("Invalid genre selected");
    AppState.currentGenre = { id: genre.id, name: genre.name, icon: genre.icon, isCustom: false };

    showSection('quiz-section');
    document.getElementById('quiz-genre').textContent = genre.name;
    if (questionText) questionText.textContent = "Loading questions...";
    if (optionsContainer) optionsContainer.innerHTML = '';

    let questions = [];

    // Local fallbacks (work on GitHub Pages / no backend)
    if (genreKey === 'football') {
      questions = selectRandomQuestions(FOOTBALL_QUESTIONS, 10);
    } else if (genreKey === 'cricket') {
      questions = selectRandomQuestions(CRICKET_QUESTIONS, 10);
    }

    // Try Open Trivia DB API
    if (!questions.length) {
      try {
        const apiRes = await fetch(`https://opentdb.com/api.php?amount=10&category=${genre.id}&type=multiple`);
        if (apiRes.ok) {
          const apiQuestions = await apiRes.json();
          if (apiQuestions.results && apiQuestions.results.length) {
            questions = apiQuestions.results.map(q => ({
              question: decodeHTML(q.question),
              correctAnswer: decodeHTML(q.correct_answer),
              options: shuffleArray([...q.incorrect_answers.map(decodeHTML), decodeHTML(q.correct_answer)])
            }));
          }
        }
      } catch (e) {
        console.warn("Trivia API failed:", e);
      }
    }

    // Fallback to MySQL questions
    if (!questions.length) {
      questions = await getQuestionsByGenre(genre.id);
    }

    if (!questions.length) throw new Error(`No questions for ${genre.name}`);

    AppState.currentQuestions = questions;
    AppState.userAnswers = Array(questions.length).fill(null);
    AppState.currentQuestionIndex = 0;
    renderQuestion();

  } catch (err) {
    handleQuizError(err);
  }
}

async function startCustomQuiz(genreId) {
  try {
    await promptPlayerNameAndSyncDiamonds();
    const genre = AppState.genres.find(g => g.id == genreId);
    if (!genre) throw new Error("Genre not found");

    AppState.currentGenre = { id: genre.id, name: genre.name, icon: genre.icon, isCustom: true };
    showSection('quiz-section');
    document.getElementById('quiz-genre').textContent = genre.name;
    if (questionText) questionText.textContent = "Loading questions...";
    if (optionsContainer) optionsContainer.innerHTML = '';

    const rawQuestions = await getQuestionsByGenre(genreId);

    const questions = rawQuestions.map(q => ({
      question: q.text,
      correctAnswer: [q.option1, q.option2, q.option3, q.option4][q.answer - 1],
      options: shuffleArray([q.option1, q.option2, q.option3, q.option4])
    }));

    if (!questions.length) throw new Error("No questions found");

    AppState.currentQuestions = selectRandomQuestions(questions, 10);
    AppState.userAnswers = Array(AppState.currentQuestions.length).fill(null);
    AppState.currentQuestionIndex = 0;
    renderQuestion();

  } catch (err) {
    handleQuizError(err);
  }
}

// =============================
// RENDER QUESTION & NAVIGATION
// =============================
function renderQuestion() {
  const question = AppState.currentQuestions[AppState.currentQuestionIndex];
  if (!question) return;

  // Update question text and clear options
  questionText.textContent = question.question;
  optionsContainer.innerHTML = '';

  // Hint availability
  if (useHintBtn) {
    useHintBtn.disabled = AppState.diamonds < 100 || AppState.currentQuestionIndex >= AppState.currentQuestions.length;
  }

  // Create buttons for options
  question.options.forEach((option, index) => {
    const optionBtn = document.createElement('button');
    optionBtn.className = 'option-btn';
    optionBtn.textContent = option;

    optionBtn.addEventListener('click', function () {
      // Remove selected class from all
      document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
      this.classList.add('selected');
      AppState.userAnswers[AppState.currentQuestionIndex] = option;
    });

    optionsContainer.appendChild(optionBtn);
  });

  // Update navigation
  updateQuizNavigation();
}

function updateQuizNavigation() {
  if (currentQuestionSpan) currentQuestionSpan.textContent = AppState.currentQuestionIndex + 1;
  if (totalQuestionsSpan) totalQuestionsSpan.textContent = AppState.currentQuestions.length;

  if (prevQuestionBtn) prevQuestionBtn.disabled = AppState.currentQuestionIndex === 0;
  if (nextQuestionBtn) nextQuestionBtn.disabled = AppState.currentQuestionIndex === AppState.currentQuestions.length - 1;
}

function prevQuestion() {
  if (AppState.currentQuestionIndex > 0) {
    AppState.currentQuestionIndex--;
    renderQuestion();
  }
}

function nextQuestion() {
  if (AppState.currentQuestionIndex < AppState.currentQuestions.length - 1) {
    AppState.currentQuestionIndex++;
    renderQuestion();
  } else {
    submitQuiz();
  }
}

// =============================
// SUBMIT & RESULTS
// =============================
async function submitQuiz() {
  const correctAnswers = AppState.currentQuestions.reduce((count, question, index) => {
    return count + (question.correctAnswer === AppState.userAnswers[index] ? 1 : 0);
  }, 0);

  const totalQuestions = AppState.currentQuestions.length;
  const diamondsEarned = correctAnswers * 10;

  await saveResultToServer(
    AppState.currentPlayer,
    correctAnswers,
    diamondsEarned,
    AppState.currentGenre.id
  );

  updateResultsDisplay(correctAnswers, totalQuestions, diamondsEarned);
  showSection('results-section');
}

async function saveResultToServer(username, score, diamonds, genreId) {
  try {
    const response = await fetch(`${API_BASE}save_result.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        score,
        diamonds,
        genreId
      })
    });

    const data = await response.json();
    if (!data.success) {
      console.error('Failed to save result:', data.error);
    } else {
      console.log('Result saved:', { username, score, diamonds, genreId });
      renderLeaderboard(); // refresh
    }
  } catch (error) {
    console.error('Error saving result:', error);
  }
}

function updateResultsDisplay(correct, total, diamonds) {
  scorePercent.textContent = `${Math.round((correct / total) * 100)}%`;
  correctAnswersSpan.textContent = correct;
  totalAnswersSpan.textContent = total;
  diamondsEarnedSpan.textContent = diamonds;
  AppState.diamonds += diamonds;
  updateDiamondsDisplay();

  renderResultsBreakdown();
}

function renderResultsBreakdown() {
  const container = document.getElementById('detailed-results-container');
  if (!container) return;

  const questions = Array.isArray(AppState.currentQuestions) ? AppState.currentQuestions : [];
  const answers = Array.isArray(AppState.userAnswers) ? AppState.userAnswers : [];

  const items = questions.map((q, index) => {
    const questionText = q?.question ?? '';
    const userAnswer = typeof answers[index] === 'string' ? answers[index] : null;
    const correctAnswer = q?.correctAnswer ?? '';
    const isCorrect = userAnswer !== null && userAnswer === correctAnswer;
    return {
      index,
      questionText,
      userAnswer,
      correctAnswer,
      isCorrect
    };
  });

  // Show correct answers first, wrong/unanswered at the end.
  items.sort((a, b) => {
    const byCorrect = Number(b.isCorrect) - Number(a.isCorrect);
    if (byCorrect !== 0) return byCorrect;
    return a.index - b.index;
  });

  container.innerHTML = '';

  for (const item of items) {
    const card = document.createElement('div');
    card.className = 'question-container';

    const title = document.createElement('h3');
    title.textContent = `Q${item.index + 1} - ${item.isCorrect ? 'Correct' : 'Wrong'}`;

    const qEl = document.createElement('p');
    qEl.textContent = item.questionText;

    const yourEl = document.createElement('p');
    yourEl.textContent = `Your answer: ${item.userAnswer ?? 'Not answered'}`;

    const correctEl = document.createElement('p');
    correctEl.textContent = `Correct answer: ${item.correctAnswer}`;

    card.appendChild(title);
    card.appendChild(qEl);
    card.appendChild(yourEl);
    card.appendChild(correctEl);

    container.appendChild(card);
  }
}

// Small helpers for results
function generateScoreStars(percentage) {
  const stars = Math.ceil(percentage / 20);
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

function getScoreMessage(percentage) {
  if (percentage >= 90) return 'Quiz Master!';
  if (percentage >= 70) return 'Great job!';
  if (percentage >= 50) return 'Good effort!';
  return 'Keep practicing!';
}

// =============================
// STREAK & DIAMONDS
// =============================
function updateStreak() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  if (!AppState.lastCompletedDate) {
    AppState.streak = 1;
  } else {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (AppState.lastCompletedDate === yesterdayStr) {
      AppState.streak++;
    } else if (AppState.lastCompletedDate < yesterdayStr) {
      AppState.streak = 1;
    }
  }

  AppState.lastCompletedDate = todayStr;
  updateStreakDisplay();
  saveUserData();
}

function updateStreakDisplay() {
  if (streakCountSpan) streakCountSpan.textContent = AppState.streak;
  if (lastCompletedSpan) lastCompletedSpan.textContent = AppState.lastCompletedDate || 'Never';
}

function updateDiamondsDisplay() {
  if (diamondsSpan) diamondsSpan.textContent = AppState.diamonds;
  saveUserData();
}

// =============================
// SERVER INTERACTIONS
// =============================
async function getQuestionsByGenre(genreId) {
  try {
    const response = await fetch(`${API_BASE}get_questions_by_genre.php?genre_id=${genreId}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching questions by genre:', error);
    return [];
  }
}

async function renderLeaderboard() {
  try {
    const response = await fetch(`${API_BASE}get_leaderboard.php`);
    if (!response.ok) throw new Error('Network response not ok');
    const leaderboard = await response.json();

    const tbody = document.querySelector('#leaderboard-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    leaderboard.forEach((entry, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.username}</td>
                <td>${entry.total_score || 0}</td>
                <td>${entry.total_diamonds || 0}</td>
            `;
      tbody.appendChild(row);
    });

  } catch (error) {
    console.error('Error loading leaderboard:', error);
    const tbody = document.querySelector('#leaderboard-table tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="4">Error loading leaderboard</td></tr>`;
  }
}

// =============================
// UI & NAVIGATION
// =============================
function showSection(sectionId) {
  contentSections.forEach(section => {
    section.classList.remove('active-section');
  });
  const el = document.getElementById(sectionId);
  if (el) el.classList.add('active-section');

  if (sectionId === 'genres-section') {
    renderGenres();
  } else if (sectionId === 'leaderboard-section') {
    renderLeaderboard();
  }
}

// Shuffle helper
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function selectRandomQuestions(questions, count) {
  const shuffled = shuffleArray([...questions]);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// =============================
// EVENTS SETUP
// =============================
function setupEventListeners() {
  // Navigation
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      if (link.dataset.section) {
        e.preventDefault();
        showSection(link.dataset.section);
      }
    });
  });

  // Quiz navigation
  if (prevQuestionBtn) prevQuestionBtn.addEventListener('click', prevQuestion);
  if (nextQuestionBtn) nextQuestionBtn.addEventListener('click', nextQuestion);
  if (submitQuizBtn) submitQuizBtn.addEventListener('click', submitQuiz);

  // Results navigation
  if (backToGenresBtn) backToGenresBtn.addEventListener('click', () => showSection('genres-section'));
  if (retryQuizBtn) retryQuizBtn.addEventListener('click', () => {
    if (!AppState.currentGenre) return;
    if (AppState.currentGenre.isCustom) {
      startCustomQuiz(AppState.currentGenre.id);
    } else {
      const key = Object.keys(API_CATEGORIES).find(key => API_CATEGORIES[key].id === AppState.currentGenre.id);
      startQuiz(key);
    }
  });

  // Daily challenge
  if (startDailyBtn) startDailyBtn.addEventListener('click', startDailyChallenge);

  // Start/exit quiz
  if (startQuizBtn) startQuizBtn.addEventListener('click', () => showSection('genres-section'));
  if (exitQuizBtn) exitQuizBtn.addEventListener('click', () => showSection('genres-section'));

  // Hint button (dummy - consumes diamonds or shows hint)
  if (useHintBtn) {
    useHintBtn.addEventListener('click', () => {
      if (AppState.diamonds >= 100) {
        AppState.diamonds -= 100;
        updateDiamondsDisplay();
        // Reveal a hint: remove two wrong options if possible
        const question = AppState.currentQuestions[AppState.currentQuestionIndex];
        if (!question) return;
        const correct = question.correctAnswer;
        const optionButtons = Array.from(document.querySelectorAll('.option-btn'));
        // pick two wrong ones to hide (if there are 4 options)
        let removed = 0;
        optionButtons.forEach(btn => {
          if (removed >= 2) return;
          if (btn.textContent !== correct) {
            btn.style.opacity = '0.4';
            btn.disabled = true;
            removed++;
          }
        });
      } else {
        Swal.fire('Not enough diamonds', 'You need 100 diamonds to use hint.', 'info');
      }
    });
  }
}

// Start daily challenge
function startDailyChallenge() {
  const genreKeys = Object.keys(API_CATEGORIES);
  const randomGenreKey = genreKeys[Math.floor(Math.random() * genreKeys.length)];
  startQuiz(randomGenreKey);
}

// =============================
// THEME / DARK MODE - SINGLE SOURCE OF TRUTH
// =============================

function initThemeFromStorage() {
  // Use consistent class names: dark-mode / light-mode
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    if (modeToggle) modeToggle.textContent = '☀️';
  } else {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
    if (modeToggle) modeToggle.textContent = '🌙';
  }
}

function setupThemeToggle() {
  if (!modeToggle) return;
  modeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');

    const isDark = document.body.classList.contains('dark-mode');
    modeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
  });
}

// =============================
// INITIALIZATION (Single DOMContentLoaded)
// =============================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme first
  initThemeFromStorage();
  setupThemeToggle();

  // Load user data and initialize app
  loadUserData();
  initMusicPlayer();
  setupEventListeners();

  // Initial UI state
  updateDiamondsDisplay();
  updateStreakDisplay();
  showSection('home-section');

  // Render genres and leaderboard in background
  renderGenres();
  renderLeaderboard();
});

// End of file
