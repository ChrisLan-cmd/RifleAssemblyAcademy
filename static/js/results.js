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
        const isAnswered = ans !== null;
        const isCorrect = ans && ans.correct;
        const entry = document.createElement('div');
        entry.className = 'result-entry';
        entry.id = `mcq-${i}`;
        entry.innerHTML = `
          <div><strong>Q${i+1}:</strong> ${questions[i].prompt}</div>
          <div>Your answer: ${isAnswered ? ans.chosen : '—'}</div>
          <div>Correct answer: ${questions[i].correct}</div>
          <div class="status ${isAnswered ? (isCorrect ? 'correct' : 'incorrect') : 'unanswered'}">
            ${isAnswered ? (isCorrect ? 'Correct' : 'Incorrect') : 'N/A'}
          </div>
        `;
        mcqResultsDiv.appendChild(entry);
  
        // sidebar item
        const li = document.createElement('li');
        li.textContent = `MCQ Q${i+1} – ${isAnswered ? (isCorrect ? '✔' : '✘') : '—'}`;
        li.className = isAnswered ? (isCorrect ? 'correct' : 'incorrect') : 'unanswered';
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
  
    // --- Assembly Challenge Results ---
    const ddResultsDiv = document.getElementById('dd-results');
    const ddAssignments = JSON.parse(localStorage.getItem('quizDDAssignments') || '{}');
    const ddSubmitted = localStorage.getItem('quizDDSubmitted') === 'true';
    
    // Define full names for parts
    const partNames = {
      'barrel': 'Barrel Group',
      'upper': 'Upper Receiver Group',
      'bolt': 'Bolt Group',
      'lower': 'Lower Receiver Group',
      'magazine': 'Magazine'
    };
    const parts = Object.keys(partNames);
  
    if (ddSubmitted && Object.keys(ddAssignments).length > 0) {
      parts.forEach(part => {
        const partId = `part-${part}`;
        const assignment = ddAssignments[partId];
        const entry = document.createElement('div');
        entry.className = 'result-entry';
        entry.id = `dd-${part}`;
        
        if (assignment) {
          const { correct } = assignment;
          entry.innerHTML = `
            <div><strong>${partNames[part]}:</strong></div>
            <div class="status ${correct ? 'correct' : 'incorrect'}">
              ${correct ? 'Correctly placed' : 'Incorrectly placed'}
            </div>
          `;
        } else {
          entry.innerHTML = `
            <div><strong>${partNames[part]}:</strong></div>
            <div class="status incorrect">Not placed</div>
          `;
        }
        
        ddResultsDiv.appendChild(entry);
      });
  
      // Add overall status
      const allCorrect = Object.values(ddAssignments).every(a => a.correct);
      const statusDiv = document.createElement('div');
      statusDiv.className = `status ${allCorrect ? 'correct' : 'incorrect'}`;
      statusDiv.style.textAlign = 'center';
      statusDiv.style.marginTop = '1rem';
      statusDiv.textContent = allCorrect ? 
        'Congratulations! All parts are correctly assembled!' : 
        'Some parts are not in the correct position. Try again!';
      ddResultsDiv.appendChild(statusDiv);
  
      // Add sidebar item
      const li = document.createElement('li');
      li.textContent = `Assembly Challenge – ${allCorrect ? '✔' : '✘'}`;
      li.className = allCorrect ? 'correct' : 'incorrect';
      li.addEventListener('click', () => {
        const containerRect = reportMain.getBoundingClientRect();
        const offset = reportMain.scrollTop + (ddResultsDiv.offsetTop - containerRect.top);
        reportMain.scrollTo({ top: offset, behavior: 'smooth' });
      });
      summaryList.appendChild(li);
    } else {
      const msg = document.createElement('div');
      msg.textContent = 'No Assembly Challenge attempts found.';
      ddResultsDiv.appendChild(msg);
      const li = document.createElement('li');
      li.textContent = 'Assembly: no attempt';
      summaryList.appendChild(li);
    }
  });
  