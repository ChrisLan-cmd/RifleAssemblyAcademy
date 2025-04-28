// static/js/home.js
document.addEventListener("DOMContentLoaded", () => {
    const sentences = [
      "Welcome to Rifle Assembly Academy...",
      "Learn about and interact with an SAR21...",
      "Press 'Next' to view the rifle..."
    ];
    const typingSpeed   = 100,
          deletingSpeed = 50,
          pauseBetween  = 1500;
    const typedEl = document.getElementById("typed-text");
  
    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  
    async function typeSentence(s) {
      for (let i = 1; i <= s.length; i++) {
        typedEl.textContent = s.slice(0, i);
        await wait(typingSpeed);
      }
    }
    async function deleteSentence(s) {
      for (let i = s.length; i >= 0; i--) {
        typedEl.textContent = s.slice(0, i);
        await wait(deletingSpeed);
      }
    }
    async function runTypewriter() {
      for (let i = 0; i < 2; i++) {
        await typeSentence(sentences[i]);
        await wait(pauseBetween);
        await deleteSentence(sentences[i]);
        await wait(300);
      }
      await typeSentence(sentences[2]);
    }
    runTypewriter();
  });
  