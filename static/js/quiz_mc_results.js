// static/js/quiz_mc_results.js

document.addEventListener('DOMContentLoaded', () => {
  const summaryList = document.getElementById('summary-list');
  const reportMain = document.querySelector('.report-main');
  const mcqResultsDiv = document.getElementById('mcq-results');
  const actionButtons = document.getElementById('action-buttons');
  const mcqState = JSON.parse(localStorage.getItem('quizMCState') || 'null');
  const questions = [
    { prompt: 'Which group directs high-pressure gases to cycle the action?', correct: 'Barrel Group' },
    { prompt: 'Which group is responsible for chambering, firing, and extracting rounds?', correct: 'Bolt Group' },
    { prompt: 'Which group houses the trigger mechanism and magazine well?', correct: 'Lower Receiver Group' },
    { prompt: 'Which component holds and feeds the cartridges?', correct: 'Magazine' },
    { prompt: 'Which group contains the charging handle and optics rail?', correct: 'Upper Receiver Group' },
  ];

  if (mcqState && Array.isArray(mcqState.answered)) {
    mcqState.answered.forEach((ans, i) => {
      const isCorrect = ans && ans.correct;
      const entry = document.createElement('div');
      entry.className = 'result-entry';
      entry.id = `mcq-${i}`;
      entry.innerHTML = `
        <div><strong>Q${i+1}:</strong> ${questions[i].prompt}</div>
        <div>Your answer: ${ans ? ans.chosen : '—'}</div>
        <div>Correct answer: ${questions[i].correct}</div>
        <div class="status ${isCorrect ? 'correct' : 'incorrect'}">
          ${isCorrect ? 'Correct' : 'Incorrect'}
        </div>
      `;
      mcqResultsDiv.appendChild(entry);

      // sidebar item
      const li = document.createElement('li');
      li.textContent = `Q${i+1} – ${isCorrect ? '✔' : '✘'}`;
      li.className = isCorrect ? 'correct' : 'incorrect';
      li.addEventListener('click', () => {
        const entryRect = entry.getBoundingClientRect();
        const containerRect = reportMain.getBoundingClientRect();
        const offset = reportMain.scrollTop + (entryRect.top - containerRect.top);
        reportMain.scrollTo({ top: offset, behavior: 'smooth' });
      });
      summaryList.appendChild(li);
    });

    // Add appropriate action button based on score
    const correctAnswers = mcqState.answered.filter(a => a && a.correct).length;
    if (correctAnswers >= 4) {
      const proceedBtn = document.createElement('a');
      proceedBtn.href = '/quiz/dragdrop';
      proceedBtn.className = 'btn btn-success btn-lg';
      proceedBtn.textContent = 'Proceed to Assembly Challenge';
      actionButtons.appendChild(proceedBtn);
    } else {
      const retakeBtn = document.createElement('a');
      retakeBtn.href = '#';
      retakeBtn.className = 'btn btn-warning btn-lg';
      retakeBtn.textContent = 'Retake Quiz';
      retakeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const ok = window.confirm(
          'Are you sure you want to retake the quiz? This will reset your current progress.'
        );
        if (ok) {
          localStorage.removeItem('quizMCState');
          window.location.href = '/quiz/multiple';
        }
      });
      actionButtons.appendChild(retakeBtn);
    }
  } else {
    const msg = document.createElement('div');
    msg.textContent = 'No Multiple Choice attempts found.';
    mcqResultsDiv.appendChild(msg);
    const li = document.createElement('li');
    li.textContent = 'No attempt';
    summaryList.appendChild(li);
  }
}); 