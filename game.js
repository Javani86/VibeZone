import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, get, update, onValue, push, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ─── کانفیگ Firebase ──────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyBHjGLmu4RidfeRvsnLg4M73YfOjMgnry8",
  authDomain: "vibezone-game1.firebaseapp.com",
  databaseURL: "https://vibezone-game1-default-rtdb.firebaseio.com",
  projectId: "vibezone-game1",
  storageBucket: "vibezone-game1.firebasestorage.app",
  messagingSenderId: "689238238926",
  appId: "1:689238238926:web:d2be585dc00227ba58129f"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ─── سوال‌های بازی ────────────────────────────────────────────

const questions = {
  truth: {
    fa: [
      "آخرین باری که دروغ گفتی کِی بود؟",
      "بزرگ‌ترین ترست چیه؟",
      "کدوم راز رو هنوز به کسی نگفتی؟",
      "بدترین کاری که تا حالا کردی چی بود؟",
      "اگه می‌تونستی یه چیز از گذشته‌ات رو عوض کنی چی بود؟",
      "به کی بیشتر از همه اعتماد داری؟",
      "بدترین لحظه زندگیت کِی بود؟",
      "تا حالا به یه دوست خیانت کردی؟",
      "عجیب‌ترین رویایی که دیدی چی بود؟",
      "اگه فردا آخرین روز زندگیت بود چیکار می‌کردی؟",
      "آخرین باری که گریه کردی چرا بود؟",
      "چه کاری رو می‌کنی که از اون خجالت می‌کشی؟",
    ],
    en: [
      "When was the last time you lied?",
      "What is your biggest fear?",
      "What secret have you never told anyone?",
      "What's the worst thing you've ever done?",
      "If you could change one thing about your past, what would it be?",
      "Who do you trust the most?",
      "What was the worst moment of your life?",
      "Have you ever betrayed a friend?",
      "What's the strangest dream you've ever had?",
      "If tomorrow was your last day alive, what would you do?",
      "Why did you last cry?",
      "What's something you do that you're ashamed of?",
    ]
  },
  dare: {
    fa: [
      "یه آهنگ بخون تا همه بشنون!",
      "۱۰ تا اسکوات برو!",
      "یه پیام عاشقانه به آخرین نفر توی لیست مخاطبینت بفرست!",
      "یه عکس خنده‌دار از خودت بگیر و توی گروه بفرست!",
      "بدون مکث ۳۰ ثانیه بخند!",
      "یه رقص کوتاه برقص و فیلم بگیر!",
      "سه تا کار خوب قول بده که فردا انجام بدی!",
      "یه جوک بگو که همه بخندن!",
      "صدای یه حیوان رو در بیار!",
      "با صدای بلند بگو دوستت داری به یکی از اعضای گروه!",
      "یه سلفی با حالت عجیب بگیر و بفرست!",
      "۵ تا بارفیکس برو!",
    ],
    en: [
      "Sing a song out loud for everyone to hear!",
      "Do 10 squats!",
      "Send a romantic message to the last person in your contacts!",
      "Take a funny selfie and share it in the group!",
      "Laugh nonstop for 30 seconds!",
      "Do a short dance and record it!",
      "Promise 3 good deeds you'll do tomorrow!",
      "Tell a joke that makes everyone laugh!",
      "Imitate an animal sound!",
      "Loudly say 'I love you' to one of the group members!",
      "Take a weird selfie and share it!",
      "Do 5 pull-ups!",
    ]
  }
};

// ─── وضعیت بازیکن ─────────────────────────────────────────────

let roomCode   = null;
let myId       = null;
let myName     = null;
let isHost     = false;
let unsubscribe = null;
const lang     = () => localStorage.getItem('vz-lang') || 'fa';

// ─── ابزارها ──────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showToast(msg, duration = 2500) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

function randomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function randomQuestion(type) {
  const l = lang();
  const list = questions[type][l];
  return list[Math.floor(Math.random() * list.length)];
}

function renderPlayers(players) {
  const el = document.getElementById('players-list');
  el.innerHTML = '';
  Object.values(players || {}).forEach((p, i) => {
    const chip = document.createElement('div');
    chip.className = 'player-chip' + (p.isHost ? ' host-chip' : '');
    chip.innerHTML = `
      <div class="avatar color-${i % 8}">${p.name.charAt(0).toUpperCase()}</div>
      <span>${p.name}${p.isHost ? ' 👑' : ''}</span>
    `;
    el.appendChild(chip);
  });
}

// ─── ساخت اتاق ────────────────────────────────────────────────

document.getElementById('btn-create').addEventListener('click', async () => {
  const name = document.getElementById('host-name').value.trim();
  if (!name) return showToast(lang() === 'fa' ? 'اسمت رو بنویس!' : 'Enter your name!');

  roomCode = randomCode();
  myId     = 'player_' + Date.now();
  myName   = name;
  isHost   = true;

  await set(ref(db, `rooms/${roomCode}`), {
    host: myId,
    status: 'waiting',
    currentPlayerIndex: 0,
    round: 1,
    players: {
      [myId]: { name, isHost: true, joinedAt: Date.now() }
    }
  });

  document.getElementById('display-code').textContent = roomCode;
  document.getElementById('btn-start').style.display = 'block';
  showScreen('screen-waiting');
  listenRoom();
});

// ─── ورود به اتاق ─────────────────────────────────────────────

document.getElementById('btn-join').addEventListener('click', async () => {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!name) return showToast(lang() === 'fa' ? 'اسمت رو بنویس!' : 'Enter your name!');
  if (!code)  return showToast(lang() === 'fa' ? 'کد اتاق رو بنویس!' : 'Enter the room code!');

  const snap = await get(ref(db, `rooms/${code}`));
  if (!snap.exists()) return showToast(lang() === 'fa' ? 'اتاق پیدا نشد!' : 'Room not found!');

  const room = snap.val();
  if (room.status !== 'waiting') return showToast(lang() === 'fa' ? 'بازی شروع شده!' : 'Game already started!');

  myId     = 'player_' + Date.now();
  myName   = name;
  roomCode = code;
  isHost   = false;

  await update(ref(db, `rooms/${code}/players`), {
    [myId]: { name, isHost: false, joinedAt: Date.now() }
  });

  document.getElementById('display-code').textContent = code;
  document.getElementById('btn-start').style.display = 'none';
  showScreen('screen-waiting');
  listenRoom();
});

// ─── کپی کد اتاق ─────────────────────────────────────────────

document.getElementById('btn-copy').addEventListener('click', () => {
  navigator.clipboard.writeText(roomCode).then(() => {
    showToast(lang() === 'fa' ? 'کد کپی شد!' : 'Code copied!');
  });
});

// ─── شروع بازی ────────────────────────────────────────────────

document.getElementById('btn-start').addEventListener('click', async () => {
  const snap = await get(ref(db, `rooms/${roomCode}/players`));
  const players = snap.val();
  if (Object.keys(players).length < 2) {
    return showToast(lang() === 'fa' ? 'حداقل ۲ نفر لازمه!' : 'Need at least 2 players!');
  }
  await update(ref(db, `rooms/${roomCode}`), { status: 'playing' });
});

// ─── گوش دادن به تغییرات اتاق ────────────────────────────────

function listenRoom() {
  if (unsubscribe) unsubscribe();
  const roomRef = ref(db, `rooms/${roomCode}`);
  unsubscribe = onValue(roomRef, (snap) => {
    if (!snap.exists()) return;
    const room = snap.val();

    if (room.status === 'waiting') {
      renderPlayers(room.players);
    }

    if (room.status === 'playing') {
      showScreen('screen-game');
      updateGameScreen(room);
    }

    if (room.status === 'ended') {
      showScreen('screen-end');
    }
  });
}

// ─── آپدیت صفحه بازی ─────────────────────────────────────────

function updateGameScreen(room) {
  const players   = Object.entries(room.players || {});
  const idx       = room.currentPlayerIndex % players.length;
  const [curId, curPlayer] = players[idx];
  const isMyTurn  = curId === myId;
  const l         = lang();

  document.getElementById('current-player-name').textContent = curPlayer.name;
  document.getElementById('round-num').textContent = room.round || 1;

  if (room.currentCard) {
    // نمایش کارت
    document.getElementById('choice-screen').style.display = 'none';
    document.getElementById('card-screen').style.display   = 'block';

    const card     = document.getElementById('game-card');
    const badge    = document.getElementById('card-type-badge');
    const cardText = document.getElementById('card-text');

    card.className = 'game-card ' + room.currentCard.type;
    badge.textContent = room.currentCard.type === 'truth'
      ? (l === 'fa' ? '🤔 حقیقت' : '🤔 Truth')
      : (l === 'fa' ? '😈 جرأت'  : '😈 Dare');
    cardText.textContent = room.currentCard.text;

    // فقط هاست می‌تونه نفر بعدی رو بزنه
    document.getElementById('btn-next').style.display = isHost ? 'block' : 'none';

  } else {
    // صفحه انتخاب
    document.getElementById('choice-screen').style.display = 'block';
    document.getElementById('card-screen').style.display   = 'none';

    const prompt = document.getElementById('choice-prompt');
    prompt.textContent = isMyTurn
      ? (l === 'fa' ? `${curPlayer.name}، انتخاب کن:` : `${curPlayer.name}, choose:`)
      : (l === 'fa' ? `نوبت ${curPlayer.name}ه...` : `It's ${curPlayer.name}'s turn...`);

    document.getElementById('btn-truth').disabled = !isMyTurn;
    document.getElementById('btn-dare').disabled  = !isMyTurn;
  }
}

// ─── انتخاب حقیقت ────────────────────────────────────────────

document.getElementById('btn-truth').addEventListener('click', async () => {
  await update(ref(db, `rooms/${roomCode}`), {
    currentCard: { type: 'truth', text: randomQuestion('truth') }
  });
});

// ─── انتخاب جرأت ─────────────────────────────────────────────

document.getElementById('btn-dare').addEventListener('click', async () => {
  await update(ref(db, `rooms/${roomCode}`), {
    currentCard: { type: 'dare', text: randomQuestion('dare') }
  });
});

// ─── نفر بعدی ────────────────────────────────────────────────

document.getElementById('btn-next').addEventListener('click', async () => {
  const snap    = await get(ref(db, `rooms/${roomCode}`));
  const room    = snap.val();
  const players = Object.keys(room.players || {});
  const nextIdx = (room.currentPlayerIndex + 1) % players.length;
  const nextRound = nextIdx === 0 ? (room.round || 1) + 1 : (room.round || 1);

  if (nextRound > 5) {
    await update(ref(db, `rooms/${roomCode}`), { status: 'ended' });
  } else {
    await update(ref(db, `rooms/${roomCode}`), {
      currentPlayerIndex: nextIdx,
      currentCard: null,
      round: nextRound
    });
  }
});

// ─── شروع مجدد ───────────────────────────────────────────────

document.getElementById('btn-restart').addEventListener('click', () => {
  if (unsubscribe) unsubscribe();
  remove(ref(db, `rooms/${roomCode}`));
  roomCode = null; myId = null; myName = null; isHost = false;
  showScreen('screen-lobby');
});
