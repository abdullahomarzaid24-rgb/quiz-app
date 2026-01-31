// نسخة تعمل بدون سيرفر: الأسئلة مخزنة هنا، والنتائج تُحفظ في localStorage
(function() {
  const tests = [
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

  // املأ قائمة الاختبارات
  testSelect.innerHTML = tests.map(t => `<option value="${t.id}">${t.title} — ${t.timeMinutes} دقيقة</option>`).join('');

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
    const mm = String(Math.floor(timeLeftSeconds / 60)).padStart(2,'0');
    const ss = String(timeLeftSeconds % 60).padStart(2,'0');
    timerEl.textContent = `${mm}:${ss}`;
  }

  function renderQuestions(test) {
    testTitle.textContent = test.title;
    questionsForm.innerHTML = test.questions.map((q, idx) => {
      return `
      <div class="question">
        <h3>س${idx+1}: ${q.q}</h3>
        <div class="options">
          ${q.options.map((opt, i) => `
            <label>
              <input type="radio" name="q_${q.id}" value="${i}" />
              ${opt}
            </label>
          `).join('')}
        </div>
      </div>
      `;
    }).join('');
  }

  function saveResultLocal(entry) {
    const key = 'quiz_results';
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift(entry); // الأحدث أولاً
    localStorage.setItem(key, JSON.stringify(arr));
  }

  function submitAnswersAuto() {
    submitAnswers(true);
  }

  function submitAnswers(auto=false) {
    const name = nameInput.value.trim();
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
    const details = answers;
    const entry = {
      name, testId: currentTest.id, score, total, details, created_at: new Date().toISOString()
    };
    saveResultLocal(entry);

    resultDiv.innerHTML = `<strong>تم الإرسال!</strong><br>الاسم: ${entry.name}<br>الدرجة: ${entry.score} / ${entry.total}`;
    clearInterval(timerInterval);
    submitBtn.disabled = true;
  }

  startBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) { alert('الرجاء إدخال اسمك'); return; }
    const testId = Number(testSelect.value);
    currentTest = tests.find(t => t.id === testId);
    if (!currentTest) { alert('اختبار غير موجود'); return; }
    entryDiv.classList.add('hidden');
    examDiv.classList.remove('hidden');
    renderQuestions(currentTest);
    startTimer(currentTest.timeMinutes * 60, submitAnswersAuto);
  });

  submitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    submitAnswers(false);
  });

  exportBtn.addEventListener('click', () => {
    const raw = localStorage.getItem('quiz_results') || '[]';
    const blob = new Blob([raw], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_results.json';
    a.click();
    URL.revokeObjectURL(url);
  });
})();