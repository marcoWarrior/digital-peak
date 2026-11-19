// ─────────────────────────────────────────────
//  main.js — Digital Peak
//  Navigazione, animazioni, parallax, form
// ─────────────────────────────────────────────

const prefersReducedMotion =
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── HAMBURGER MENU ───
const navToggle  = document.getElementById('navToggle');
const navLinksEl = document.getElementById('navLinks');
const navOverlay = document.getElementById('navOverlay');

const isMenuOpen = () => navLinksEl?.classList.contains('open') ?? false;

function openMenu() {
  navToggle?.classList.add('open');
  navLinksEl?.classList.add('open');
  navOverlay?.classList.add('open');
  navToggle?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMenu(restoreFocus = false) {
  const wasOpen = isMenuOpen();
  navToggle?.classList.remove('open');
  navLinksEl?.classList.remove('open');
  navOverlay?.classList.remove('open');
  navToggle?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  if (restoreFocus && wasOpen) {
    navToggle?.focus();
  }
}

navToggle?.addEventListener('click', () => (isMenuOpen() ? closeMenu() : openMenu()));
navOverlay?.addEventListener('click', () => closeMenu());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isMenuOpen()) closeMenu(true);
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 860 && isMenuOpen()) closeMenu();
});

// Chiudi il menu mobile al click sui link interni della nav
navLinksEl?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    if (isMenuOpen()) closeMenu();
  });
});

// ─── NAVIGAZIONE INTERNA (smooth scroll + persistenza variante cross-page) ───
document.querySelectorAll('a[data-target]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const target = link.getAttribute('data-target');
    if (!target) return;
    e.preventDefault();
    closeMenu();
    const section = document.querySelector(target);
    if (section) {
      section.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    } else {
      const dest = window.DPDesign
        ? window.DPDesign.withDesign('../index.html' + target)
        : '../index.html' + target;
      window.location.href = dest;
    }
  });
});

// Logo in homepage: scrolla al top senza ricaricare
const homeLogo = document.querySelector('a.nav-logo[href="#home"]');
if (homeLogo) {
  homeLogo.addEventListener('click', (e) => {
    const homeEl = document.getElementById('home');
    if (!homeEl) return;
    e.preventDefault();
    closeMenu();
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  });
}

// ─── NAVBAR SCROLL ───
const nav = document.getElementById('mainNav');
if (nav) {
  const updateNavScrolled = () => {
    nav.classList.toggle('scrolled', window.scrollY > 32);
  };
  updateNavScrolled();
  window.addEventListener('scroll', updateNavScrolled, { passive: true });
}

// ─── PARALLAX CONTENUTO E CLAMPED ───
const parallaxImgs = Array.from(document.querySelectorAll('.parallax-img'));
if (parallaxImgs.length > 0 && !prefersReducedMotion) {
  let parallaxTicking = false;

  const updateParallax = () => {
    parallaxTicking = false;
    const vh = window.innerHeight || 800;
    parallaxImgs.forEach((img) => {
      const container = img.closest('.service-media, .parallax-container') || img.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.bottom < -80 || rect.top > vh + 80) return;
      const centerProgress = (rect.top + rect.height / 2 - vh / 2) / vh;
      const shift = Math.max(-16, Math.min(16, centerProgress * -24));
      img.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0) scale(1.04)`;
    });
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!parallaxTicking) {
        parallaxTicking = true;
        window.requestAnimationFrame(updateParallax);
      }
    },
    { passive: true }
  );
  updateParallax();
}

// ─── SCROLL REVEAL ───
const revealTargets = Array.from(document.querySelectorAll('.rv-base, .rv-trigger'));
if (prefersReducedMotion || !('IntersectionObserver' in window)) {
  revealTargets.forEach((el) => el.classList.add('in'));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
  );

  revealTargets.forEach((el) => revealObserver.observe(el));

  // Safety check iniziale per elementi già in viewport
  window.requestAnimationFrame(() => {
    const vh = window.innerHeight || 800;
    revealTargets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.95 && rect.bottom > 0) {
        el.classList.add('in');
        revealObserver.unobserve(el);
      }
    });
  });
}

// ─── CONTACT FORM (Invio asincrono con feedback visivo) ───
const contactForm = document.getElementById('contactForm');
const formFeedback = document.getElementById('formFeedback');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('.btn-submit');
    const originalText = btn.innerHTML;
    const lang = localStorage.getItem('dp_lang') || 'it';

    const feedbackI18n = {
      it: {
        sending: 'Invio in corso...',
        success: '✓ Grazie! La tua richiesta è stata inviata con successo. Ti risponderemo al più presto.',
        error: '⚠ Si è verificato un errore durante l\'invio. Puoi contattarci direttamente a: marco.guerriero1994@gmail.com'
      },
      en: {
        sending: 'Sending...',
        success: '✓ Thank you! Your request has been sent successfully. We will get back to you shortly.',
        error: '⚠ An error occurred during submission. You can reach out directly to: marco.guerriero1994@gmail.com'
      },
      es: {
        sending: 'Enviando...',
        success: '✓ ¡Gracias! Tu solicitud ha sido enviada con éxito. Nos pondremos en contacto contigo pronto.',
        error: '⚠ Ocurrió un error al enviar el formulario. Puedes contactarnos directamente en: marco.guerriero1994@gmail.com'
      }
    };

    const currentFeedback = feedbackI18n[lang] || feedbackI18n.it;

    btn.textContent = currentFeedback.sending;
    btn.disabled = true;

    if (formFeedback) {
      formFeedback.style.display = 'none';
      formFeedback.className = 'form-feedback';
    }

    const data = Object.fromEntries(new FormData(contactForm).entries());
    data.lang = lang;
    data.page_url = window.location.href;

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const resData = await response.json().catch(() => ({}));

      if (response.ok && resData.success !== false) {
        if (formFeedback) {
          formFeedback.textContent = currentFeedback.success;
          formFeedback.className = 'form-feedback success';
          formFeedback.style.display = 'flex';
        }
        contactForm.reset();
      } else {
        throw new Error(resData.error || 'Server error');
      }
    } catch (err) {
      console.warn('[Contact Form] Errore invio:', err);
      if (formFeedback) {
        formFeedback.textContent = currentFeedback.error;
        formFeedback.className = 'form-feedback error';
        formFeedback.style.display = 'flex';
      }
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });
}
