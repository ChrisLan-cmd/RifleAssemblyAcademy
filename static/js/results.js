// static/js/results.js

document.addEventListener('DOMContentLoaded', () => {
    const summaryList = document.getElementById('summary-list');
  
    // reference to main scrollable pane
    const reportMain = document.querySelector('.report-main');
  
    // --- Multiple Choice Results ---
    const mcqResultsDiv = document.getElementById('mcq-results');
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
        li.textContent = `MCQ Q${i+1} – ${isCorrect ? '✔' : '✘'}`;
        li.className = isCorrect ? 'correct' : 'incorrect';
        li.addEventListener('click', () => {
          const entryRect = entry.getBoundingClientRect();
          const containerRect = reportMain.getBoundingClientRect();
          const offset = reportMain.scrollTop + (entryRect.top - containerRect.top);
          reportMain.scrollTo({ top: offset, behavior: 'smooth' });
        });
        summaryList.appendChild(li);
      });
    } else {
      const msg = document.createElement('div');
      msg.textContent = 'No Multiple Choice attempts found.';
      mcqResultsDiv.appendChild(msg);
      const li = document.createElement('li');
      li.textContent = 'MCQ: no attempt';
      summaryList.appendChild(li);
    }
  
    // --- Drag & Drop Results ---
    const ddResultsDiv = document.getElementById('dd-results');
    const ddAssign = JSON.parse(localStorage.getItem('quizDDAssignments') || '{}');
    const ddCorrectZones = JSON.parse(localStorage.getItem('quizDDCorrectZones') || '[]');
    const parts = ['barrel', 'upper', 'bolt', 'lower', 'magazine'];
  
    parts.forEach(part => {
      const zoneId       = `zone-${part}`;
      const placedZoneId = ddAssign[`drag-${part}`];
      const isCorrect    = ddCorrectZones.includes(zoneId);
      const entry = document.createElement('div');
      entry.className = 'result-entry';
      entry.id = `dd-${part}`;
      entry.innerHTML = `
        <div><strong>${part.charAt(0).toUpperCase() + part.slice(1)}:</strong>
           placed in ${placedZoneId || 'none'}
        </div>
        <div>Expected zone: ${zoneId}</div>
        <div class="status ${isCorrect ? 'correct' : 'incorrect'}">
          ${isCorrect ? 'Correct' : 'Incorrect'}
        </div>
      `;
      ddResultsDiv.appendChild(entry);
  
      // sidebar item
      const li = document.createElement('li');
      li.textContent = `DnD ${part} – ${isCorrect ? '✔' : '✘'}`;
      li.className = isCorrect ? 'correct' : 'incorrect';
      li.addEventListener('click', () => {
        const entryRect = entry.getBoundingClientRect();
        const containerRect = reportMain.getBoundingClientRect();
        const offset = reportMain.scrollTop + (entryRect.top - containerRect.top);
        reportMain.scrollTo({ top: offset, behavior: 'smooth' });
      });
      summaryList.appendChild(li);
    });
  });
  