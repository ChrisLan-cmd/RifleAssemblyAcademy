// static/js/quiz_mc.js

document.addEventListener('DOMContentLoaded', () => {
  // === versioning check ===
  const storedVer = localStorage.getItem('quizMCVersion');
  if (storedVer !== window.QUIZ_VERSION) {
    localStorage.removeItem('quizMCState');
    localStorage.setItem('quizMCVersion', window.QUIZ_VERSION);
  }

  // Question data
  const questions = [
    {
      image: 'Barrel_Group.png',
      prompt: 'Which group directs high-pressure gases to cycle the action?',
      options: ['Barrel Group', 'Bolt Group', 'Lower Receiver Group', 'Magazine', 'Upper Receiver Group'],
      correct: 'Barrel Group'
    },
    {
      image: 'Bolt_Group.png',
      prompt: 'Which group is responsible for chambering, firing, and extracting rounds?',
      options: ['Barrel Group', 'Bolt Group', 'Lower Receiver Group', 'Magazine', 'Upper Receiver Group'],
      correct: 'Bolt Group'
    },
    {
      image: 'Lower_Receiver_Group.png',
      prompt: 'Which group houses the trigger mechanism and magazine well?',
      options: ['Barrel Group', 'Bolt Group', 'Lower Receiver Group', 'Magazine', 'Upper Receiver Group'],
      correct: 'Lower Receiver Group'
    },
    {
      image: 'Magazine.png',
      prompt: 'Which component holds and feeds the cartridges?',
      options: ['Barrel Group', 'Bolt Group', 'Lower Receiver Group', 'Magazine', 'Upper Receiver Group'],
      correct: 'Magazine'
    },
    {
      image: 'Upper_Receiver_Group.png',
      prompt: 'Which group contains the charging handle and optics rail?',
      options: ['Barrel Group', 'Bolt Group', 'Lower Receiver Group', 'Magazine', 'Upper Receiver Group'],
      correct: 'Upper Receiver Group'
    }
  ];

  // Elements
  const scoreEl     = document.getElementById('score');
  const imgEl       = document.querySelector('.question-image img');
  const promptEl    = document.querySelector('.mcq-prompt');
  const buttons     = Array.from(document.querySelectorAll('.answers .btn'));
  const prevBtn     = document.getElementById('prev-question');
  const restartBtn  = document.getElementById('restart-quiz');
  const nextBtn     = document.getElementById('next-question');

  // Create question progress bar
  const progressContainer = document.createElement('div');
  progressContainer.className = 'question-progress';
  const meter = document.querySelector('.meter');
  meter.parentNode.insertBefore(progressContainer, meter);

  // Create question indicators
  questions.forEach((_, index) => {
    const indicator = document.createElement('button');
    indicator.className = 'question-indicator';
    indicator.textContent = index + 1;
    indicator.addEventListener('click', () => {
      if (answered[index] !== null) {
        current = index;
        loadQuestion(current);
      }
    });
    progressContainer.appendChild(indicator);
  });

  // --- State & Persistence ---
  let score, current, answered, optionOrders;

  // Progress bar updater
  function updateProgress() {
    const done = answered.filter(a => a !== null).length;
    const pct  = (done / questions.length) * 100;
    document.getElementById('progress-meter').style.width = pct + '%';
    
    // Update question indicators
    document.querySelectorAll('.question-indicator').forEach((indicator, index) => {
      indicator.classList.remove('answered', 'current', 'correct', 'incorrect');
      if (answered[index] !== null) {
        indicator.classList.add('answered');
        if (answered[index].correct) {
          indicator.classList.add('correct');
        } else {
          indicator.classList.add('incorrect');
        }
      }
      if (index === current) {
        indicator.classList.add('current');
      }
    });
  }

  // Load saved or init fresh
  try {
    const saved = JSON.parse(localStorage.getItem('quizMCState'));
    if (
      saved &&
      Array.isArray(saved.answered) &&
      saved.answered.length === questions.length &&
      typeof saved.score === 'number' &&
      typeof saved.current === 'number' &&
      Array.isArray(saved.optionOrders)
    ) {
      ({ score, current, answered, optionOrders } = saved);
    } else {
      throw 'invalid';
    }
  } catch {
    score    = 0;
    current  = 0;
    answered = Array(questions.length).fill(null);
    optionOrders = questions.map(() => {
      const order = Array.from({length: 5}, (_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      return order;
    });
  }

  function saveState() {
    localStorage.setItem(
      'quizMCState',
      JSON.stringify({ score, current, answered, optionOrders })
    );
  }

  // --- UI Rendering ---
  function loadQuestion(index) {
    const last = questions.length - 1;

    // 1) clear any lingering animations
    scoreEl.classList.remove('pop', 'error');

    // 2) load question
    const q = questions[index];
    imgEl.src            = `/static/images/${q.image}`;
    promptEl.textContent = q.prompt;

    // 3) reset answer buttons with randomized order
    const order = optionOrders[index];
    buttons.forEach((btn, i) => {
      btn.disabled = false;
      btn.classList.remove('btn-success', 'btn-danger');
      btn.classList.add('btn-outline-light');
      btn.textContent = q.options[order[i]];
    });

    // 4) reapply answered state
    const prev = answered[index];
    if (prev) {
      buttons.forEach(btn => {
        btn.disabled = true;
        const txt = btn.textContent.trim();
        if (txt === prev.chosen) {
          btn.classList.replace(
            'btn-outline-light',
            prev.correct ? 'btn-success' : 'btn-danger'
          );
        }
      });
    }

    // 5) prev button
    prevBtn.disabled = index === 0;

    // 6) Next vs Submit button
    if (index === last) {
      nextBtn.textContent = 'Submit';
      nextBtn.disabled   = false;
    } else {
      nextBtn.textContent = 'Next';
      nextBtn.disabled   = false;
    }

    // Reset Next button to grey if question is not answered
    if (!answered[index]) {
      nextBtn.classList.remove('btn-primary');
      nextBtn.classList.add('btn-secondary');
    }

    // 7) update score & progress
    scoreEl.textContent = score;
    updateProgress();

    // 8) persist
    saveState();
  }

  // --- Event Handlers ---
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => (b.disabled = true));

      const chosen    = btn.textContent.trim();
      const correct   = questions[current].correct;
      const isCorrect = chosen === correct;

      // record
      answered[current] = { chosen, correct: isCorrect };
      updateProgress();

      // style & score
      if (isCorrect) {
        score++;
        btn.classList.replace('btn-outline-light', 'btn-success');
        scoreEl.textContent = score;
        scoreEl.classList.add('pop');
        scoreEl.addEventListener(
          'animationend',
          () => scoreEl.classList.remove('pop'),
          { once: true }
        );
      } else {
        btn.classList.replace('btn-outline-light', 'btn-danger');

        // red flash
        scoreEl.classList.remove('error');
        void scoreEl.offsetWidth;
        scoreEl.classList.add('error');
        scoreEl.addEventListener(
          'animationend',
          () => scoreEl.classList.remove('error'),
          { once: true }
        );
      }

      // Make Next button blue
      nextBtn.classList.remove('btn-secondary');
      nextBtn.classList.add('btn-primary');

      // persist updated score
      scoreEl.textContent = score;
      saveState();
    });
  });

  prevBtn.addEventListener('click', () => {
    if (current > 0) {
      current--;
      loadQuestion(current);
    }
  });

  nextBtn.addEventListener('click', () => {
    const last = questions.length - 1;
    if (current < last) {
      current++;
      loadQuestion(current);
    } else {
      // on the last slide, "Submit" → go to MCQ results
      window.location.href = '/quiz/multiple/results';
    }
  });

  // --- Restart Handler ---
  restartBtn.addEventListener('click', () => {
    // Ask before resetting
    const ok = window.confirm(
      'Are you sure you want to restart the quiz? This will clear your score and progress.'
    );
    if (!ok) return;

    // reset state
    score    = 0;
    current  = 0;
    answered = Array(questions.length).fill(null);
    optionOrders = questions.map(() => {
      const order = Array.from({length: 5}, (_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      return order;
    });

    // persist cleared state
    saveState();

    // reload first question
    loadQuestion(current);
  });

  // Initialize first load
  loadQuestion(current);
});
