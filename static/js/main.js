// Typewriter effect
document.addEventListener('DOMContentLoaded', function() {
    const typedText = document.getElementById('typed-text');
    if (typedText) {
        const text = "Welcome to the Rifle Assembly Academy! Learn about to assemble the SAR21!";
        const cursor = document.querySelector('.cursor');
        let i = 0;

        function typeWriter() {
            if (i < text.length) {
                typedText.textContent = text.substring(0, i + 1);
                i++;
                setTimeout(typeWriter, 50);
            } else {
                cursor.style.display = 'none';
            }
        }

        typeWriter();
    }
});

// Quiz functionality
document.addEventListener('DOMContentLoaded', function() {
    const optionButtons = document.querySelectorAll('.option-btn');
    if (optionButtons.length > 0) {
        const scoreDisplay = document.getElementById('score');
        let currentScore = parseInt(scoreDisplay.textContent);
        let answerSubmitted = false;

        optionButtons.forEach(button => {
            button.addEventListener('click', function() {
                if (answerSubmitted) return;  // Prevent multiple submissions
                answerSubmitted = true;
                
                const selectedAnswer = this.dataset.answer;
                const partId = this.closest('.options-container').dataset.partId;
                const questionNum = parseInt(this.closest('.options-container').dataset.questionNum);
                
                // Disable all buttons to prevent multiple submissions
                optionButtons.forEach(btn => btn.disabled = true);

                fetch('/submit_answer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        part_id: parseInt(partId),
                        answer: selectedAnswer
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Update score
                        currentScore = data.score;
                        scoreDisplay.textContent = currentScore;
                        
                        // Update score color based on value
                        if (currentScore < 0) {
                            scoreDisplay.classList.add('text-danger');
                        } else {
                            scoreDisplay.classList.remove('text-danger');
                        }

                        // Add visual feedback
                        this.classList.remove('btn-outline-light');
                        if (data.correct) {
                            // Show success feedback
                            this.classList.add('btn-success');
                            
                            // Wait for animation, then proceed
                            setTimeout(() => {
                                if (data.all_completed) {
                                    window.location.href = '/quiz_results';
                                } else {
                                    window.location.href = `/quiz/${questionNum + 1}`;
                                }
                            }, 1000);
                        } else {
                            // Show error feedback
                            this.classList.add('btn-danger');
                            
                            // Re-enable buttons after showing feedback
                            setTimeout(() => {
                                optionButtons.forEach(btn => {
                                    btn.disabled = false;
                                    if (btn.classList.contains('btn-danger')) {
                                        btn.classList.remove('btn-danger');
                                        btn.classList.add('btn-outline-light');
                                    }
                                });
                                answerSubmitted = false;  // Allow new submission
                            }, 1000);
                        }
                    }
                });
            });
        });
    }
});