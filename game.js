// ─── Supabase Config ──────────────────────────────────────────
const SUPABASE_URL = 'https://ebbcasasjtrjdvzpgowm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYmNhc2FzanRyamR2enBnb3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTUzMzgsImV4cCI6MjA5Njk5MTMzOH0.0gHyInkGeWgBRsjFc6NijhKpJ4NF1p1oH4W6VFkTlQI';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── سوال‌های بازی ────────────────────────────────────────────
const questions = {
  truth: {
    fa: [
      "آخرین باری که دروغ گفتی کِی بود؟","بزرگ‌ترین ترست چیه؟",
      "کدوم راز رو هنوز به کسی نگفتی؟","بدترین کاری که تا حالا کردی چی بود؟",
      "اگه می‌تونستی یه چیز از گذشته‌ات رو عوض کنی چی بود؟",
      "به کی بیشتر از همه اعتماد داری؟","تا حالا به یه دوست خیانت کردی؟",
      "عجیب‌ترین رویایی که دیدی چی بود؟","آخرین باری که گریه کردی چرا بود؟",
      "چه کاری رو می‌کنی که از اون خجالت می‌کشی؟",
    ],
    en: [
      "When was the last time you lied?","What is your biggest fear?",
      "What secret have you never told anyone?","What's the worst thing you've ever done?",
      "If you could change one thing about your past, what would it be?",
      "Who do you trust the most?","Have you ever betrayed a friend?",
      "What's the strangest dream you've ever had?","Why did you last cry?",
      "What's something you do that you're ashamed of?",
    ]
  },
  dare: {
    fa: [
      "یه آهنگ بخون تا همه بشنون!","۱۰ تا اسکوات برو!",
      "یه عکس خنده‌دار از خودت بگیر و توی گروه بفرست!",
      "بدون مکث ۳۰ ثانیه بخند!","یه رقص کوتاه برقص و فیلم بگیر!",
      "یه جوک بگو که همه بخندن!","صدای یه حیوان رو در بیار!",
      "با صدای بلند بگو دوستت داری به یکی از اعضای گروه!",
      "یه سلفی با حالت عجیب بگیر و بفرست!","۵ تا بارفیکس برو!",
    ],
    en: [
      "Sing a song out loud!","Do 10 squats!",
      "Take a funny selfie and share it!","Laugh nonstop for 30 seconds!",
      "Do a short dance and record it!","Tell a joke that makes everyone laugh!",
      "Imitate an animal sound!","Loudly say I love you to one of the group members!",
      "Take a weird selfie and share it!","Do 5 pull-ups!",
    ]
  }
};

// ─── وضعیت ───────────────────────────────────────────────────
let roomCode = null, myId = null, myName = null, isHost = false;
let timerInterval = null, realtimeCh = null;
const TIMER_TRUTH = 60, TIMER_DARE = 90, SKIP_PENALTY = -1, DONE_POINTS = 3, VOTE_POINTS = 1;
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

function randomCode() { return Math.random().toString(36).substring(2,8).toUpperCase(); }
function randomQuestion(type) {
  const list = questions[type][lang()];
  return list[Math.floor(Math.random() * list.length)];
}

function renderPlayers(players) {
  const el = document.getElementById('players-list');
  el.innerHTML = '';
  players.forEach((p, i) => {
    const chip = document.createElement('div');
    chip.className = 'player-chip' + (p.is_host ? ' host-chip' : '');
    chip.innerHTML = `<div class="avatar color-${i%8}">${p.name.charAt(0).toUpperCase()}</div><span>${p.name}${p.is_host?' 👑':''}</span>`;
    el.appendChild(chip);
  });
}

function renderScoreboard(players) {
  const el = document.getElementById('scoreboard');
  if (!el) return;
  const sorted = [...players].sort((a,b) => (b.score||0)-(a.score||0));
  el.innerHTML = sorted.map((p,i) => `
    <div class="score-row ${p.id===myId?'me':''}">
      <span class="score-rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span>
      <span class="score-name">${p.name}</span>
      <span class="score-pts">${p.score||0} ${lang()==='fa'?'امتیاز':'pts'}</span>
    </div>
  `).join('');
}

// ─── تایمر ───────────────────────────────────────────────────
function startTimer(seconds) {
  clearInterval(timerInterval);
  const bar = document.getElementById('timer-bar');
  const txt = document.getElementById('timer-text');
  const total = seconds;
  let left = seconds;

  function tick() {
    if (!bar || !txt) return;
    left--;
    txt.textContent = left + 's';
    bar.style.width = (left / total * 100) + '%';
    bar.style.background = left > 20 ? '#4F8EF7' : left > 10 ? '#F59E0B' : '#E8445A';
    if (left <= 0) {
      clearInterval(timerInterval);
      txt.textContent = lang()==='fa' ? 'تموم شد!' : 'Time\'s up!';
    }
  }

  txt.textContent = seconds + 's';
  bar.style.width = '100%';
  timerInterval = setInterval(tick, 1000);
}

function stopTimer() { clearInterval(timerInterval); }

// ─── چت ──────────────────────────────────────────────────────
async function loadMessages() {
  const { data } = await db.from('messages').select('*').eq('room_id', roomCode).order('created_at');
  renderMessages(data || []);
}

function renderMessages(msgs) {
  const el = document.getElementById('chat-messages');
  if (!el) return;
  el.innerHTML = msgs.map(m => `
    <div class="chat-msg ${m.player_id===myId?'me':''}">
      <span class="chat-name">${m.player_id===myId?(lang()==='fa'?'من':'Me'):m.player_name}</span>
      <span class="chat-text">${m.text}</span>
    </div>
  `).join('');
  el.scrollTop = el.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || !roomCode) return;
  input.value = '';
  await db.from('messages').insert({ room_id: roomCode, player_id: myId, player_name: myName, text });
}

document.getElementById('chat-send')?.addEventListener('click', sendMessage);
document.getElementById('chat-input')?.addEventListener('keydown', e => { if(e.key==='Enter') sendMessage(); });

// ─── ساخت اتاق ───────────────────────────────────────────────
document.getElementById('btn-create').addEventListener('click', async () => {
  const name = document.getElementById('host-name').value.trim();
  if (!name) return showToast(lang()==='fa'?'اسمت رو بنویس!':'Enter your name!');
  roomCode = randomCode(); myId = 'p_'+Date.now(); myName = name; isHost = true;

  const { error } = await db.from('rooms').insert({
    id: roomCode, host_id: myId, status: 'waiting',
    current_player_index: 0, round: 1, current_card: null
  });
  if (error) return showToast('خطا در ساخت اتاق!');

  await db.from('players').insert({ id: myId, room_id: roomCode, name, is_host: true, score: 0 });
  document.getElementById('display-code').textContent = roomCode;
  document.getElementById('btn-start').style.display = 'block';
  showScreen('screen-waiting');
  listenRoom();
});

// ─── ورود به اتاق ────────────────────────────────────────────
document.getElementById('btn-join').addEventListener('click', async () => {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!name) return showToast(lang()==='fa'?'اسمت رو بنویس!':'Enter your name!');
  if (!code)  return showToast(lang()==='fa'?'کد اتاق رو بنویس!':'Enter room code!');

  const { data: room, error } = await db.from('rooms').select('*').eq('id', code).single();
  if (error||!room) return showToast(lang()==='fa'?'اتاق پیدا نشد!':'Room not found!');
  if (room.status !== 'waiting') return showToast(lang()==='fa'?'بازی شروع شده!':'Game already started!');

  myId = 'p_'+Date.now(); myName = name; roomCode = code; isHost = false;
  await db.from('players').insert({ id: myId, room_id: code, name, is_host: false, score: 0 });
  document.getElementById('display-code').textContent = code;
  document.getElementById('btn-start').style.display = 'none';
  showScreen('screen-waiting');
  listenRoom();
});

document.getElementById('btn-copy').addEventListener('click', () => {
  navigator.clipboard.writeText(roomCode).then(() => showToast(lang()==='fa'?'کد کپی شد!':'Code copied!'));
});

document.getElementById('btn-start').addEventListener('click', async () => {
  const { data: players } = await db.from('players').select('*').eq('room_id', roomCode);
  if (!players || players.length < 2) return showToast(lang()==='fa'?'حداقل ۲ نفر لازمه!':'Need at least 2 players!');
  await db.from('rooms').update({ status: 'playing' }).eq('id', roomCode);
});

// ─── Realtime ────────────────────────────────────────────────
function listenRoom() {
  if (realtimeCh) db.removeChannel(realtimeCh);

  realtimeCh = db.channel('room_'+roomCode)
    .on('postgres_changes', { event:'*', schema:'public', table:'rooms', filter:`id=eq.${roomCode}` }, async (payload) => {
      const room = payload.new;
      const { data: players } = await db.from('players').select('*').eq('room_id', roomCode).order('joined_at');
      if (room.status === 'waiting') { renderPlayers(players||[]); }
      if (room.status === 'playing') { showScreen('screen-game'); updateGameScreen(room, players||[]); loadMessages(); }
      if (room.status === 'ended')   { showEndScreen(players||[]); }
    })
    .on('postgres_changes', { event:'*', schema:'public', table:'players', filter:`room_id=eq.${roomCode}` }, async () => {
      const { data: players } = await db.from('players').select('*').eq('room_id', roomCode).order('joined_at');
      renderPlayers(players||[]);
      renderScoreboard(players||[]);
    })
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'messages', filter:`room_id=eq.${roomCode}` }, async () => {
      loadMessages();
    })
    .subscribe();
}

// ─── صفحه بازی ───────────────────────────────────────────────
function updateGameScreen(room, players) {
  if (!players.length) return;
  const idx = room.current_player_index % players.length;
  const curPlayer = players[idx];
  const isMyTurn = curPlayer.id === myId;
  const l = lang();

  document.getElementById('current-player-name').textContent = curPlayer.name;
  document.getElementById('round-num').textContent = room.round || 1;
  renderScoreboard(players);

  if (room.current_card) {
    document.getElementById('choice-screen').style.display = 'none';
    document.getElementById('card-screen').style.display = 'block';

    const card = document.getElementById('game-card');
    const type = room.current_card.type;
    card.className = 'game-card ' + type;
    document.getElementById('card-type-badge').textContent = type==='truth' ? (l==='fa'?'🤔 حقیقت':'🤔 Truth') : (l==='fa'?'😈 جرأت':'😈 Dare');
    document.getElementById('card-text').textContent = room.current_card.text;

    // نمایش وضعیت جواب
    const statusEl = document.getElementById('answer-status');
    if (room.current_card.answered) {
      statusEl.textContent = l==='fa' ? `✅ ${room.current_card.answered_by} جواب داد` : `✅ ${room.current_card.answered_by} answered`;
      statusEl.className = 'answer-status done';
    } else if (room.current_card.skipped) {
      statusEl.textContent = l==='fa' ? `⏭️ سوال رد شد` : '⏭️ Skipped';
      statusEl.className = 'answer-status skipped';
    } else {
      statusEl.textContent = l==='fa' ? '⏳ منتظر جواب...' : '⏳ Waiting for answer...';
      statusEl.className = 'answer-status waiting';
    }

    // دکمه‌های عملیات — فقط بازیکن نوبتی
    const actionsEl = document.getElementById('card-actions');
    if (isMyTurn && !room.current_card.answered && !room.current_card.skipped) {
      actionsEl.style.display = 'flex';
    } else {
      actionsEl.style.display = 'none';
    }

    // دکمه تایید رای بقیه (هاست)
    const voteEl = document.getElementById('vote-actions');
    if (isHost && room.current_card.answered && !room.current_card.vote_done) {
      voteEl.style.display = 'flex';
    } else {
      voteEl.style.display = 'none';
    }

    // دکمه نفر بعدی (هاست)
    const nextEl = document.getElementById('btn-next');
    if (isHost && (room.current_card.answered || room.current_card.skipped) && room.current_card.vote_done) {
      nextEl.style.display = 'block';
    } else if (isHost && room.current_card.skipped) {
      nextEl.style.display = 'block';
    } else {
      nextEl.style.display = 'none';
    }

    // شروع تایمر اگه کارت تازه اومده
    if (!room.current_card.answered && !room.current_card.skipped) {
      startTimer(type === 'truth' ? TIMER_TRUTH : TIMER_DARE);
    } else {
      stopTimer();
    }

  } else {
    document.getElementById('choice-screen').style.display = 'block';
    document.getElementById('card-screen').style.display = 'none';
    stopTimer();

    const prompt = document.getElementById('choice-prompt');
    prompt.textContent = isMyTurn
      ? (l==='fa' ? `${curPlayer.name}، انتخاب کن:` : `${curPlayer.name}, choose:`)
      : (l==='fa' ? `نوبت ${curPlayer.name}ه...` : `It's ${curPlayer.name}'s turn...`);

    document.getElementById('btn-truth').disabled = !isMyTurn;
    document.getElementById('btn-dare').disabled  = !isMyTurn;
  }
}

// ─── انتخاب حقیقت/جرأت ───────────────────────────────────────
document.getElementById('btn-truth').addEventListener('click', async () => {
  await db.from('rooms').update({ current_card: { type:'truth', text: randomQuestion('truth'), answered:false, skipped:false, vote_done:false } }).eq('id', roomCode);
});

document.getElementById('btn-dare').addEventListener('click', async () => {
  await db.from('rooms').update({ current_card: { type:'dare', text: randomQuestion('dare'), answered:false, skipped:false, vote_done:false } }).eq('id', roomCode);
});

// ─── انجام دادم ──────────────────────────────────────────────
document.getElementById('btn-done').addEventListener('click', async () => {
  const { data: room } = await db.from('rooms').select('current_card').eq('id', roomCode).single();
  await db.from('rooms').update({
    current_card: { ...room.current_card, answered: true, answered_by: myName, vote_done: false }
  }).eq('id', roomCode);
});

// ─── رد کردن ─────────────────────────────────────────────────
document.getElementById('btn-skip').addEventListener('click', async () => {
  const { data: room } = await db.from('rooms').select('current_card').eq('id', roomCode).single();
  await db.from('rooms').update({
    current_card: { ...room.current_card, skipped: true, vote_done: true }
  }).eq('id', roomCode);
  // کم کردن امتیاز
  const { data: me } = await db.from('players').select('score').eq('id', myId).single();
  await db.from('players').update({ score: (me.score||0) + SKIP_PENALTY }).eq('id', myId);
});

// ─── رای قبول ────────────────────────────────────────────────
document.getElementById('btn-vote-yes').addEventListener('click', async () => {
  const { data: room } = await db.from('rooms').select('current_card').eq('id', roomCode).single();
  // امتیاز به کسی که جواب داد
  const { data: players } = await db.from('players').select('*').eq('room_id', roomCode).order('joined_at');
  const idx = room.current_player_index % players.length;
  const curPlayer = players[idx];
  const pts = room.current_card.type === 'truth' ? DONE_POINTS : DONE_POINTS + 1;
  await db.from('players').update({ score: (curPlayer.score||0) + pts }).eq('id', curPlayer.id);
  await db.from('rooms').update({ current_card: { ...room.current_card, vote_done: true } }).eq('id', roomCode);
});

// ─── رای رد ──────────────────────────────────────────────────
document.getElementById('btn-vote-no').addEventListener('click', async () => {
  const { data: room } = await db.from('rooms').select('current_card').eq('id', roomCode).single();
  await db.from('rooms').update({ current_card: { ...room.current_card, vote_done: true } }).eq('id', roomCode);
});

// ─── نفر بعدی ────────────────────────────────────────────────
document.getElementById('btn-next').addEventListener('click', async () => {
  const { data: room }    = await db.from('rooms').select('*').eq('id', roomCode).single();
  const { data: players } = await db.from('players').select('*').eq('room_id', roomCode).order('joined_at');
  const nextIdx   = (room.current_player_index + 1) % players.length;
  const nextRound = nextIdx === 0 ? room.round + 1 : room.round;
  if (nextRound > 5) {
    await db.from('rooms').update({ status:'ended' }).eq('id', roomCode);
  } else {
    await db.from('rooms').update({ current_player_index: nextIdx, current_card: null, round: nextRound }).eq('id', roomCode);
  }
});

// ─── صفحه پایان ──────────────────────────────────────────────
function showEndScreen(players) {
  showScreen('screen-end');
  const sorted = [...players].sort((a,b) => (b.score||0)-(a.score||0));
  const winner = sorted[0];
  document.getElementById('winner-name').textContent = winner?.name || '---';
  document.getElementById('winner-score').textContent = (winner?.score||0) + (lang()==='fa'?' امتیاز':' pts');

  const list = document.getElementById('final-scores');
  list.innerHTML = sorted.map((p,i) => `
    <div class="score-row ${p.id===myId?'me':''}">
      <span class="score-rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span>
      <span class="score-name">${p.name}</span>
      <span class="score-pts">${p.score||0} ${lang()==='fa'?'امتیاز':'pts'}</span>
    </div>
  `).join('');
}

document.getElementById('btn-restart').addEventListener('click', async () => {
  if (realtimeCh) db.removeChannel(realtimeCh);
  await db.from('rooms').delete().eq('id', roomCode);
  roomCode=null; myId=null; myName=null; isHost=false;
  showScreen('screen-lobby');
});
