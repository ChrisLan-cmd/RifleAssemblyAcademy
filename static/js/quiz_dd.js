// static/js/quiz_dd.js

document.addEventListener('DOMContentLoaded', () => {
    let dragged = null;
  
    // Grab buttons and score display once
    const submitBtn  = document.getElementById('dd-submit');
    const restartBtn = document.getElementById('dd-restart');
    const scoreEl    = document.getElementById('dd-score');
  
    // 6) Restart handler — wire this *first* so it always works
    restartBtn.addEventListener('click', () => {
      localStorage.removeItem('quizDDSubmitted');
      localStorage.removeItem('quizDDCorrectZones');
      localStorage.removeItem('quizDDAssignments');
      localStorage.removeItem('quizDDInitialPositions');
      location.reload();
    });
  
    // 1) Initial scatter positions
    let initial = JSON.parse(localStorage.getItem('quizDDInitialPositions') || 'null');
    if (!initial) {
      initial = {};
      document.querySelectorAll('.draggable').forEach(img => {
        initial[img.id] = { left: img.offsetLeft, top: img.offsetTop };
      });
      localStorage.setItem('quizDDInitialPositions', JSON.stringify(initial));
    }
  
    // 2) Restore assignments
    const assign = JSON.parse(localStorage.getItem('quizDDAssignments') || 'null');
    if (assign) {
      document.querySelectorAll('.draggable').forEach(img => {
        const zoneId = assign[img.id];
        if (zoneId) {
          const zone = document.getElementById(zoneId);
          zone.appendChild(img);
          img.style.position  = 'absolute';
          img.style.left      = '50%';
          img.style.top       = '50%';
          img.style.transform = 'translate(-50%, -50%)';
        } else {
          const container = document.querySelector('.draggables');
          container.appendChild(img);
          img.style.position  = 'absolute';
          img.style.left      = initial[img.id].left + 'px';
          img.style.top       = initial[img.id].top  + 'px';
          img.style.transform = '';
        }
      });
    }
  
    // 3) If already submitted, show feedback and update score
    const submitted = localStorage.getItem('quizDDSubmitted') === 'true';
    if (submitted) {
      const correctZones = JSON.parse(localStorage.getItem('quizDDCorrectZones') || '[]');
  
      // color zones
      document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.classList.add(
          correctZones.includes(zone.id) ? 'correct' : 'incorrect'
        );
      });
  
      // update score display
      scoreEl.textContent = `Score: ${correctZones.length}/5`;
  
      // if perfect, lock interaction
      if (correctZones.length === 5) {
        document.querySelectorAll('.draggable')
          .forEach(img => img.setAttribute('draggable', 'false'));
        submitBtn.disabled = true;
      } else {
        submitBtn.disabled = false;  // allow re-submit
      }
  
      restartBtn.disabled = false;   // ensure restart stays enabled
  
      // done — skip setting up drag/drop & submit
      return;
    }
  
    // 4) Drag & drop handlers
    document.querySelectorAll('.draggable').forEach(img => {
      img.addEventListener('dragstart', e => {
        dragged = e.target;
        e.dataTransfer.setData('text/plain', e.target.id);
      });
      img.addEventListener('dragend', e => {
        const el = e.target;
        if (!el.parentElement.classList.contains('drop-zone')) {
          const container = document.querySelector('.draggables');
          container.appendChild(el);
          el.style.position  = 'absolute';
          el.style.left      = initial[el.id].left + 'px';
          el.style.top       = initial[el.id].top  + 'px';
          el.style.transform = '';
        }
      });
    });
  
    document.querySelectorAll('.drop-zone').forEach(zone => {
      zone.addEventListener('dragover', e => {
        e.preventDefault();
        zone.classList.add('hover');
      });
      zone.addEventListener('dragleave', () => {
        zone.classList.remove('hover');
      });
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('hover');
        const id = e.dataTransfer.getData('text/plain');
        const el = document.getElementById(id);
        zone.appendChild(el);
        el.style.position  = 'absolute';
        el.style.left      = '50%';
        el.style.top       = '50%';
        el.style.transform = 'translate(-50%, -50%)';
      });
    });
  
    // 5) Submit handler
    submitBtn.addEventListener('click', () => {
      const correctZones = [];
      const assignments  = {};
  
      document.querySelectorAll('.draggable').forEach(img => {
        const p   = img.parentElement;
        const zid = p.classList.contains('drop-zone') ? p.id : null;
        assignments[img.id] = zid;
        if (zid === 'zone-' + img.id.split('-')[1]) {
          correctZones.push(zid);
        }
      });
  
      // Persist
      localStorage.setItem('quizDDSubmitted', 'true');
      localStorage.setItem('quizDDCorrectZones', JSON.stringify(correctZones));
      localStorage.setItem('quizDDAssignments', JSON.stringify(assignments));
  
      // Visual feedback
      document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.classList.remove('correct','incorrect');
        zone.classList.add(
          correctZones.includes(zone.id) ? 'correct' : 'incorrect'
        );
      });
  
      // Update score display
      scoreEl.textContent = `Score: ${correctZones.length}/5`;
  
      // Lock only if all correct
      if (correctZones.length === 5) {
        document.querySelectorAll('.draggable')
          .forEach(img => img.setAttribute('draggable', 'false'));
        submitBtn.disabled = true;
      } else {
        submitBtn.disabled = false;
      }
  
      // Restart remains enabled
      restartBtn.disabled = false;
    });
  });
  