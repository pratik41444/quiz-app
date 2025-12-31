// Optional runtime config.
//
// GitHub Pages cannot run PHP. To make the app work for other users' phones,
// host the PHP + MySQL backend on a real server (HTTPS), then set:
//   window.QUIZ_API_BASE = 'https://your-domain.com/PRATIK/php/';
//
// If left empty, the app falls back to same-origin '/php/' (works on XAMPP).
window.QUIZ_API_BASE = window.QUIZ_API_BASE || '';
