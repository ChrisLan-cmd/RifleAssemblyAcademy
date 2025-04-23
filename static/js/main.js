document.addEventListener('DOMContentLoaded', function() {
    const text = "Welcome to the Rifle Assembly Academy. Click 'Next' to begin your learning journey.";
    const typedText = document.getElementById('typed-text');
    const cursor = document.querySelector('.cursor');
    let i = 0;

    function typeWriter() {
        if (i < text.length) {
            typedText.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 50);
        } else {
            cursor.style.display = 'none';
        }
    }

    typeWriter();
}); 