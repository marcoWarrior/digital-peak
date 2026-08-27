// ─── TRANSIZIONE A COLONNE ───
window.addEventListener('load', () => {
  setTimeout(() => { document.getElementById('transitionOverlay').classList.add('is-loaded'); }, 300);
});

// ─── HAMBURGER MENU ───
const navToggle = document.getElementById('navToggle');
const navLinksEl = document.getElementById('navLinks');
const navOverlayEl = document.getElementById('navOverlay');

function isMenuOpen() {
  return navLinksEl.classList.contains('open');
}

function openMenu() {
  navToggle.classList.add('open');
  navLinksEl.classList.add('open');
  navOverlayEl.classList.add('open');
  navToggle.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden'; // blocca lo scroll dietro al menu
}

function closeMenu() {
  navToggle.classList.remove('open');
  navLinksEl.classList.remove('open');
  navOverlayEl.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

function toggleMenu() {
  isMenuOpen() ? closeMenu() : openMenu();
}

if (navToggle) {
  navToggle.addEventListener('click', toggleMenu);
}
if (navOverlayEl) {
  navOverlayEl.addEventListener('click', closeMenu);
}

// Chiudi con Esc
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isMenuOpen()) closeMenu();
});

// Se la finestra torna a dimensioni desktop, richiudi il menu mobile
window.addEventListener('resize', () => {
  if (window.innerWidth > 768 && isMenuOpen()) closeMenu();
});

// ─── NAVIGAZIONE INTERNA (funziona identica su desktop e mobile) ───
const navLinks = document.querySelectorAll('a[data-target]');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    const target = link.getAttribute('data-target');
    if (!target) return;
    e.preventDefault();
    closeMenu();
    const targetSection = document.querySelector(target);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Cambia colore al logo testo della Nav allo scroll (Sfondo bianco -> Testo Blu Navy)
const nav = document.getElementById('mainNav');
const logoText = document.querySelector('.logo-text-dark');
const logoBar = document.querySelector('.logo-bar-dark');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    nav.classList.add('scrolled');
    if (logoText) logoText.style.fill = 'var(--navy)';
    if (logoBar) logoBar.style.fill = 'var(--navy)';
  } else {
    nav.classList.remove('scrolled');
    if (logoText) logoText.style.fill = 'var(--navy)';
    if (logoBar) logoBar.style.fill = 'var(--navy)';
  }
}, { passive: true });

// ─── EFFETTO PARALLAX SULLE IMMAGINI ───
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const parallaxImgs = document.querySelectorAll('.parallax-img');
  parallaxImgs.forEach(img => {
    const speed = 0.15; img.style.transform = `translateY(${-(scrolled * speed)}px)`;
  });
}, { passive: true });

// ─── CURSOR ESTETICO (solo desktop) ───
const cur = document.getElementById('cursor'), crg = document.getElementById('cring');
let mx = 0, my = 0, rx = 0, ry = 0;
const isTouch = window.matchMedia('(max-width: 768px)').matches;

if (!isTouch) {
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  (function animC() {
    rx += (mx - rx) * .2; ry += (my - ry) * .2;
    if (cur) { cur.style.left = mx + 'px'; cur.style.top = my + 'px'; }
    if (crg) { crg.style.left = rx + 'px'; crg.style.top = ry + 'px'; }
    requestAnimationFrame(animC);
  })();
  document.querySelectorAll('a, button, .og-service').forEach(el => {
    el.addEventListener('mouseenter', () => { if (crg) crg.style.transform = 'translate(-50%,-50%) scale(1.5)'; });
    el.addEventListener('mouseleave', () => { if (crg) crg.style.transform = 'translate(-50%,-50%) scale(1)'; });
  });
}

// ─── SCROLL REVEAL ───
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.rv-base, .rv-trigger').forEach(el => obs.observe(el));
