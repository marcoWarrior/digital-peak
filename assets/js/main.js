// ─────────────────────────────────────────────
//  main.js — Digital Peak
//  Navigazione, animazioni, parallax, form
// ─────────────────────────────────────────────

// ─── HAMBURGER MENU ───
const navToggle   = document.getElementById('navToggle');
const navLinksEl  = document.getElementById('navLinks');
const navOverlay  = document.getElementById('navOverlay');

const isMenuOpen = () => navLinksEl?.classList.contains('open') ?? false;

function openMenu() {
  navToggle?.classList.add('open');
  navLinksEl?.classList.add('open');
  navOverlay?.classList.add('open');
  navToggle?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  navToggle?.classList.remove('open');
  navLinksEl?.classList.remove('open');
  navOverlay?.classList.remove('open');
  navToggle?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

navToggle?.addEventListener('click', () => isMenuOpen() ? closeMenu() : openMenu());
navOverlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isMenuOpen()) closeMenu(); });
window.addEventListener('resize', () => { if (window.innerWidth > 768 && isMenuOpen()) closeMenu(); });

// ─── NAVIGAZIONE INTERNA (smooth scroll + fallback cross-page) ───
document.querySelectorAll('a[data-target]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = link.getAttribute('data-target');
    if (!target) return;
    e.preventDefault();
    closeMenu();
    const section = document.querySelector(target);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Siamo su una sottopagina: torna all'index con l'ancora
      window.location.href = '../index.html' + target;
    }
  });
});

// ─── NAVBAR SCROLL ───
const nav = document.getElementById('mainNav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// ─── PARALLAX ───
window.addEventListener('scroll', () => {
  document.querySelectorAll('.parallax-img').forEach(img => {
    img.style.transform = `translateY(${-(window.scrollY * 0.15)}px)`;
  });
}, { passive: true });

// ─── SCROLL REVEAL ───
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.rv-base, .rv-trigger').forEach(el => revealObserver.observe(el));

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
