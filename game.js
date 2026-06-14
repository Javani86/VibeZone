// ─── Supabase Config ──────────────────────────────────────────

const SUPABASE_URL = 'https://ebbcasasjtrjdvzpgowm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYmNhc2FzanRyamR2enBnb3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTUzMzgsImV4cCI6MjA5Njk5MTMzOH0.0gHyInkGeWgBRsjFc6NijhKpJ4NF1p1oH4W6VFkTlQI';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

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

// ─── وضعیت بازیکن ────────────────────────────────────────────

let roomCode  = null;
let myId      = null;
let myName    = null;
let isHost    = false;
let realtimeCh = null;

const lang = () => localStorage.getItem('vz-lang') || 'fa';

// ─── ابزارها ─────────────────────────────────────────────────

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
  players.forEach((p, i) => {
    const chip = document.createElement('div');
    chip.className = 'player-chip' + (p.is_host ? ' host-chip' : '');
    chip.innerHTML = `
      <div class="avatar color-${i % 8}">${p.name.charAt(0).toUpperCase()}</div>
      <span>${p.name}${p.is_host ? ' 👑' : ''}</span>
    `;
    el.appendChild(chip);
  });
}

// ─── ساخت اتاق ───────────────────────────────────────────────

document.getElementById('btn-create').addEventListener('click', async () => {
  const name = document.getElementById('host-name').value.trim();
  if (!name) return showToast(lang() === 'fa' ? 'اسمت رو بنویس!' : 'Enter your name!');

  roomCode = randomCode();
  myId     = 'p_' + Date.now();
  myName   = name;
  isHost   = true;

  // ساخت اتاق
  const { error: roomErr } = await db.from('rooms').insert({
    id: roomCode,
    host_id: myId,
    status: 'waiting',
    current_player_index: 0,
    round: 1,
    current_card: null
  });

  if (roomErr) return showToast('خطا در ساخت اتاق!');

  // اضافه کردن هاست
  await db.from('players').insert({
    id: myId,
    room_id: roomCode,
    name,
    is_host: true
  });

  document.getElementById('display-code').textContent = roomCode;
  document.getElementById('btn-start').style.display = 'block';
  showScreen('screen-waiting');
  listenRoom();
});

// ─── ورود به اتاق ────────────────────────────────────────────

document.getElementById('btn-join').addEventListener('click', async () => {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!name) return showToast(lang() === 'fa' ? 'اسمت رو بنویس!' : 'Enter your name!');
  if (!code)  return showToast(lang() === 'fa' ? 'کد اتاق رو بنویس!' : 'Enter room code!');

  const { data: room, error } = await db.from('rooms').select('*').eq('id', code).single();
  if (error || !room) return showToast(lang() === 'fa' ? 'اتاق پیدا نشد!' : 'Room not found!');
  if (room.status !== 'waiting') return showToast(lang() === 'fa' ? 'بازی شروع شده!' : 'Game already started!');

  myId     = 'p_' + Date.now();
  myName   = name;
  roomCode = code;
  isHost   = false;

  await db.from('players').insert({
    id: myId,
    room_id: code,
    name,
    is_host: false
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

// ─── شروع بازی ───────────────────────────────────────────────

document.getElementById('btn-start').addEventListener('click', async () => {
  const { data: players } = await db.from('players').select('*').eq('room_id', roomCode);
  if (!players || players.length < 2) {
    return showToast(lang() === 'fa' ? 'حداقل ۲ نفر لازمه!' : 'Need at least 2 players!');
  }
  await db.from('rooms').update({ status: 'playing' }).eq('id', roomCode);
});

// ─── گوش دادن به تغییرات realtime ────────────────────────────

function listenRoom() {
  if (realtimeCh) db.removeChannel(realtimeCh);

  realtimeCh = db.channel('room_' + roomCode)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomCode}`
    }, async (payload) => {
      const room = payload.new;
      if (room.status === 'playing') {
        const { data: players } = await db.from('players').select('*').eq('room_id', roomCode).order('joined_at');
        showScreen('screen-game');
        updateGameScreen(room, players);
      }
      if (room.status === 'waiting') {
        const { data: players } = await db.from('players').select('*').eq('room_id', roomCode).order('joined_at');
        renderPlayers(players || []);
      }
      if (room.status === 'ended') {
        showScreen('screen-end');
      }
    })
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomCode}`
    }, async () => {
      const { data: players } = await db.from('players').select('*').eq('room_id', roomCode).order('joined_at');
      renderPlayers(players || []);
    })
    .subscribe();
}

// ─── آپدیت صفحه بازی ─────────────────────────────────────────

function updateGameScreen(room, players) {
  if (!players || players.length === 0) return;

  const idx       = room.current_player_index % players.length;
  const curPlayer = players[idx];
  const isMyTurn  = curPlayer.id === myId;
  const l         = lang();

  document.getElementById('current-player-name').textContent = curPlayer.name;
  document.getElementById('round-num').textContent = room.round || 1;

  if (room.current_card) {
    document.getElementById('choice-screen').style.display = 'none';
    document.getElementById('card-screen').style.display   = 'block';

    const card     = document.getElementById('game-card');
    const badge    = document.getElementById('card-type-badge');
    const cardText = document.getElementById('card-text');
    const type     = room.current_card.type;

    card.className = 'game-card ' + type;
    badge.textContent = type === 'truth'
      ? (l === 'fa' ? '🤔 حقیقت' : '🤔 Truth')
      : (l === 'fa' ? '😈 جرأت'  : '😈 Dare');
    cardText.textContent = room.current_card.text;

    document.getElementById('btn-next').style.display = isHost ? 'block' : 'none';
  } else {
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
  await db.from('rooms').update({
    current_card: { type: 'truth', text: randomQuestion('truth') }
  }).eq('id', roomCode);
});

// ─── انتخاب جرأت ─────────────────────────────────────────────

document.getElementById('btn-dare').addEventListener('click', async () => {
  await db.from('rooms').update({
    current_card: { type: 'dare', text: randomQuestion('dare') }
  }).eq('id', roomCode);
});

// ─── نفر بعدی ────────────────────────────────────────────────

document.getElementById('btn-next').addEventListener('click', async () => {
  const { data: room }    = await db.from('rooms').select('*').eq('id', roomCode).single();
  const { data: players } = await db.from('players').select('*').eq('room_id', roomCode).order('joined_at');

  const nextIdx   = (room.current_player_index + 1) % players.length;
  const nextRound = nextIdx === 0 ? room.round + 1 : room.round;

  if (nextRound > 5) {
    await db.from('rooms').update({ status: 'ended' }).eq('id', roomCode);
  } else {
    await db.from('rooms').update({
      current_player_index: nextIdx,
      current_card: null,
      round: nextRound
    }).eq('id', roomCode);
  }
});

// ─── شروع مجدد ───────────────────────────────────────────────

document.getElementById('btn-restart').addEventListener('click', async () => {
  if (realtimeCh) db.removeChannel(realtimeCh);
  await db.from('rooms').delete().eq('id', roomCode);
  roomCode = null; myId = null; myName = null; isHost = false;
  showScreen('screen-lobby');
});
