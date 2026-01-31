// script.js — نسخة نهائية ومصححة: dark mode robust + quizzes (بدون واجهة إدارة)
(function() {
  const TESTS_KEY = 'quiz_tests';
  const RESULTS_KEY = 'quiz_results';
  const THEME_KEY = 'quiz_theme';

  // ----- Theme (dark mode) -----
  (function initTheme() {
    function applyTheme(theme) {
      if (theme === 'dark') document.body.classList.add('dark');
      else document.body.classList.remove('dark');
    }

    document.addEventListener('DOMContentLoaded', () => {
      try {
        const saved = localStorage.getItem(THEME_KEY);
        applyTheme(saved === 'dark' ? 'dark' : 'light');

        let btn = document.getElementById('darkToggle');
        if (!btn) {
          // إذا أردت إنشاء زر تلقائيًا ضع التعليق التالي مفعلًا:
          // const container = document.querySelector('.top-actions') || document.body;
          // btn = document.createElement('button'); btn.id = 'darkToggle'; btn.textContent = 'وضع داكن'; container.appendChild(btn);
          console.warn('darkToggle button not found in DOM');
          return;
        }

        // استبدال العنصر لإزالة أي مستمعين سابقين ثم إضافة مستمع جديد آمن
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.setAttribute('aria-pressed', document.body.classList.contains('dark') ? 'true' : 'false');

        newBtn.addEventListener('click', () => {
          const isDark = document.body.classList.toggle('dark');
          newBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
          localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
        });
      } catch (e) {
        console.error('Theme init error:', e);
      }
    });
  })();

  // ----- Tests data (افتراضي) -----
  let tests = [
    {
      id: 1,
      title: "اختبار رياضيات بسيط",
      timeMinutes: 2,
      questions: [
        { id: 1, q: "كم يساوي 2 + 2؟", options: ["3", "4", "5"], answer: 1 },
        { id: 2, q: "كم يساوي 5 - 3؟", options: ["2", "3", "4"], answer: 0 },
        { id: 3, q: "كم يساوي 3 * 3؟", options: ["6", "9", "12"], answer: 1 }
      ]
    }
  ];

  // ----- DOM عناصر -----
  const nameInput = document.getElementById('studentName');
  const testSelect = document.getElementById('testSelect');
  const startBtn = document.getElementById('startBtn');
  const entryDiv = document.getElementById('entry');
  const examDiv = document.getElementById('exam');
  const questionsForm = document.getElementById('questionsForm');
  const testTitle = document.getElementById('testTitle');
  const timerEl = document.getElementById('timer');
  const submitBtn = document.getElementById('submitBtn');
  const resultDiv = document.getElementById('result');
  const exportBtn = document.getElementById('exportBtn');

  let currentTest = null;
  let timerInterval = null;
  let timeLeftSeconds = 0;

  // ----- Storage helpers -----
  function saveTests() { localStorage.setItem(TESTS_KEY, JSON.stringify(tests)); }
  function loadTests() {
    const raw = localStorage.getItem(TESTS_KEY);
    if (raw) {
      try { tests = JSON.parse(raw); } catch (e) { console.error('Failed to parse tests from storage', e); }
    }
  }
  loadTests();

  function renderTestOptions() {
    if (!testSelect) return;
    testSelect.innerHTML = tests.map(t => `<option value="${t.id}">${escapeHtml(t.title)} — ${t.timeMinutes} دقيقة</option>`).join('');
  }
  renderTestOptions();

  // ----- Timer -----
  function startTimer(seconds, onEnd) {
    clearInterval(timerInterval);
    timeLeftSeconds = seconds;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      timeLeftSeconds -= 1;
      updateTimerDisplay();
      if (timeLeftSeconds <= 0) {
        clearInterval(timerInterval);
        onEnd();
      }
    }, 1000);
  }
  function updateTimerDisplay() {
    if (!timerEl) return;
    const mm = String(Math.floor(timeLeftSeconds / 60)).padStart(2, '0');
    const ss = String(timeLeftSeconds % 60).padStart(2, '0');
    timerEl.textContent = `${mm}:${ss}`;
  }

  // ----- Utilities -----
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function renderQuestions(test) {
    if (!questionsForm || !test) return;
    testTitle.textContent = test.title;
    questionsForm.innerHTML = test.questions.map((q, idx) => {
      return `
      <div class="question">
        <h3>س${idx + 1}: ${escapeHtml(q.q)}</h3>
        <div class="options">
          ${q.options.map((opt, i) => `
            <label>
              <input type="radio" name="q_${q.id}" value="${i}" />
              ${escapeHtml(opt)}
            </label>
          `).join('')}
        </div>
      </div>
      `;
    }).join('');
  }

  function saveResultLocal(entry) {
    const raw = localStorage.getItem(RESULTS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift(entry);
    localStorage.setItem(RESULTS_KEY, JSON.stringify(arr));
  }

  function submitAnswers(auto = false) {
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) { alert('ادخل اسمك أولاً'); return; }
    const answers = {};
    currentTest.questions.forEach(q => {
      const sel = document.querySelector(`input[name="q_${q.id}"]:checked`);
      answers[q.id] = sel ? Number(sel.value) : null;
    });

    let score = 0;
    currentTest.questions.forEach(q => {
      const given = answers[q.id];
      if (typeof given === 'number' && given === q.answer) score += 1;
    });
    const total = currentTest.questions.length;
    const entry = { name, testId: currentTest.id, score, total, details: answers, created_at: new Date().toISOString() };
    saveResultLocal(entry);

    if (resultDiv) resultDiv.innerHTML = `<strong>تم الإرسال!</strong><br>الاسم: ${escapeHtml(entry.name)}<br>الدرجة: ${entry.score} / ${entry.total}`;
    clearInterval(timerInterval);
    if (submitBtn) submitBtn.disabled = true;
  }

  // ----- Events -----
  if (startBtn) startBtn.addEventListener('click', () => {
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) { alert('الرجاء إدخال اسمك'); return; }
    const testId = Number(testSelect.value);
    currentTest = tests.find(t => t.id === testId);
    if (!currentTest) { alert('اختبار غير موجود'); return; }
    if (entryDiv) entryDiv.classList.add('hidden');
    if (examDiv) examDiv.classList.remove('hidden');
    renderQuestions(currentTest);
    if (submitBtn) submitBtn.disabled = false;
    startTimer(currentTest.timeMinutes * 60, () => submitAnswers(true));
  });

  if (submitBtn) submitBtn.addEventListener('click', (e) => { e.preventDefault(); submitAnswers(false); });

  if (exportBtn) exportBtn.addEventListener('click', () => {
    const raw = localStorage.getItem(RESULTS_KEY) || '[]';
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_results.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  // Expose small API (optional) for future debugging
  window.__quizApp = {
    testsKey: TESTS_KEY,
    resultsKey: RESULTS_KEY,
    themeKey: THEME_KEY,
    getTests: () => tests,
    reloadTests: () => { loadTests(); renderTestOptions(); }
  };

})();