const translations = {
    fa: {
        dir: 'rtl', lang: 'fa',
        nav_home: 'خانه',
        nav_game: 'بازی',
        hero_title_pre: 'به ',
        hero_title_post: ' خوش اومدی',
        hero_sub: 'سرگرمی، بازی و کشف — همه یه جا.',
        card2_title: 'بازی آنلاین',
        card2_desc: 'با دوستات بازی کن! حدس بزن، امتیاز بگیر و ببین کی بیشتر می‌دونه.',
        card2_btn: 'ورود به بازی ←',
        stat2_label: 'سوال بازی',
        stat3_num: 'رایگان',
        stat3_label: 'کاملاً رایگان',
        footer: '© ۲۰۲۵ VibeZone — ساخته شده با ❤',
        lang_btn: 'EN',
        counter_locale: 'fa-IR',
    },
    en: {
        dir: 'ltr', lang: 'en',
        nav_home: 'Home',
        nav_game: 'Game',
        hero_title_pre: 'Welcome to ',
        hero_title_post: '',
        hero_sub: 'Entertainment, games & discovery — all in one place.',
        card2_title: 'Online Game',
        card2_desc: 'Play with your friends! Guess, score points, and see who knows the most.',
        card2_btn: 'Play Now →',
        stat2_label: 'Game questions',
        stat3_num: 'Free',
        stat3_label: 'Completely free',
        footer: '© 2025 VibeZone — Made with ❤',
        lang_btn: 'FA',
        counter_locale: 'en-US',
    }
};

function applyLang(lang) {
    const t = translations[lang];
    if (!t) return;
    document.documentElement.setAttribute('dir', t.dir);
    document.documentElement.setAttribute('lang', t.lang);
    localStorage.setItem('vz-lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (t[key] !== undefined) el.textContent = t[key];
    });

    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) langBtn.textContent = t.lang_btn;

    document.querySelectorAll('.counter').forEach(el => {
        el.dataset.locale = t.counter_locale;
    });
}

function toggleLang() {
    const current = localStorage.getItem('vz-lang') || 'fa';
    applyLang(current === 'fa' ? 'en' : 'fa');
}

document.addEventListener('DOMContentLoaded', () => {
    applyLang(localStorage.getItem('vz-lang') || 'fa');
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) langBtn.addEventListener('click', toggleLang);
});