// ─── تم دارک / لایت ─────────────────────────────────────────────

const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
    document.body.classList.toggle('dark', theme === 'dark');
    if (themeToggle) {
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        themeToggle.setAttribute('aria-label', theme === 'dark' ? 'light mode' : 'dark mode');
    }
}

applyTheme(localStorage.getItem('vz-theme') || 'light');

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const next = document.body.classList.contains('dark') ? 'light' : 'dark';
        localStorage.setItem('vz-theme', next);
        applyTheme(next);
    });
}

// ─── منوی همبرگری ───────────────────────────────────────────────

const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        const open = navMenu.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', open);
        hamburger.textContent = open ? '✕' : '☰';
    });

    // بستن منو با کلیک بیرون
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('open');
            hamburger.setAttribute('aria-expanded', false);
            hamburger.textContent = '☰';
        }
    });

    // بستن منو با کلیک روی لینک
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
            hamburger.setAttribute('aria-expanded', false);
            hamburger.textContent = '☰';
        });
    });
}

// ─── انیمیشن fade-in هنگام اسکرول ──────────────────────────────

const fadeEls = document.querySelectorAll('.fade-in');

if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    fadeEls.forEach(el => observer.observe(el));
} else {
    fadeEls.forEach(el => el.classList.add('visible'));
}

// ─── شمارنده زنده آمار ──────────────────────────────────────────

function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    if (isNaN(target)) return;
    const locale = el.dataset.locale || 'fa-IR';
    const duration = 1500;
    const start = performance.now();

    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target).toLocaleString(locale);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));
}