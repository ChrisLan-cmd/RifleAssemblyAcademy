// static/js/quiz_dd.js

document.addEventListener('DOMContentLoaded', () => {
  const parts = document.querySelectorAll('.part');
  const assemblyBox = document.getElementById('assembly-box');
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  const submitBtn = document.getElementById('submit-btn');
  const instruction = document.querySelector('.assembly-instruction');

  // Check if challenge has been completed
  if (localStorage.getItem('quizDDSubmitted') === 'true') {
    const ok = window.confirm(
      'You have already completed this challenge. Re-entering will reset your progress. Do you want to continue?'
    );
    if (!ok) {
      window.location.href = '/quiz';
      return;
    }
    // Clear the previous state
    localStorage.removeItem('quizDDSubmitted');
    localStorage.removeItem('quizDDAssignments');
  }

  // History for undo/redo
  let history = [];
  let currentStep = -1;
  let placedParts = new Map(); // Map of part IDs to their placed elements
  let draggedPart = null;

  // Initially disable submit button
  submitBtn.disabled = true;

  // Initialize drag and drop
  parts.forEach(part => {
    part.addEventListener('mousedown', handleMouseDown);
  });

  // Undo/Redo handlers
  undoBtn.addEventListener('click', handleUndo);
  redoBtn.addEventListener('click', handleRedo);
  submitBtn.addEventListener('click', handleSubmit);

  function handleMouseDown(e) {
    if (e.target.closest('.part')) {
      draggedPart = e.target.closest('.part');
      draggedPart.classList.add('dragging');
      
      // Add event listeners for drag
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Prevent default to avoid text selection
      e.preventDefault();
    }
  }

  function handleMouseMove(e) {
    if (draggedPart) {
      const rect = assemblyBox.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Create or update the preview
      let preview = document.getElementById('drag-preview');
      if (!preview) {
        preview = document.createElement('div');
        preview.id = 'drag-preview';
        preview.className = 'placed-part';
        preview.innerHTML = draggedPart.innerHTML;
        assemblyBox.appendChild(preview);
      }
      
      // Position the preview
      preview.style.left = `${x - 50}px`;
      preview.style.top = `${y - 50}px`;
    }
  }

  function handleMouseUp(e) {
    if (draggedPart) {
      const rect = assemblyBox.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Remove the preview
      const preview = document.getElementById('drag-preview');
      if (preview) {
        preview.remove();
      }
      
      // Create the placed part
      const placedPart = document.createElement('div');
      placedPart.className = 'placed-part';
      placedPart.innerHTML = draggedPart.innerHTML;
      placedPart.id = `placed-${draggedPart.id}`;
      
      // Constrain initial position to assembly box
      const partRect = draggedPart.getBoundingClientRect();
      const maxLeft = rect.width - partRect.width;
      const maxTop = rect.height - partRect.height;
      
      const newLeft = Math.max(0, Math.min(x - 50, maxLeft));
      const newTop = Math.max(0, Math.min(y - 50, maxTop));
      
      placedPart.style.left = `${newLeft}px`;
      placedPart.style.top = `${newTop}px`;
      
      // Add to assembly box
      assemblyBox.appendChild(placedPart);
      
      // Make the placed part draggable
      placedPart.addEventListener('mousedown', handlePlacedPartMouseDown);
      
      // Hide the original part
      draggedPart.style.display = 'none';
      
      // Add to placed parts map
      placedParts.set(draggedPart.id, placedPart);
      
      // Add to history
      addToHistory({
        type: 'place',
        partId: draggedPart.id,
        x: newLeft,
        y: newTop
      });
      
      // Hide instruction text when first part is placed
      if (instruction) {
        instruction.style.display = 'none';
      }
      
      // Update button states
      updateButtonStates();
      
      // Clean up
      draggedPart.classList.remove('dragging');
      draggedPart = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  }

  function handlePlacedPartMouseDown(e) {
    if (e.target.closest('.placed-part')) {
      const placedPart = e.target.closest('.placed-part');
      placedPart.classList.add('dragging');
      
      // Add event listeners for drag
      document.addEventListener('mousemove', handlePlacedPartMouseMove);
      document.addEventListener('mouseup', handlePlacedPartMouseUp);
      
      // Prevent default to avoid text selection
      e.preventDefault();
    }
  }

  function handlePlacedPartMouseMove(e) {
    const placedPart = document.querySelector('.placed-part.dragging');
    if (placedPart) {
      const rect = assemblyBox.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Constrain to assembly box boundaries
      const partRect = placedPart.getBoundingClientRect();
      const maxLeft = rect.width - partRect.width;
      const maxTop = rect.height - partRect.height;
      
      const newLeft = Math.max(0, Math.min(x - 50, maxLeft));
      const newTop = Math.max(0, Math.min(y - 50, maxTop));
      
      placedPart.style.left = `${newLeft}px`;
      placedPart.style.top = `${newTop}px`;
    }
  }

  function handlePlacedPartMouseUp(e) {
    const placedPart = document.querySelector('.placed-part.dragging');
    if (placedPart) {
      placedPart.classList.remove('dragging');
      document.removeEventListener('mousemove', handlePlacedPartMouseMove);
      document.removeEventListener('mouseup', handlePlacedPartMouseUp);
    }
  }

  function addToHistory(action) {
    if (currentStep < history.length - 1) {
      history = history.slice(0, currentStep + 1);
    }
    history.push(action);
    currentStep = history.length - 1;
    updateButtonStates();
  }

  function handleUndo() {
    if (currentStep >= 0) {
      const action = history[currentStep];
      if (action.type === 'place') {
        const placedPart = placedParts.get(action.partId);
        if (placedPart) {
          placedPart.remove();
          placedParts.delete(action.partId);
          document.getElementById(action.partId).style.display = 'flex';
        }
      }
      currentStep--;
      updateButtonStates();

      // Show instruction text if no parts are placed
      if (placedParts.size === 0 && instruction) {
        instruction.style.display = 'block';
      }
    }
  }

  function handleRedo() {
    if (currentStep < history.length - 1) {
      currentStep++;
      const action = history[currentStep];
      if (action.type === 'place') {
        const part = document.getElementById(action.partId);
        const placedPart = document.createElement('div');
        placedPart.className = 'placed-part';
        placedPart.innerHTML = part.innerHTML;
        placedPart.id = `placed-${action.partId}`;
        placedPart.style.left = `${action.x}px`;
        placedPart.style.top = `${action.y}px`;
        
        assemblyBox.appendChild(placedPart);
        placedPart.addEventListener('mousedown', handlePlacedPartMouseDown);
        
        part.style.display = 'none';
        placedParts.set(action.partId, placedPart);

        // Hide instruction text when parts are placed
        if (instruction) {
          instruction.style.display = 'none';
        }
      }
      updateButtonStates();
    }
  }

  function updateButtonStates() {
    undoBtn.disabled = currentStep < 0;
    redoBtn.disabled = currentStep >= history.length - 1;
    submitBtn.disabled = placedParts.size !== parts.length;
  }

  function handleSubmit() {
    if (placedParts.size === parts.length) {
      const assignments = {};
      placedParts.forEach((placedPart, partId) => {
        assignments[partId] = {
          x: parseInt(placedPart.style.left),
          y: parseInt(placedPart.style.top)
        };
      });
      
      localStorage.setItem('quizDDAssignments', JSON.stringify(assignments));
      localStorage.setItem('quizDDSubmitted', 'true');
      
      window.location.href = '/results';
    } else {
      alert('Please place all parts before submitting.');
    }
  }
});
  