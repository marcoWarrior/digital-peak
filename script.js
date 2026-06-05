// --- FUNZIONE DI ATTIVAZIONE DEL SITO (FADE OUT INTRO) ---
function startWebsite() {
  const intro = document.getElementById('intro-screen');
  if (intro && !intro.classList.contains('fade-out')) {
    intro.classList.add('fade-out');
    
    // Forza la riproduzione continua del video di sfondo sulla Home Slide
    const bgVideo = document.getElementById('bgVideo');
    if (bgVideo) {
      bgVideo.play().catch(e => console.log("Riproduzione background avviata."));
    }
  }
}

// Assicurazione di sblocco forzato del pulsante di ingresso
window.addEventListener('DOMContentLoaded', () => {
  const introVid = document.getElementById('introVideo');
  if (introVid) {
    introVid.play().catch(() => {
      console.log("Autoplay iniziale mutato avviato correttamente dal browser.");
    });
  }
});

// --- LOGICA DI NAVIGAZIONE ORIZZONTALE TRA LE SLIDE ---
let currentSlide = 0;
const slides = document.querySelectorAll('.wave-slide');
const totalSlides = slides.length;
let isAnimating = false;

const dots = document.querySelectorAll('.nav-dot');
const navLinks = document.querySelectorAll('.nav-lnk-item');
const progBar = document.getElementById('progress');

function goToSlide(targetIndex) {
  if (targetIndex < 0 || targetIndex >= totalSlides || isAnimating || targetIndex === currentSlide) return;
  isAnimating = true;

  const curtain = document.getElementById('waveCurtain');
  curtain.style.display = 'block';
  curtain.classList.add('sweeping');

  setTimeout(() => {
    slides[currentSlide].classList.remove('active');
    slides[targetIndex].classList.add('active');

    dots.forEach((d, i) => d.classList.toggle('active', i === targetIndex));
    navLinks.forEach((l, i) => l.classList.toggle('active', i === targetIndex));
    
    progBar.style.width = ((targetIndex) / (totalSlides - 1)) * 100 + '%';

    currentSlide = targetIndex;
  }, 600);

  setTimeout(() => {
    curtain.classList.remove('sweeping');
    curtain.style.display = 'none';
    isAnimating = false;
  }, 1400);
}

function navigateToSlide(idx) {
  goToSlide(idx);
}

// --- INTERCETTAZIONE EVENTI SCROLL / SWIPE ---
window.addEventListener('wheel', (e) => {
  if (isAnimating) return;
  // Impedisce lo scroll se l'intro è ancora attiva
  const intro = document.getElementById('intro-screen');
  if (intro && !intro.classList.contains('fade-out')) return;

  if (Math.abs(e.deltaY) > 35 || Math.abs(e.deltaX) > 35) {
    if (e.deltaY > 0 || e.deltaX > 0) {
      goToSlide(currentSlide + 1);
    } else {
      goToSlide(currentSlide - 1);
    }
  }
}, { passive: true });

let touchX = 0;
let touchY = 0;
window.addEventListener('touchstart', (e) => {
  touchX = e.changedTouches[0].screenX;
  touchY = e.changedTouches[0].screenY;
}, { passive: true });

window.addEventListener('touchend', (e) => {
  if (isAnimating) return;
  const intro = document.getElementById('intro-screen');
  if (intro && !intro.classList.contains('fade-out')) return;

  const endX = e.changedTouches[0].screenX;
  const endY = e.changedTouches[0].screenY;
  const diffX = touchX - endX;
  const diffY = touchY - endY;

  if (Math.abs(diffX) > 50 || Math.abs(diffY) > 50) {
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) goToSlide(currentSlide + 1);
      else goToSlide(currentSlide - 1);
    } else {
      if (diffY > 0) goToSlide(currentSlide + 1);
      else goToSlide(currentSlide - 1);
    }
  }
}, { passive: true });

// --- HAMBURGER MENU DRAWER MANAGEMENT ---
function toggleD() {
  document.getElementById('drawer').classList.toggle('open');
  document.getElementById('ham').classList.toggle('open');
}
function closeD() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('ham').classList.remove('open');
}
function navigateFromDrawer(idx) {
  closeD();
  setTimeout(() => { goToSlide(idx); }, 300);
}

// --- CURSORE INTERATTIVO ---
const cursor = document.getElementById('cursor');
const cring = document.getElementById('cring');
window.addEventListener('mousemove', (e) => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
  cring.style.left = e.clientX + 'px';
  cring.style.top = e.clientY + 'px';
});

// --- VALIDAZIONE FORM AVANZATA ---
const pd = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'libero.it', 'icloud.com', 'live.it', 'ymail.com'];

function sf(el, errId, isValid) {
  if(!isValid) {
    el.classList.add('invalid');
    document.getElementById(errId).classList.add('on');
  } else {
    el.classList.remove('invalid');
    document.getElementById(errId).classList.remove('on');
  }
}

const form = document.getElementById('ctForm');
if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    let ok = true;
    
    const n = document.getElementById('fn');
    const nok = n.value.trim().split(' ').length >= 2 && n.value.trim().length >= 4;
    sf(n, 'en', nok); if(!nok) ok = false;
    
    const em = document.getElementById('fe');
    const ev = em.value.trim().toLowerCase();
    const isp = pd.some(d => ev.includes('@' + d));
    const eok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ev) && !isp;
    sf(em, 'ee', eok);
    if (!eok) {
      document.getElementById('ee').textContent = isp ? "Usa un'email aziendale (no provider pubblici)" : "Email non valida";
      ok = false;
    }
    
    const ph = document.getElementById('fp');
    const pok = ph.value.replace(/[\s\-\+\(\)]/g, '').length >= 8;
    sf(ph, 'ep', pok); if(!pok) ok = false;
    
    const ms = document.getElementById('fm');
    const mok = ms.value.trim().length >= 20;
    sf(ms, 'em', mok); if(!mok) ok = false;
    
    const pr = document.getElementById('fpr');
    const pe = document.getElementById('epr');
    if(!pr.checked) { pe.classList.add('on'); ok = false; } else pe.classList.remove('on');
    
    if(ok) {
      document.getElementById('ctForm').style.display = 'none';
      document.getElementById('form-ok').style.display = 'block';
    }
  });
}
progBar.style.width = '0%';