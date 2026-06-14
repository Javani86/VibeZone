const translations = {
  fa: {
    dir: 'rtl', lang: 'fa',
    nav_home: 'خانه', nav_game: 'بازی',
    hero_badge: '🎉 خوش اومدی!',
    hero_title_pre: 'به ', hero_title_post: ' خوش اومدی',
    hero_sub: 'سرگرمی، بازی و کشف — همه یه جا.',
    card2_title: 'بازی آنلاین',
    card2_desc: 'با دوستات بازی کن! حدس بزن، امتیاز بگیر و ببین کی بیشتر می‌دونه.',
    card2_btn: 'ورود به بازی ←',
    stat2_label: 'سوال بازی', stat3_num: 'رایگان', stat3_label: 'کاملاً رایگان',
    footer: '© ۲۰۲۵ VibeZone — ساخته شده با ❤',
    lang_btn: 'EN', counter_locale: 'fa-IR',
    // بازی
    game_title: 'حقیقت یا جرأت',
    game_sub: 'با دوستات از راه دور بازی کن',
    create_room: 'ساخت اتاق جدید',
    create_room_desc: 'یه اتاق بساز و کد رو به دوستات بده',
    join_room: 'ورود به اتاق',
    join_room_desc: 'کد اتاق رو از دوستت بگیر',
    enter_name: 'اسمت رو بنویس...',
    enter_code: 'کد اتاق...',
    btn_create: 'ساخت اتاق ←',
    btn_join: 'ورود به اتاق ←',
    or: 'یا',
    waiting_title: 'منتظر بازیکن‌ها...',
    room_code_label: 'کد اتاق:',
    btn_start: 'شروع بازی ▶',
    waiting_hint: 'وقتی همه آماده شدن، هاست بازی رو شروع می‌کنه',
    turn_label: 'نوبت:', round_label: 'دور',
    btn_truth: '🤔 حقیقت', btn_dare: '😈 جرأت',
    choice_hint: 'فقط بازیکن نوبتی می‌تونه انتخاب کنه',
    btn_next: 'نفر بعدی ←',
    end_title: 'بازی تموم شد!',
    end_sub: 'امیدواریم خوش گذشته باشه',
    btn_restart: 'بازی جدید 🔄',
  },
  en: {
    dir: 'ltr', lang: 'en',
    nav_home: 'Home', nav_game: 'Game',
    hero_badge: '🎉 Welcome!',
    hero_title_pre: 'Welcome to ', hero_title_post: '',
    hero_sub: 'Entertainment, games & discovery — all in one place.',
    card2_title: 'Online Game',
    card2_desc: 'Play with your friends! Guess, score points, and see who knows the most.',
    card2_btn: 'Play Now →',
    stat2_label: 'Game questions', stat3_num: 'Free', stat3_label: 'Completely free',
    footer: '© 2025 VibeZone — Made with ❤',
    lang_btn: 'FA', counter_locale: 'en-US',
    // game
    game_title: 'Truth or Dare',
    game_sub: 'Play with friends from anywhere',
    create_room: 'Create a Room',
    create_room_desc: 'Create a room and share the code with friends',
    join_room: 'Join a Room',
    join_room_desc: 'Get the room code from your friend',
    enter_name: 'Enter your name...',
    enter_code: 'Room code...',
    btn_create: 'Create Room →',
    btn_join: 'Join Room →',
    or: 'or',
    waiting_title: 'Waiting for players...',
    room_code_label: 'Room code:',
    btn_start: 'Start Game ▶',
    waiting_hint: 'When everyone is ready, the host starts the game',
    turn_label: 'Turn:', round_label: 'Round',
    btn_truth: '🤔 Truth', btn_dare: '😈 Dare',
    choice_hint: 'Only the current player can choose',
    btn_next: 'Next Player →',
    end_title: 'Game Over!',
    end_sub: 'Hope you had a great time!',
    btn_restart: 'New Game 🔄',
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
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (t[key] !== undefined) el.placeholder = t[key];
  });
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) langBtn.textContent = t.lang_btn;
  document.querySelectorAll('.counter').forEach(el => { el.dataset.locale = t.counter_locale; });
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
