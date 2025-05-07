// static/js/quiz_dd.js

document.addEventListener('DOMContentLoaded', () => {
  // Add refresh warning
  window.addEventListener('beforeunload', (e) => {
    if (placedParts.size > 0) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    }
  });

  const parts = document.querySelectorAll('.part');
  const assemblyBox = document.getElementById('assembly-box');
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  const submitBtn = document.getElementById('submit-btn');
  const instruction = document.querySelector('.assembly-instruction');

  // Add hint button
  const controlsDiv = document.querySelector('.control-buttons');
  if (controlsDiv) {
    const hintBtn = document.createElement('button');
    hintBtn.className = 'hint-btn';
    hintBtn.textContent = 'Hint';
    controlsDiv.insertBefore(hintBtn, undoBtn);

    const overlay = document.createElement('div');
    overlay.className = 'hint-overlay';
    document.body.appendChild(overlay);

    const popup = document.createElement('div');
    popup.className = 'hint-popup';
    popup.innerHTML = `
      <button class="hint-popup-close">&times;</button>
      <img src="/static/images/answer.png" alt="Assembly Hint">
    `;
    document.body.appendChild(popup);

    hintBtn.addEventListener('click', () => {
      popup.style.display = 'block';
      overlay.style.display = 'block';
    });

    popup.querySelector('.hint-popup-close').addEventListener('click', () => {
      popup.style.display = 'none';
      overlay.style.display = 'none';
    });

    overlay.addEventListener('click', () => {
      popup.style.display = 'none';
      overlay.style.display = 'none';
    });
  }

  // Define relative positions for each part (relative to the barrel group)
  const relativePositions = {
    'part-barrel': { x: 0, y: 0, rotation: 0, scale: 1.01005 },  // Reference point
    'part-upper': { x: -120, y: 47, rotation: 0, scale: 1.0001782089995546 },  // Relative to barrel
    'part-bolt': { x: -45, y: 23, rotation: 0, scale: 0.9900499975248751 },    // Relative to barrel
    'part-lower': { x: -164, y: 45, rotation: 0, scale: 0.9900499975248751 },  // Relative to barrel
    'part-magazine': { x: -85, y: 78, rotation: -44.0514, scale: 0.9885818792941525 } // Relative to barrel
  };

  // Tolerance for position checking (in pixels)
  const POSITION_TOLERANCE = 30;
  const ROTATION_TOLERANCE = 15; // degrees
  const SCALE_TOLERANCE = 0.2;   // 20% tolerance

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

  // State variables
  let history = [];
  let currentStep = -1;
  let placedParts = new Map();
  let draggedPart = null;
  let isRotating = false;
  let isScaling = false;
  let startAngle = 0;
  let startScale = 1;
  let startDistance = 0;
  let activeHandle = null;
  let activePart = null;
  let lastRotation = 0;
  let rotationOffset = 0;

  // Initially disable submit button
  submitBtn.disabled = true;

  // Initialize drag and drop
  parts.forEach(part => {
    part.addEventListener('mousedown', handleMouseDown);
  });

  // Undo/Redo handlers
  undoBtn.addEventListener('click', handleUndo);
  redoBtn.addEventListener('click', handleRedo);
  submitBtn.addEventListener('click', () => {
    console.log('Submit button clicked');
    console.log('Number of placed parts:', placedParts.size);
    console.log('Total parts:', parts.length);
    handleSubmit();
  });

  function createPlacedPart(part, x, y) {
    const placedPart = document.createElement('div');
    placedPart.className = 'placed-part';
    placedPart.id = `placed-${part.id}`;
    placedPart.innerHTML = `
      ${part.innerHTML}
      <div class="rotate-handle"></div>
      <div class="scale-handle top-left"></div>
      <div class="scale-handle top-right"></div>
      <div class="scale-handle bottom-left"></div>
      <div class="scale-handle bottom-right"></div>
    `;
    placedPart.style.left = `${x}px`;
    placedPart.style.top = `${y}px`;
    placedPart.style.transform = 'scale(1)';
    
    // Initialize handle positions
    updateHandlePositions(placedPart, 1);
    
    // Add event listeners for controls
    const rotateHandle = placedPart.querySelector('.rotate-handle');
    const scaleHandles = placedPart.querySelectorAll('.scale-handle');
    
    rotateHandle.addEventListener('mousedown', handleRotateStart);
    scaleHandles.forEach(handle => {
      handle.addEventListener('mousedown', handleScaleStart);
    });
    
    return placedPart;
  }

  function getAngle(x, y, element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
  }

  function getDistance(x, y, element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
  }

  function handleRotate(e) {
    if (isRotating && activePart) {
      e.preventDefault();
      e.stopPropagation();
      
      const currentAngle = getAngle(e.clientX, e.clientY, activePart);
      const deltaAngle = currentAngle - startAngle;
      
      // Calculate new rotation
      let newRotation = rotationOffset + deltaAngle;
      
      // Normalize rotation to be between -180 and 180
      while (newRotation > 180) newRotation -= 360;
      while (newRotation < -180) newRotation += 360;
      
      // Get current scale
      const currentTransform = activePart.style.transform || '';
      const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
      const scale = scaleMatch ? scaleMatch[1] : '1';
      
      // Update transform
      activePart.style.transform = `rotate(${newRotation}deg) scale(${scale})`;
    }
  }

  function handleRotateStart(e) {
    if (e.target.classList.contains('rotate-handle')) {
      e.preventDefault();
      e.stopPropagation();
      
      isRotating = true;
      activePart = e.target.closest('.placed-part');
      
      // Get initial angle
      startAngle = getAngle(e.clientX, e.clientY, activePart);
      
      // Get current rotation
      const currentTransform = activePart.style.transform || '';
      const rotationMatch = currentTransform.match(/rotate\(([^)]+)\)/);
      rotationOffset = rotationMatch ? parseFloat(rotationMatch[1]) : 0;
      
      // Add event listeners
      document.addEventListener('mousemove', handleRotate);
      document.addEventListener('mouseup', handleRotateEnd);
    }
  }

  function handleRotateEnd(e) {
    if (isRotating && activePart) {
      e.preventDefault();
      e.stopPropagation();
      
      // Get current transform state
      const currentTransform = activePart.style.transform || '';
      const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
      const rotationMatch = currentTransform.match(/rotate\(([^)]+)\)/);
      
      // Add to history with complete state
      addToHistory({
        type: 'transform',
        partId: activePart.id.replace('placed-', ''),
        transform: currentTransform,
        scale: scaleMatch ? parseFloat(scaleMatch[1]) : 1,
        rotation: rotationMatch ? parseFloat(rotationMatch[1]) : 0,
        exactScale: parseFloat(activePart.querySelector('img').style.width) / 100,
        x: parseInt(activePart.style.left),
        y: parseInt(activePart.style.top)
      });
    }
    isRotating = false;
    activePart = null;
    document.removeEventListener('mousemove', handleRotate);
    document.removeEventListener('mouseup', handleRotateEnd);
  }

  function handleScale(e) {
    if (isScaling && activePart) {
      e.preventDefault();
      e.stopPropagation();
      
      const rect = activePart.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate angle and distance from center
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const currentAngle = Math.atan2(dy, dx) * 180 / Math.PI;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate scale factor based on distance change
      const scaleFactor = currentDistance / startDistance;
      const newScale = startScale * scaleFactor;
      
      // Limit scale between 0.5 and 2
      const clampedScale = Math.max(0.5, Math.min(2, newScale));
      
      // Get current rotation
      const currentTransform = activePart.style.transform || '';
      const rotationMatch = currentTransform.match(/rotate\(([^)]+)\)/);
      const rotation = rotationMatch ? rotationMatch[1] : '0';
      
      // Update transform
      activePart.style.transform = `rotate(${rotation}deg) scale(${clampedScale})`;
      
      // Update image size
      const img = activePart.querySelector('img');
      if (img) {
        const baseSize = 100; // Base size in pixels
        const newSize = baseSize * clampedScale;
        img.style.width = `${newSize}px`;
        img.style.height = `${newSize}px`;
      }
      
      // Update handle positions
      updateHandlePositions(activePart, clampedScale);
    }
  }

  function updateHandlePositions(part, scale) {
    const handles = part.querySelectorAll('.scale-handle');
    const baseOffset = 8; // Base offset for handles
    const scaledOffset = baseOffset * scale;
    
    handles.forEach(handle => {
      if (handle.classList.contains('top-left')) {
        handle.style.top = `${-scaledOffset}px`;
        handle.style.left = `${-scaledOffset}px`;
      } else if (handle.classList.contains('top-right')) {
        handle.style.top = `${-scaledOffset}px`;
        handle.style.right = `${-scaledOffset}px`;
      } else if (handle.classList.contains('bottom-left')) {
        handle.style.bottom = `${-scaledOffset}px`;
        handle.style.left = `${-scaledOffset}px`;
      } else if (handle.classList.contains('bottom-right')) {
        handle.style.bottom = `${-scaledOffset}px`;
        handle.style.right = `${-scaledOffset}px`;
      }
    });
  }

  function handleScaleStart(e) {
    if (e.target.classList.contains('scale-handle')) {
      e.preventDefault();
      e.stopPropagation();
      
      isScaling = true;
      activePart = e.target.closest('.placed-part');
      activeHandle = e.target;
      
      // Get initial position and scale
      const rect = activePart.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate initial distance from center to mouse
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      startDistance = Math.sqrt(dx * dx + dy * dy);
      
      // Get current scale
      const currentTransform = activePart.style.transform || '';
      const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
      startScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
      
      // Add event listeners
      document.addEventListener('mousemove', handleScale);
      document.addEventListener('mouseup', handleScaleEnd);
    }
  }

  function handleScaleEnd(e) {
    if (isScaling && activePart) {
      e.preventDefault();
      e.stopPropagation();
      
      // Get current transform state
      const currentTransform = activePart.style.transform || '';
      const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
      const rotationMatch = currentTransform.match(/rotate\(([^)]+)\)/);
      
      // Add to history with complete state
      addToHistory({
        type: 'transform',
        partId: activePart.id.replace('placed-', ''),
        transform: currentTransform,
        scale: scaleMatch ? parseFloat(scaleMatch[1]) : 1,
        rotation: rotationMatch ? parseFloat(rotationMatch[1]) : 0,
        exactScale: parseFloat(activePart.querySelector('img').style.width) / 100,
        x: parseInt(activePart.style.left),
        y: parseInt(activePart.style.top)
      });
    }
    isScaling = false;
    activePart = null;
    activeHandle = null;
    document.removeEventListener('mousemove', handleScale);
    document.removeEventListener('mouseup', handleScaleEnd);
  }

  function handleMouseDown(e) {
    if (e.target.closest('.part')) {
      draggedPart = e.target.closest('.part');
      draggedPart.classList.add('dragging');
      
      // Check if right mouse button is pressed for rotation/scaling
      if (e.button === 2) {
        e.preventDefault();
        isRotating = true;
        startAngle = getAngle(e.clientX, e.clientY, draggedPart);
        startScale = parseFloat(draggedPart.style.transform.match(/scale\(([^)]+)\)/) || 1);
        document.addEventListener('mousemove', handleRotate);
        document.addEventListener('mouseup', handleRotateEnd);
      } else {
        // Normal drag behavior
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
      
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
      
      // Create the placed part with controls
      const placedPart = createPlacedPart(draggedPart, x, y);
      
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
        x: x,
        y: y,
        transform: placedPart.style.transform
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
      
      // Check if right mouse button is pressed for rotation/scaling
      if (e.button === 2) {
        e.preventDefault();
        isRotating = true;
        activePart = placedPart;
        startAngle = getAngle(e.clientX, e.clientY, placedPart);
        startScale = parseFloat(placedPart.style.transform?.match(/scale\(([^)]+)\)/) || 1);
        document.addEventListener('mousemove', handleRotate);
        document.addEventListener('mouseup', handleRotateEnd);
      } else {
        // Normal drag behavior
        document.addEventListener('mousemove', handlePlacedPartMouseMove);
        document.addEventListener('mouseup', handlePlacedPartMouseUp);
      }
      
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
      
      // Prevent text selection
      e.preventDefault();
    }
  }

  function handlePlacedPartMouseUp(e) {
    const placedPart = document.querySelector('.placed-part.dragging');
    if (placedPart) {
      placedPart.classList.remove('dragging');
      document.removeEventListener('mousemove', handlePlacedPartMouseMove);
      document.removeEventListener('mouseup', handlePlacedPartMouseUp);
      
      // Get current transform state
      const currentTransform = placedPart.style.transform || '';
      const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
      const rotationMatch = currentTransform.match(/rotate\(([^)]+)\)/);
      
      // Add to history with complete state
      addToHistory({
        type: 'move',
        partId: placedPart.id.replace('placed-', ''),
        x: parseInt(placedPart.style.left),
        y: parseInt(placedPart.style.top),
        transform: currentTransform,
        scale: scaleMatch ? parseFloat(scaleMatch[1]) : 1,
        rotation: rotationMatch ? parseFloat(rotationMatch[1]) : 0,
        exactScale: parseFloat(placedPart.querySelector('img').style.width) / 100
      });
    }
  }

  function addToHistory(action) {
    // Remove any future states if we're not at the end
    if (currentStep < history.length - 1) {
      history = history.slice(0, currentStep + 1);
    }
    
    // Add the new action
    history.push(action);
    currentStep = history.length - 1;
    
    // Update button states
    updateButtonStates();
  }

  function handleUndo() {
    if (currentStep >= 0) {
      const action = history[currentStep];
      
      switch (action.type) {
        case 'place':
          // Remove the placed part and show the original
          const placedPart = placedParts.get(action.partId);
          if (placedPart) {
            placedPart.remove();
            placedParts.delete(action.partId);
            document.getElementById(action.partId).style.display = 'flex';
          }
          break;
          
        case 'move':
        case 'transform':
          // Restore previous state
          const transformedPart = placedParts.get(action.partId);
          if (transformedPart) {
            const prevAction = history[currentStep - 1];
            if (prevAction && (prevAction.type === 'move' || prevAction.type === 'transform')) {
              // Restore position
              transformedPart.style.left = `${prevAction.x}px`;
              transformedPart.style.top = `${prevAction.y}px`;
              
              // Restore transform
              transformedPart.style.transform = prevAction.transform;
              
              // Update image size
              const img = transformedPart.querySelector('img');
              if (img) {
                const scale = prevAction.exactScale || 1;
                img.style.width = `${100 * scale}px`;
                img.style.height = `${100 * scale}px`;
                updateHandlePositions(transformedPart, scale);
              }
            } else {
              // If no previous state, remove the part
              transformedPart.remove();
              placedParts.delete(action.partId);
              document.getElementById(action.partId).style.display = 'flex';
            }
          }
          break;
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
      
      switch (action.type) {
        case 'place':
          // Recreate the placed part
          const part = document.getElementById(action.partId);
          if (part) {
            const placedPart = createPlacedPart(part, action.x, action.y);
            
            // Apply transform if it exists
            if (action.transform) {
              placedPart.style.transform = action.transform;
              
              // Update image size using exact scale
              const img = placedPart.querySelector('img');
              if (img) {
                const scale = action.exactScale || 1;
                img.style.width = `${100 * scale}px`;
                img.style.height = `${100 * scale}px`;
                updateHandlePositions(placedPart, scale);
              }
            }
            
            assemblyBox.appendChild(placedPart);
            part.style.display = 'none';
            placedParts.set(action.partId, placedPart);
            
            // Add event listeners for controls
            const rotateHandle = placedPart.querySelector('.rotate-handle');
            const scaleHandles = placedPart.querySelectorAll('.scale-handle');
            
            rotateHandle.addEventListener('mousedown', handleRotateStart);
            scaleHandles.forEach(handle => {
              handle.addEventListener('mousedown', handleScaleStart);
            });
            
            // Make the placed part draggable
            placedPart.addEventListener('mousedown', handlePlacedPartMouseDown);
          }
          break;
          
        case 'move':
        case 'transform':
          // Restore state
          const transformedPart = placedParts.get(action.partId);
          if (transformedPart) {
            // Restore position
            transformedPart.style.left = `${action.x}px`;
            transformedPart.style.top = `${action.y}px`;
            
            // Restore transform
            transformedPart.style.transform = action.transform;
            
            // Update image size
            const img = transformedPart.querySelector('img');
            if (img) {
              const scale = action.exactScale || 1;
              img.style.width = `${100 * scale}px`;
              img.style.height = `${100 * scale}px`;
              updateHandlePositions(transformedPart, scale);
            }
            
            // Reattach event listeners
            const rotateHandle = transformedPart.querySelector('.rotate-handle');
            const scaleHandles = transformedPart.querySelectorAll('.scale-handle');
            
            // Remove old listeners first
            rotateHandle.replaceWith(rotateHandle.cloneNode(true));
            scaleHandles.forEach(handle => handle.replaceWith(handle.cloneNode(true)));
            
            // Add new listeners
            transformedPart.querySelector('.rotate-handle').addEventListener('mousedown', handleRotateStart);
            transformedPart.querySelectorAll('.scale-handle').forEach(handle => {
              handle.addEventListener('mousedown', handleScaleStart);
            });
            
            // Reattach drag listener
            transformedPart.removeEventListener('mousedown', handlePlacedPartMouseDown);
            transformedPart.addEventListener('mousedown', handlePlacedPartMouseDown);
          }
          break;
      }
      
      updateButtonStates();
      
      // Hide instruction text when parts are placed
      if (placedParts.size > 0 && instruction) {
        instruction.style.display = 'none';
      }
    }
  }

  function updateButtonStates() {
    undoBtn.disabled = currentStep < 0;
    redoBtn.disabled = currentStep >= history.length - 1;
    submitBtn.disabled = placedParts.size !== parts.length;
  }

  function parseTransform(transform) {
    if (!transform) return { rotation: 0, scale: 1 };
    
    const rotationMatch = transform.match(/rotate\(([^)]+)\)/);
    const scaleMatch = transform.match(/scale\(([^)]+)\)/);
    
    return {
      rotation: rotationMatch ? parseFloat(rotationMatch[1]) : 0,
      scale: scaleMatch ? parseFloat(scaleMatch[1]) : 1
    };
  }

  function handleSubmit() {
    console.log('handleSubmit called');
    if (placedParts.size === parts.length) {
      console.log('All parts are placed, proceeding with submission');
      const assignments = {};
      let allCorrect = true;
      
      // Get the barrel position as reference
      const barrelPart = placedParts.get('part-barrel');
      if (!barrelPart) {
        console.error('Barrel part not found in placedParts');
        alert('Error: Barrel group not found');
        return;
      }
      
      console.log('Barrel part found:', barrelPart);
      const barrelX = parseInt(barrelPart.style.left);
      const barrelY = parseInt(barrelPart.style.top);
      const barrelTransform = parseTransform(barrelPart.style.transform);
      
      console.log('Barrel position:', {
        x: barrelX,
        y: barrelY,
        rotation: barrelTransform.rotation,
        scale: barrelTransform.scale
      });
      
      placedParts.forEach((placedPart, partId) => {
        const x = parseInt(placedPart.style.left);
        const y = parseInt(placedPart.style.top);
        const transform = parseTransform(placedPart.style.transform);
        
        // Calculate position relative to barrel
        const relativeX = x - barrelX;
        const relativeY = y - barrelY;
        const relativeRotation = transform.rotation - barrelTransform.rotation;
        const relativeScale = transform.scale / barrelTransform.scale;
        
        const expectedPos = relativePositions[partId];
        
        // Calculate position differences
        const xDiff = Math.abs(relativeX - expectedPos.x);
        const yDiff = Math.abs(relativeY - expectedPos.y);
        const rotationDiff = Math.abs(relativeRotation - expectedPos.rotation);
        const scaleDiff = Math.abs(relativeScale - expectedPos.scale);
        
        // Check if position, rotation, and scale are within tolerance
        const isPositionCorrect = xDiff <= POSITION_TOLERANCE && yDiff <= POSITION_TOLERANCE;
        const isRotationCorrect = rotationDiff <= ROTATION_TOLERANCE;
        const isScaleCorrect = scaleDiff <= SCALE_TOLERANCE;
        
        const isCorrect = isPositionCorrect && isRotationCorrect && isScaleCorrect;
        
        // Log the part's position and correctness with detailed differences
        console.log(`Part ${partId}:`, {
          absolute: { x, y, rotation: transform.rotation, scale: transform.scale },
          relative: { x: relativeX, y: relativeY, rotation: relativeRotation, scale: relativeScale },
          expected: expectedPos,
          isCorrect,
          details: {
            positionCorrect: isPositionCorrect,
            rotationCorrect: isRotationCorrect,
            scaleCorrect: isScaleCorrect,
            positionDiff: {
              x: xDiff,
              y: yDiff,
              xExpected: expectedPos.x,
              yExpected: expectedPos.y,
              xActual: relativeX,
              yActual: relativeY
            },
            rotationDiff: {
              expected: expectedPos.rotation,
              actual: relativeRotation,
              difference: rotationDiff
            },
            scaleDiff: {
              expected: expectedPos.scale,
              actual: relativeScale,
              difference: scaleDiff
            }
          }
        });
        
        // Add visual feedback
        placedPart.classList.add(isCorrect ? 'correct-position' : 'incorrect-position');
        
        assignments[partId] = {
          x: x,
          y: y,
          relativeX: relativeX,
          relativeY: relativeY,
          rotation: transform.rotation,
          relativeRotation: relativeRotation,
          scale: transform.scale,
          relativeScale: relativeScale,
          correct: isCorrect,
          differences: {
            position: { x: xDiff, y: yDiff },
            rotation: rotationDiff,
            scale: scaleDiff
          }
        };
        
        if (!isCorrect) {
          allCorrect = false;
        }
      });
      
      // Store results
      localStorage.setItem('quizDDAssignments', JSON.stringify(assignments));
      localStorage.setItem('quizDDSubmitted', 'true');
      localStorage.setItem('quizDDCorrect', allCorrect.toString());
      
      // Show feedback message with more details
      if (allCorrect) {
        alert('Congratulations! All parts are in the correct position!');
        window.location.href = '/results';
      } else {
        const incorrectParts = Array.from(placedParts.entries())
          .filter(([_, part]) => part.classList.contains('incorrect-position'))
          .map(([id, _]) => id.replace('placed-', ''));
        
        alert(`Some parts are not in the correct position. Check the console for details about: ${incorrectParts.join(', ')}`);
      }
    } else {
      alert('Please place all parts before submitting.');
    }
  }
});
  