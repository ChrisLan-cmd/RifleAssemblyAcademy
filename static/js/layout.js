// static/js/layout.js
document.addEventListener('DOMContentLoaded', () => {
    const tabs   = document.querySelectorAll('.nav-tabs a');
    const slider = document.querySelector('.tab-slider');
    const active = document.querySelector('.nav-tabs a.active');
  
    function moveSlider(el) {
      const { offsetLeft: left, offsetWidth: width } = el;
      slider.style.left  = left + 'px';
      slider.style.width = width + 'px';
    }
  
    if (active) moveSlider(active);
  
    tabs.forEach(tab => {
      tab.addEventListener('mouseenter', () => moveSlider(tab));
    });
  
    document.querySelector('.nav-tabs')
      .addEventListener('mouseleave', () => {
        if (active) moveSlider(active);
        else slider.style.width = 0;
      });
  });
  
  