/* ══════════════════════════════════════════════════════════════
   DIGITAL PEAK — JavaScript
   ══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function() {
  
  // ── Scroll Reveal Animation ──
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  reveals.forEach(el => revealObserver.observe(el));

  // ── Nav shrink on scroll ──
  const nav = document.querySelector('nav');
  let lastScrollY = 0;
  
  function handleNavScroll() {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > 60) {
      nav.style.padding = window.innerWidth <= 992 ? '12px 30px' : '16px 60px';
    } else {
      nav.style.padding = window.innerWidth <= 992 ? '20px 30px' : '24px 60px';
    }
    
    lastScrollY = currentScrollY;
  }
  
  window.addEventListener('scroll', handleNavScroll);

  // ── Mobile Menu Toggle ──
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (mobileMenuToggle && navLinks) {
    mobileMenuToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      navLinks.classList.toggle('active');
      document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuToggle.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
        mobileMenuToggle.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const navHeight = nav.offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ── Resize handler for responsive adjustments ──
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Reset mobile menu state on resize to desktop
      if (window.innerWidth > 992) {
        if (mobileMenuToggle) mobileMenuToggle.classList.remove('active');
        if (navLinks) navLinks.classList.remove('active');
        document.body.style.overflow = '';
      }
      handleNavScroll();
    }, 100);
  });

});
