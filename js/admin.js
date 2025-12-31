
(() => {
  // derive project folder from current path (eg /PRATIK/admin.html -> /PRATIK)
  const PROJECT_FOLDER = (() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return '';
    return `/${parts[0]}`;
  })();

  const BASE_URL = `${window.location.origin}${PROJECT_FOLDER}`;

  // Update ADMIN_API to use consistent base
const ADMIN_API = {
  genres: `${BASE_URL}/php/admin/get_genres.php`,
  questions: `${BASE_URL}/php/admin/get_questions.php`,
  addGenre: `${BASE_URL}/php/admin/add_genre.php`,
  addQuestion: `${BASE_URL}/php/admin/add_question.php`,
  deleteGenre: `${BASE_URL}/php/admin/delete_genre.php`,
  deleteQuestion: `${BASE_URL}/php/admin/delete_question.php`
};

  document.addEventListener('DOMContentLoaded', () => {
    // Query DOM **after** DOM is ready
    const tabs = document.querySelectorAll('.admin-tab');
    const tabContents = document.querySelectorAll('.admin-content');
    const questionForm = document.getElementById('question-form');
    const genreForm = document.getElementById('genre-form');
    const genreSelect = document.getElementById('question-genre');
    const questionsList = document.getElementById('questions-list');
    const genresList = document.getElementById('genres-list');

    // Quick sanity debug output (non-blocking)
    const missing = [];
    if (!questionForm) missing.push('question-form');
    if (!genreForm) missing.push('genre-form');
    if (!genreSelect) missing.push('question-genre');
    if (!questionsList) missing.push('questions-list');
    if (!genresList) missing.push('genres-list');
    if (missing.length) console.warn('admin.js: Missing elements in DOM:', missing.join(', '));

    // Tabs behavior (works even if tabs defined later)
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const targetId = `${tab.dataset.tab}-tab`;
        const target = document.getElementById(targetId);
        if (target) target.classList.add('active');
        else console.warn(`admin.js: Tab target not found: ${targetId}`);
      });
    });

    // Load data
    fetchGenres().then(() => fetchQuestions());

    // Attach form listeners (safe-guarded)
    if (questionForm) questionForm.addEventListener('submit', handleQuestionSubmit);
    if (genreForm) genreForm.addEventListener('submit', handleGenreSubmit);

    // ---------- Fetchers ----------
    function fetchGenres() {
      return fetch(ADMIN_API.genres, { cache: 'no-store' })
        .then(handleJSONResponse)
        .then(data => {
          if (!Array.isArray(data)) {
            console.warn('get_genres returned non-array:', data);
            return [];
          }
          renderGenresSelect(data);
          renderGenresList(data);
          return data;
        })
        .catch(err => {
          console.error('Error loading genres:', err);
          return [];
        });
    }

    function fetchQuestions() {
      return fetch(ADMIN_API.questions, { cache: 'no-store' })
        .then(handleJSONResponse)
        .then(data => {
          if (!Array.isArray(data)) {
            console.warn('get_questions returned non-array:', data);
            return [];
          }
          renderQuestionsList(data);
          return data;
        })
        .catch(err => {
          console.error('Error loading questions:', err);
          return [];
        });
    }

    // ---------- Renders ----------
    function renderGenresSelect(genres) {
      if (!genreSelect) return;
      genreSelect.innerHTML = '<option value="">Select a genre</option>';
      genres.forEach(g => {
        const id = g.id ?? g.genre_id ?? g.genreId ?? '';
        const name = g.name ?? g.genre_name ?? 'Untitled';
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = name;
        genreSelect.appendChild(opt);
      });
    }

   function renderGenresList(genres) {
    if (!genresList) return;
    genresList.innerHTML = '';
    
    genres.forEach(genre => {
        const el = document.createElement('div');
        el.className = 'question-item';
        el.innerHTML = `
            <div class="question-meta">
                <i class="${genre.icon || 'fas fa-question'}"></i> ID: ${genre.id}
            </div>
            <h3>${genre.name}</h3>
            <p>${genre.description || 'No description'}</p>
            <div class="question-actions">
                <button class="btn-admin secondary" data-id="${genre.id}" data-action="edit-genre">Edit</button>
                <button class="btn-admin secondary" data-id="${genre.id}" data-action="delete-genre">Delete</button>
            </div>
        `;
        genresList.appendChild(el);
    });

      // delegated click handlers for new buttons
      genresList.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const action = btn.dataset.action;
          if (action === 'edit-genre') editGenre(id);
          if (action === 'delete-genre') deleteGenre(id);
        });
      });
    }

    function renderQuestionsList(questions) {
      if (!questionsList) return;
      questionsList.innerHTML = '';
      if (!questions.length) {
        questionsList.innerHTML = '<p>No questions found.</p>';
        return;
      }

      questions.forEach(q => {
        const id = q.id ?? q.question_id ?? q.id ?? '';
        const text = escapeHtml(q.text ?? q.question ?? '');
        const options = q.options ?? q.opts ?? q.choices ?? [];
        const answerIndex = (typeof q.answer !== 'undefined') ? q.answer : (q.correct ?? 0);
        const genreName = escapeHtml(q.genreName ?? q.genre_name ?? q.genre ?? 'Unknown');

        const el = document.createElement('div');
        el.className = 'question-item';
        el.innerHTML = `
          <div class="question-meta">
            <strong>${genreName}</strong> | ${escapeHtml(q.difficulty ?? '')} | ID: ${id}
          </div>
          <p>${text}</p>
          <div class="question-options">
            ${options.map((opt, i) => `<div class="${i == answerIndex ? 'correct-option' : ''}">${i+1}. ${escapeHtml(opt)}</div>`).join('')}
          </div>
          <div class="question-actions">
            <button class="btn-admin secondary" data-id="${id}" data-action="edit-question">Edit</button>
            <button class="btn-admin secondary" data-id="${id}" data-action="delete-question">Delete</button>
          </div>
        `;
        questionsList.appendChild(el);
      });

      // delegated handlers
      questionsList.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const action = btn.dataset.action;
          if (action === 'edit-question') editQuestion(id);
          if (action === 'delete-question') deleteQuestion(id);
        });
      });
    }

    // ---------- Form handlers ----------
    async function handleQuestionSubmit(e) {
      e.preventDefault();
      const genreId = parseInt(genreSelect?.value);
      const difficulty = document.getElementById('question-difficulty')?.value ?? '';
      const text = document.getElementById('question-text')?.value.trim() ?? '';
      const options = Array.from(document.querySelectorAll('.option-input')).map(i => i.value.trim());
      const checked = document.querySelector('input[name="correct-answer"]:checked')?.value;
      const answer = checked !== undefined ? parseInt(checked) : NaN;

      if (!genreId || !text || options.some(o => !o) || isNaN(answer)) {
        alert('Please fill in all fields and select the correct answer.');
        return;
      }

      const payload = { genreId, difficulty, text, options, answer };

      try {
        const res = await fetch(ADMIN_API.addQuestion, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await handleJSONResponse(res);
        if (data.success) {
          alert('Question added successfully!');
          questionForm.reset();
          fetchQuestions();
        } else {
          console.warn('addQuestion response:', data);
          alert('Error adding question');
        }
      } catch (err) {
        console.error('Error adding question:', err);
        alert('Error adding question');
      }
    }

    async function handleGenreSubmit(e) {
      e.preventDefault();
      const name = document.getElementById('genre-name')?.value.trim() ?? '';
      const icon = document.getElementById('genre-icon')?.value.trim() ?? '';
      const description = document.getElementById('genre-description')?.value.trim() ?? '';
      if (!name) { alert('Please enter a genre name'); return; }

      const payload = { name, icon, description };

      try {
        const res = await fetch(ADMIN_API.addGenre, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await handleJSONResponse(res);
        if (data.success) {
          alert('Genre added successfully!');
          genreForm.reset();
          fetchGenres();
        } else {
          console.warn('addGenre response:', data);
          alert('Error adding genre');
        }
      } catch (err) {
        console.error('Error adding genre:', err);
        alert('Error adding genre');
      }
    }

    // ---------- Global actions (exposed for compatibility) ----------
    window.editQuestion = (id) => {
      console.log('editQuestion', id);
      alert('Edit-question UI not implemented yet. I can add it if you want.');
    };

    window.editGenre = (id) => {
      console.log('editGenre', id);
      alert('Edit-genre UI not implemented yet. I can add it if you want.');
    };

    window.deleteGenre = async (id) => {
      if (!confirm('Are you sure you want to delete this genre? All related questions will also be deleted.')) return;
      try {
        const res = await fetch(ADMIN_API.deleteGenre, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        const data = await handleJSONResponse(res);
        if (data.success) {
          alert('Genre deleted');
          fetchGenres();
          fetchQuestions();
        } else {
          console.warn('deleteGenre response:', data);
          alert('Error deleting genre');
        }
      } catch (err) {
        console.error('Error deleting genre:', err);
        alert('Error deleting genre');
      }
    };

    window.deleteQuestion = async (id) => {
      if (!confirm('Are you sure you want to delete this question?')) return;
      try {
        const res = await fetch(ADMIN_API.deleteQuestion, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        const data = await handleJSONResponse(res);
        if (data.success) {
          alert('Question deleted');
          fetchQuestions();
        } else {
          console.warn('deleteQuestion response:', data);
          alert('Error deleting question');
        }
      } catch (err) {
        console.error('Error deleting question:', err);
        alert('Error deleting question');
      }
    };

    // ---------- Helpers ----------
    function handleJSONResponse(response) {
      if (!(response instanceof Response)) return Promise.reject(new Error('Invalid response'));
      if (!response.ok) {
        return response.text().then(text => {
          console.error('HTTP error', response.status, text);
          throw new Error(`HTTP ${response.status}`);
        });
      }
      return response.text().then(text => {
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('Invalid JSON from server:\n', text);
          throw new Error('Invalid JSON from server');
        }
      });
    }

    function escapeHtml(str) {
      if (typeof str !== 'string') return str;
      return str.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
    }

  }); // DOMContentLoaded
})();
