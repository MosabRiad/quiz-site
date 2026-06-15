// admin.js — واجهة الاتصال بالـ backend (PIN login + upload + generate + save)
// Requires elements in admin.html with matching IDs (loginForm, pinInput, uploadForm, pptFile, generateBtn, questionCount, questionType, difficulty, questionsPreview, quizName, saveQuizBtn, logoutBtn)

const API_BASE = window.API_BASE || ''; // ضع عنوان الـ backend إذا كان منفصلاً، مثال: 'https://your-backend.example.com'
const TOKEN_KEY = 'adminToken';

function setToken(token) {
  if (!token) return sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.setItem(TOKEN_KEY, token);
}

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

async function login(pin) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  setToken(data.token);
  return data.token;
}

async function uploadPPT(file) {
  if (!file) throw new Error('No file');
  const fd = new FormData();
  fd.append('pptFile', file);

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` },
    body: fd
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data; // { text, fileUrl }
}

async function generateQuestions({ text, questionCount = 5, questionType = 'multiple', difficulty = 'medium' }) {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ text, questionCount, questionType, difficulty })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Generation failed');
  return data; // { questions, raw }
}

async function saveQuiz(name, questions) {
  const res = await fetch(`${API_BASE}/api/quizzes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ name, questions })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Save quiz failed');
  return data.quiz;
}

async function fetchQuizzes() {
  const res = await fetch(`${API_BASE}/api/quizzes`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fetch quizzes failed');
  return data.quizzes;
}

async function fetchResults() {
  const res = await fetch(`${API_BASE}/api/results`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Fetch results failed');
  return data.results;
}

function renderQuestionsPreview(questions) {
  const container = document.getElementById('questionsPreview');
  if (!container) return;
  container.innerHTML = '';
  questions.forEach((q, i) => {
    const div = document.createElement('div');
    div.className = 'preview-question';
    const opts = q.options ? q.options.map((o, idx) => `<li>${String.fromCharCode(65+idx)}. ${o}</li>`).join('') : '';
    div.innerHTML = `<h4>سؤال ${i+1}: ${q.question}</h4><ul>${opts}</ul><p><strong>الصحيح:</strong> ${q.correct !== undefined ? String.fromCharCode(65+q.correct) : '-'}</p>`;
    container.appendChild(div);
  });
}

// UI bindings (defensive: only bind if elements exist)
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const pinInput = document.getElementById('pinInput');
  const uploadForm = document.getElementById('uploadForm');
  const fileInput = document.getElementById('pptFile');
  const generateBtn = document.getElementById('generateBtn');
  const questionCountInput = document.getElementById('questionCount');
  const questionTypeSelect = document.getElementById('questionType');
  const difficultySelect = document.getElementById('difficulty');
  const quizNameInput = document.getElementById('quizName');
  const saveQuizBtn = document.getElementById('saveQuizBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const questionsPreview = document.getElementById('questionsPreview');

  if (loginForm && pinInput) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pin = pinInput.value.trim();
      try {
        await login(pin);
        alert('تم تسجيل الدخول بنجاح');
        // Optionally update UI to show admin controls
        document.body.classList.add('admin-authenticated');
      } catch (err) {
        alert(err.message || 'فشل تسجيل الدخول');
      }
    });
  }

  if (uploadForm && fileInput) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = fileInput.files[0];
      if (!file) return alert('اختر ملف PPTX');
      try {
        const res = await uploadPPT(file);
        alert('تم رفع الملف ومعالجة النص');
        // place extracted text in a hidden textarea or preview area
        const textArea = document.getElementById('extractedText');
        if (textArea) textArea.value = res.text || '';
      } catch (err) {
        alert(err.message || 'خطأ في الرفع');
      }
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      // prefer extractedText if present
      const textArea = document.getElementById('extractedText');
      const text = textArea ? textArea.value.trim() : '';
      if (!text) return alert('لا يوجد نص للاستخلاص — ارفع ملف PPT أولاً أو أدخل النص يدوياً');

      const count = questionCountInput ? parseInt(questionCountInput.value, 10) || 5 : 5;
      const qType = questionTypeSelect ? questionTypeSelect.value : 'multiple';
      const diff = difficultySelect ? difficultySelect.value : 'medium';

      try {
        generateBtn.disabled = true;
        generateBtn.textContent = 'جاري التوليد...';
        const { questions, raw } = await generateQuestions({ text, questionCount: count, questionType: qType, difficulty: diff });
        // show preview
        renderQuestionsPreview(questions);
        // store generated questions temporarily
        sessionStorage.setItem('generatedQuestions', JSON.stringify(questions));
        alert('تم توليد الأسئلة — راجع المعاينة ثم احفظ المجموعة');
      } catch (err) {
        alert(err.message || 'فشل التوليد');
      } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'توليد الأسئلة';
      }
    });
  }

  if (saveQuizBtn) {
    saveQuizBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const name = quizNameInput ? quizNameInput.value.trim() : `Quiz ${new Date().toISOString()}`;
      const gen = sessionStorage.getItem('generatedQuestions');
      if (!gen) return alert('لا توجد أسئلة مولدة للحفظ');
      const questions = JSON.parse(gen);
      try {
        const quiz = await saveQuiz(name, questions);
        alert('تم حفظ المجموعة بنجاح');
        // optionally refresh list
      } catch (err) {
        alert(err.message || 'فشل حفظ المجموعة');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      setToken(null);
      document.body.classList.remove('admin-authenticated');
      alert('تم تسجيل الخروج');
    });
  }

  // if token exists, mark authenticated UI
  if (getToken()) {
    document.body.classList.add('admin-authenticated');
  }
});
