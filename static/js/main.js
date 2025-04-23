document.addEventListener("DOMContentLoaded", () => {
    const sentences = [
      "Welcome to Rifle Assembly Academy...",
      "Learn about and interact with the rifle of your choice...",
      "Swipe to the right or press 'Next' to view available rifles..."
    ];
  
    const typingSpeed   = 100;   // ms per char
    const deletingSpeed = 50;
    const pauseBetween  = 1500;  // ms before deleting
    const typedEl       = document.getElementById("typed-text");
  
    // Grab both sidebars (may be null on pages without them)
    const nextSidebar = document.getElementById("next-sidebar");
    const backSidebar = document.getElementById("back-sidebar");
  
    function wait(ms) {
      return new Promise(res => setTimeout(res, ms));
    }
  
    async function typeSentence(sentence) {
      for (let i = 0; i <= sentence.length; i++) {
        typedEl.textContent = sentence.slice(0, i);
        await wait(typingSpeed);
      }
    }
  
    async function deleteSentence(sentence) {
      for (let i = sentence.length; i >= 0; i--) {
        typedEl.textContent = sentence.slice(0, i);
        await wait(deletingSpeed);
      }
    }
  
    async function runTypewriter() {
      // type & delete first two, then type the last one and stop
      for (let i = 0; i < 2; i++) {
        await typeSentence(sentences[i]);
        await wait(pauseBetween);
        await deleteSentence(sentences[i]);
        await wait(300);
      }
      await typeSentence(sentences[2]);
    }
  
    runTypewriter();
  
    // —— Navigation handlers —— 
    function goToNextPage() {
      const nextUrl = nextSidebar?.dataset.next;
      if (nextUrl) window.location.href = nextUrl;
    }
  
    function goToPrevPage() {
      const prevUrl = backSidebar?.dataset.prev;
      if (prevUrl) window.location.href = prevUrl;
      else window.history.back();
    }
  
    // —— Click wires ——  
    if (nextSidebar) nextSidebar.addEventListener("click", goToNextPage);
    if (backSidebar) backSidebar.addEventListener("click", goToPrevPage);
  
    // —— Swipe logic (right = Next, left = Back) ——  
    let touchStartX = 0, touchEndX = 0;
    const swipeThreshold = 50; // px
  
    document.addEventListener("touchstart", e => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
  
    document.addEventListener("touchend", e => {
      touchEndX = e.changedTouches[0].screenX;
      const delta = touchEndX - touchStartX;
      if (delta > swipeThreshold)        goToNextPage();
      else if (delta < -swipeThreshold)  goToPrevPage();
    }, { passive: true });
  });
  