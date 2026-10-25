// Pantalla de selección de niveles (los 4 niveles del guion "Proyecto NOVA").
const LEVELS = [
  {
    id: 'balance', num: '01', name: 'El Balance', accent: '#63d8e6',
    concept: 'Distribución de probabilidad',
    desc: 'El País A y el País B necesitan energía. Repártela con justicia usando la superposición y luego inclínala hacia quien más la necesita.',
    tags: [['q', 'Superposición'], ['q', 'Rotación'], ['s', 'Probabilidad']],
    gates: 'H · Ry', difficulty: 1,
    chapter: null, start: () => startLevel1(),
  },
  {
    id: 'sintonia', num: '02', name: 'La Sintonía', accent: '#3ee08f',
    concept: 'Correlación y Entrelazamiento',
    desc: 'Dos balizas espaciales deben coordinar sus decisiones de emergencia a distancia. Entrelázalas con CNOT para sincronizarlas al 100%.',
    tags: [['q', 'CNOT'], ['q', 'Entrelazamiento'], ['s', 'Correlación']],
    gates: 'H · CNOT · X', difficulty: 2,
    chapter: null, start: () => startLevelSintonia(),
  },
  {
    id: 'despliegue', num: '03', name: 'El Despliegue', accent: '#ffd36e',
    concept: 'Similitud cuántica y KNN',
    desc: 'Hay escuadrones sin diagnóstico. Mide qué tan parecidos son a operarios sanos o exhaustos y clasifícalos por mayoría de vecinos.',
    tags: [['q', 'SWAP Test'], ['s', 'Similitud'], ['m', 'K vecinos']],
    gates: 'H · CSWAP', difficulty: 2,
    chapter: null, start: () => startLevel2(),
  },
  {
    id: 'cosecha', num: '04', name: 'La Cosecha', accent: '#a98bff',
    concept: 'Clasificador variacional cuántico',
    desc: 'Los arándanos sanos y dañados están mezclados en espirales. Construye una red neuronal cuántica y entrénala para separarlos.',
    tags: [['q', 'Entrelazamiento'], ['m', 'Red neuronal'], ['m', 'Entrenamiento']],
    gates: 'Rx · Ry · CNOT', difficulty: 3,
    chapter: null, start: () => startLevel3(),
  },
];

const NOVA_LINES = [
  'Operador, hay cuatro crisis activas. Empecemos por la primera: el País A y el País B se están quedando sin energía.',
  'La energía está balanceada. Ahora necesitamos sincronizar las balizas de comunicación de emergencia con CNOT.',
  'Las balizas están en sintonía. Ahora los equipos de rescate necesitan un diagnóstico táctico con KNN.',
  'Último paso: la cosecha. Necesitamos una red neuronal cuántica... y tú vas a entrenarla.',
  'Misión completa. El sistema Nexus está a salvo. Gracias, Operador.',
];

// ---------- Animaciones de cada tarjeta (SVG) ----------
function visualBalance() {
  const orbs = [0, 1, 2, 3, 4, 5].map(i =>
    `<circle r="4" class="orb"><animateMotion dur="2.4s" begin="${i * 0.4}s" repeatCount="indefinite" path="${i % 2 ? 'M160 24 L160 60 Q160 80 240 96' : 'M160 24 L160 60 Q160 80 80 96'}"/></circle>`).join('');
  const tube = (x, label, values) => {
    const ys = values.split(';').map(h => 156 - h).join(';');
    return `
      <rect x="${x}" y="96" width="40" height="60" rx="6" class="tube"/>
      <rect x="${x + 3}" width="34" rx="4" class="tube-fill">
        <animate attributeName="height" values="${values}" dur="8s" repeatCount="indefinite"/>
        <animate attributeName="y" values="${ys}" dur="8s" repeatCount="indefinite"/>
      </rect>
      <text x="${x + 20}" y="168" class="v-label">PAÍS ${label}</text>`;
  };
  return `
    <path d="M160 24 L160 60 Q160 80 80 96 M160 60 Q160 80 240 96" class="flow"/>
    <circle cx="160" cy="20" r="9" class="source"/>
    <rect x="148" y="50" width="24" height="24" rx="5" class="gate"/><text x="160" y="67" class="gate-t">H</text>
    ${orbs}
    ${tube(60, 'A', '6;28;28;46;46;6')}
    ${tube(220, 'B', '54;28;28;12;12;54')}`;
}

function visualDespliegue() {
  const fixed = [[95, 55, 'apt'], [110, 72, 'apt'], [84, 80, 'apt'], [122, 50, 'apt'],
                 [210, 110, 'tired'], [228, 96, 'tired'], [236, 122, 'tired'], [200, 128, 'tired']];
  const unknown = [[140, 100, 'apt'], [182, 70, 'tired'], [150, 130, 'tired'], [100, 115, 'apt'], [220, 60, 'tired'], [175, 40, 'apt']];
  const col = { apt: '#3ee08f', tired: '#ff5c7a' };
  return `
    <circle cx="160" cy="88" r="28" class="radar"/><circle cx="160" cy="88" r="55" class="radar"/><circle cx="160" cy="88" r="80" class="radar"/>
    <path d="M160 88 L160 8 A80 80 0 0 1 216.6 31.4 Z" class="sweep">
      <animateTransform attributeName="transform" type="rotate" from="0 160 88" to="360 160 88" dur="4s" repeatCount="indefinite"/>
    </path>
    ${fixed.map(([x, y, k]) => `<circle cx="${x}" cy="${y}" r="5" fill="${col[k]}"/>`).join('')}
    ${unknown.map(([x, y, k], i) => `
      <circle cx="${x}" cy="${y}" r="5" fill="#7d86a8">
        <animate attributeName="fill" values="#7d86a8;#7d86a8;${col[k]};${col[k]};#7d86a8" keyTimes="0;${(0.1 + i * 0.1).toFixed(2)};${(0.15 + i * 0.1).toFixed(2)};0.9;1" dur="6s" repeatCount="indefinite"/>
      </circle>`).join('')}`;
}

function visualCosecha() {
  let pts = '';
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2;
    pts += `<circle cx="${(160 + Math.cos(a) * 22).toFixed(1)}" cy="${(88 + Math.sin(a) * 20).toFixed(1)}" r="4.5" fill="#ff5c7a"/>`;
  }
  for (let i = 0; i < 22; i++) {
    const a = i / 22 * Math.PI * 2 + 0.2, r = 62 + (i % 3) * 8;
    pts += `<circle cx="${(160 + Math.cos(a) * r * 1.3).toFixed(1)}" cy="${(88 + Math.sin(a) * r * 0.95).toFixed(1)}" r="4.5" fill="#4f9dff"/>`;
  }
  return `
    ${pts}
    <ellipse cx="160" cy="88" class="boundary">
      <animate attributeName="rx" values="170;170;44;44;170" keyTimes="0;0.2;0.55;0.9;1" dur="7s" repeatCount="indefinite"/>
      <animate attributeName="ry" values="1;1;40;40;1" keyTimes="0;0.2;0.55;0.9;1" dur="7s" repeatCount="indefinite"/>
    </ellipse>`;
}
function visualSintonia() {
  const pulses = [0, 1, 2].map(i =>
    `<circle r="5" fill="#3ee08f" opacity="0.9">
      <animateMotion dur="2.4s" begin="${i * 0.8}s" repeatCount="indefinite" path="M80 88 C130 46 190 130 240 88 C190 46 130 130 80 88"/>
    </circle>`).join('');
  return `
    <line x1="80" y1="88" x2="240" y2="88" stroke="rgba(62,224,143,0.3)" stroke-width="2" stroke-dasharray="4 4"/>
    <path d="M80 88 C130 46 190 130 240 88 C190 46 130 130 80 88" fill="none" stroke="#3ee08f" stroke-width="2" opacity="0.5"/>
    ${pulses}
    <g transform="translate(80 88)">
      <circle r="22" fill="none" stroke="#3ee08f" stroke-width="1.5" opacity="0.4"><animate attributeName="r" values="16;25;16" dur="2.2s" repeatCount="indefinite"/></circle>
      <circle r="14" fill="#071a24" stroke="#3ee08f" stroke-width="2"/>
      <text y="4" fill="#3ee08f" font-family="'Space Mono', monospace" font-size="10" font-weight="700" text-anchor="middle">q₀</text>
      <text y="30" fill="#8e99c4" font-family="'Space Mono', monospace" font-size="9" font-weight="700" text-anchor="middle">ALFA</text>
    </g>
    <g transform="translate(240 88)">
      <circle r="22" fill="none" stroke="#3ee08f" stroke-width="1.5" opacity="0.4"><animate attributeName="r" values="25;16;25" dur="2.2s" repeatCount="indefinite"/></circle>
      <circle r="14" fill="#071a24" stroke="#3ee08f" stroke-width="2"/>
      <text y="4" fill="#3ee08f" font-family="'Space Mono', monospace" font-size="10" font-weight="700" text-anchor="middle">q₁</text>
      <text y="30" fill="#8e99c4" font-family="'Space Mono', monospace" font-size="9" font-weight="700" text-anchor="middle">BETA</text>
    </g>
    <g transform="translate(160 88)">
      <circle r="12" fill="#0b1736" stroke="#ffd36e" stroke-width="1.8"/>
      <path d="M-6 0 H6 M0 -6 V6" stroke="#ffd36e" stroke-width="2"/>
    </g>`;
}

const VISUALS = { balance: visualBalance, sintonia: visualSintonia, despliegue: visualDespliegue, cosecha: visualCosecha };

// ---------- Render ----------
function levelStars(lv) {
  return progress[lv.id] || (lv.chapter != null ? progress[CHAPTERS[lv.chapter].id] || 0 : 0);
}

function renderLevels() {
  const stars = LEVELS.map(levelStars);
  const done = stars.filter(Boolean).length;
  $('#lv-done').textContent = done;
  const lvTotal = $('#lv-total');
  if (lvTotal) lvTotal.textContent = LEVELS.length;
  $('#stars-count').textContent = stars.reduce((a, b) => a + b, 0);
  const starsTotal = $('#stars-total');
  if (starsTotal) starsTotal.textContent = LEVELS.length * 3;
  $('#map-bubble').textContent = NOVA_LINES[done] || NOVA_LINES[NOVA_LINES.length - 1];

  const starSVG = on => `<svg viewBox="0 0 24 24" class="${on ? 'on' : ''}"><path d="M12 2 L14.6 8.6 L21.5 9.2 L16.2 13.8 L17.8 20.6 L12 17 L6.2 20.6 L7.8 13.8 L2.5 9.2 L9.4 8.6 Z"/></svg>`;
  $('#planet-grid').innerHTML = LEVELS.map((lv, i) => {
    const locked = !FREE_MODE && i > 0 && !stars[i - 1];
    const state = stars[i] ? 'done' : locked ? 'locked' : 'open';
    const stateText = { done: 'COMPLETADO', locked: 'BLOQUEADO', open: 'DISPONIBLE' }[state];
    return `
      <article class="level-card state-${state}" data-i="${i}" style="--accent:${lv.accent}; animation-delay:${0.1 + i * 0.12}s">
        <div class="lv-visual">
          <svg viewBox="0 0 320 176">${VISUALS[lv.id]()}</svg>
          ${locked ? `<div class="lv-lock"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11 V7 A4 4 0 0 1 16 7 V11"/></svg><span>Completa el nivel ${LEVELS[i - 1].num}</span></div>` : ''}
        </div>
        <div class="lv-info">
          <div class="lv-top"><span class="lv-num">NIVEL ${lv.num}</span><span class="lv-state">${stateText}</span></div>
          <h3>${lv.name}</h3>
          <p class="lv-concept">${lv.concept}</p>
          <p class="lv-desc">${lv.desc}</p>
          <div class="lv-tags">${lv.tags.map(([k, t]) => `<span class="tag-${k}">${t}</span>`).join('')}</div>
          <div class="lv-meta">
            <div><small>COMPUERTAS</small><b>${lv.gates}</b></div>
            <div><small>DIFICULTAD</small><span class="diff">${[1, 2, 3].map(d => `<i class="${d <= lv.difficulty ? 'on' : ''}"></i>`).join('')}</span></div>
          </div>
          <div class="lv-foot">
            <span class="lv-stars">${[1, 2, 3].map(s => starSVG(s <= stars[i])).join('')}</span>
            <button class="lv-btn" data-i="${i}" ${locked ? 'disabled' : ''}>
              ${state === 'done' ? 'REPETIR' : 'INICIAR'}
              <svg viewBox="0 0 24 24"><path d="M4 12 H19 M13 6 L19 12 L13 18"/></svg>
            </button>
          </div>
        </div>
      </article>`;
  }).join('');

  $$('#planet-grid .level-card:not(.state-locked)').forEach(card => {
    card.style.cursor = 'pointer';
    card.onclick = () => {
      const lv = LEVELS[+card.dataset.i];
      if (!lv) return;
      if (lv.start) return lv.start();
      if (lv.chapter == null) return toast(`El nivel ${lv.num} se está construyendo`);
      startChapter(lv.chapter);
    };
  });

  // Renderizar o actualizar tarjeta del Desafío Contrarreloj (Sin NOVA ni ayudas)
  renderChallengeCard(done >= LEVELS.length);
}

// ---------------------------------------------------------------- MODO DESAFÍO Y LEADERBOARD
const CHALLENGE_ORDER = [
  () => startLevel1(),
  () => startLevelSintonia(),
  () => startLevel2(),
  () => startLevel3()
];

let challengeCurrentIndex = 0;
let challengeLevelTimes = [];
let challengeRunTotalSeconds = 0;

window.CHALLENGE_MODE = false;

function renderChallengeCard(unlocked) {
  let card = $('#challenge-card-container');
  if (!card) {
    card = document.createElement('div');
    card.id = 'challenge-card-container';
    const grid = $('#planet-grid');
    if (grid && grid.parentNode) {
      grid.parentNode.insertBefore(card, grid.nextSibling);
    }
  }
  if (!card) return;

  if (unlocked) {
    card.innerHTML = `
      <section class="challenge-card unlocked">
        <div>
          <span style="font-family:'Space Mono', monospace; font-size:0.7rem; color:#ff5c7a; font-weight:700; letter-spacing:0.2em;">
            [MODO EXTREMO DESBLOQUEADO]
          </span>
          <h3>DESAFÍO CONTRARRELOJ · SIN AYUDAS</h3>
          <p>
            Demuestra tu dominio cuántico total: completa los 4 niveles consecutivos <strong>sin la guía de NOVA, sin pistas y sin diccionario</strong>.
            Cuentas con <strong>1:30 minutos por nivel</strong>. Si el tiempo expira, pierdes. Al terminar podrás ingresar tu correo para quedar en el Leaderboard.
          </p>
        </div>
        <button class="btn-challenge" id="btn-start-challenge">
          INICIAR RETO
        </button>
      </section>
    `;
    const btn = $('#btn-start-challenge');
    if (btn) btn.onclick = () => startChallengeRun();
  } else {
    card.innerHTML = `
      <section class="challenge-card locked">
        <div>
          <span style="font-family:'Space Mono', monospace; font-size:0.7rem; color:#8e99c4; font-weight:700; letter-spacing:0.2em;">
            [MODO EXTREMO BLOQUEADO]
          </span>
          <h3>DESAFÍO CONTRARRELOJ · SIN AYUDAS</h3>
          <p>
            Completa todos los 4 niveles de la campaña principal para desbloquear esta prueba de velocidad sin asistencia de NOVA ni diccionario.
          </p>
        </div>
        <button class="btn-challenge" disabled>
          BLOQUEADO
        </button>
      </section>
    `;
  }
}

function startChallengeRun() {
  window.CHALLENGE_MODE = true;
  document.body.classList.add('challenge-mode');
  challengeCurrentIndex = 0;
  challengeLevelTimes = [];
  challengeRunTotalSeconds = 0;
  startChallengeCurrentLevel();
}

function startChallengeCurrentLevel() {
  if (challengeCurrentIndex >= CHALLENGE_ORDER.length) {
    finishChallengeRun();
    return;
  }
  const launcher = CHALLENGE_ORDER[challengeCurrentIndex];
  if (typeof launcher === 'function') {
    launcher();
  }
}

// Handler llamado cuando el temporizador de 1:30 llega a 0
window.onChallengeTimeout = function() {
  if (!window.CHALLENGE_MODE) return;
  // Detener sonidos ambiente y timers activos
  Kit.ambient(false);
  Kit.sfx('error');
  // Ocultar modales de victoria o niveles
  $$('.modal.open').forEach(m => m.classList.remove('open'));
  // Mostrar modal de Game Over por tiempo agotado
  const failModal = $('#modal-challenge-fail');
  if (failModal) failModal.classList.add('open');
};

// Handler llamado cuando se gana un nivel dentro del modo desafío
window.onChallengeLevelWin = function(elapsedSeconds) {
  if (!window.CHALLENGE_MODE) return false;
  challengeLevelTimes.push(elapsedSeconds || 0);
  challengeRunTotalSeconds += (elapsedSeconds || 0);
  
  challengeCurrentIndex++;
  if (challengeCurrentIndex < CHALLENGE_ORDER.length) {
    // Pasar inmediatamente al siguiente nivel
    toast(`Nivel superado en ${elapsedSeconds}s. Siguiente nivel...`);
    setTimeout(() => {
      startChallengeCurrentLevel();
    }, 600);
  } else {
    // Reto completado con éxito
    finishChallengeRun();
  }
  return true;
};

function exitChallengeMode() {
  window.CHALLENGE_MODE = false;
  document.body.classList.remove('challenge-mode');
  renderLevels();
}

function finishChallengeRun() {
  Kit.sfx('win');
  const winModal = $('#modal-challenge-win');
  const mins = Math.floor(challengeRunTotalSeconds / 60);
  const secs = Math.floor(challengeRunTotalSeconds % 60);
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  
  const display = $('#challenge-total-display');
  if (display) display.textContent = timeFormatted;
  
  if (winModal) winModal.classList.add('open');
}

// Botones de modales del reto
const btnRetryLevel = $('#btn-challenge-retry-level');
if (btnRetryLevel) {
  btnRetryLevel.onclick = () => {
    $('#modal-challenge-fail').classList.remove('open');
    startChallengeCurrentLevel();
  };
}

const btnExitFail = $('#btn-challenge-exit-map');
if (btnExitFail) {
  btnExitFail.onclick = () => {
    $('#modal-challenge-fail').classList.remove('open');
    exitChallengeMode();
    show('screen-map');
  };
}

const btnSkipSubmit = $('#btn-challenge-skip-submit');
if (btnSkipSubmit) {
  btnSkipSubmit.onclick = () => {
    $('#modal-challenge-win').classList.remove('open');
    exitChallengeMode();
    show('screen-map');
  };
}

const btnSubmitEmail = $('#btn-challenge-submit-email');
if (btnSubmitEmail) {
  btnSubmitEmail.onclick = async () => {
    const input = $('#challenge-email-input');
    const email = input ? input.value.trim() : '';
    if (!email || !email.includes('@') || !email.includes('.')) {
      toast('Por favor ingresa un correo válido');
      return;
    }
    btnSubmitEmail.disabled = true;
    try {
      await api('/api/leaderboard', { email, total_seconds: challengeRunTotalSeconds });
      toast('¡Tiempo registrado con éxito en el Leaderboard!');
      $('#modal-challenge-win').classList.remove('open');
      exitChallengeMode();
      show('screen-map');
      openLeaderboard();
    } catch (e) {
      toast('Error al guardar: ' + e.message);
    } finally {
      btnSubmitEmail.disabled = false;
    }
  };
}

// Leaderboard Modal
async function openLeaderboard() {
  const modal = $('#modal-leaderboard');
  const tbody = $('#leaderboard-body');
  if (!modal || !tbody) return;
  modal.classList.add('open');
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#8e99c4;">Cargando clasificaciones...</td></tr>';
  try {
    const entries = await api('/api/leaderboard');
    if (!entries || !entries.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#8e99c4;">Aún no hay puntuaciones registradas. ¡Sé el primero en completar el reto!</td></tr>';
      return;
    }
    tbody.innerHTML = entries.map((e, idx) => `
      <tr style="border-bottom: 1px solid rgba(142, 153, 196, 0.15); ${idx === 0 ? 'background:rgba(255,211,110,0.08); font-weight:bold; color:#ffd36e;' : ''}">
        <td style="padding: 10px 14px;">${idx + 1 === 1 ? '🥇' : idx + 1 === 2 ? '🥈' : idx + 1 === 3 ? '🥉' : idx + 1}</td>
        <td style="padding: 10px 14px; color:#e9edf7;">${e.email}</td>
        <td style="padding: 10px 14px; text-align: right; color:#3ee08f; font-weight:700;">${e.time || '--:--'}</td>
        <td style="padding: 10px 14px; text-align: right; color:#8e99c4; font-size:0.75rem;">${e.date || ''}</td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#ff5c7a;">Error al cargar leaderboard: ${err.message}</td></tr>`;
  }
}

// ---------------------------------------------------------------- RETOS DE LA COMUNIDAD
window.COMMUNITY_CHALLENGE = null;

const THEME_NAMES = {
  balance: 'NIVEL 1 · EL BALANCE',
  sintonia: 'NIVEL 2 · LA SINTONÍA',
  despliegue: 'NIVEL 3 · EL DESPLIEGUE',
  cosecha: 'NIVEL 4 · LA COSECHA'
};

const THEME_ACCENTS = {
  balance: '#63d8e6',
  sintonia: '#3ee08f',
  despliegue: '#ffd36e',
  cosecha: '#a98bff'
};

async function loadCommunityChallenges() {
  const listEl = $('#community-list');
  if (!listEl) return;
  listEl.innerHTML = '<div style="text-align:center; padding:30px; color:#8e99c4;">Cargando retos de la comunidad...</div>';
  try {
    const challenges = await api('/api/community');
    if (!challenges || !challenges.length) {
      listEl.innerHTML = '<div style="text-align:center; padding:30px; color:#8e99c4;">No hay retos disponibles aún. ¡Crea el primero!</div>';
      return;
    }
    listEl.innerHTML = challenges.map((ch, idx) => {
      const accent = THEME_ACCENTS[ch.theme] || '#63d8e6';
      const themeLabel = THEME_NAMES[ch.theme] || ch.theme.toUpperCase();
      return `
        <div class="community-challenge-card" data-idx="${idx}" style="background:rgba(10,18,44,0.7); border:1px solid rgba(142,153,196,0.25); border-left:4px solid ${accent}; border-radius:8px; padding:14px 16px; display:flex; flex-direction:column; gap:8px; transition:border-color 0.2s, background 0.2s;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-family:'Space Mono', monospace; font-size:0.7rem; color:${accent}; background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:4px; font-weight:700;">
                ${themeLabel}
              </span>
              <h4 style="margin:0; font-family:'Anton', sans-serif; font-size:1.15rem; color:#fff; letter-spacing:0.04em;">
                ${ch.title}
              </h4>
            </div>
            <span style="font-family:'Space Mono', monospace; font-size:0.72rem; color:#8e99c4;">
              Por: <b style="color:#ffd36e;">${ch.author || 'Anónimo'}</b>
            </span>
          </div>
          <p style="margin:0; font-size:0.86rem; color:#cbd5f0; line-height:1.45;">
            ${ch.context}
          </p>
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-top:4px; padding-top:8px; border-top:1px dashed rgba(142,153,196,0.2);">
            <div style="font-family:'Space Mono', monospace; font-size:0.75rem; color:#ffd36e; display:flex; align-items:center; gap:6px;">
              <span>🎯 META:</span>
              <span style="color:#fff;">${ch.target_desc || 'Objetivo cuántico del escenario'}</span>
            </div>
            <button class="lv-btn btn-play-community" data-id="${ch.id}" style="--accent:${accent}; padding:6px 14px; font-size:0.75rem;">
              JUGAR RETO
              <svg viewBox="0 0 24 24" style="width:14px; height:14px; margin-left:4px;"><path d="M4 12 H19 M13 6 L19 12 L13 18"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-play-community').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const ch = challenges.find(c => c.id === id);
        if (ch) launchCommunityChallenge(ch);
      };
    });
  } catch (err) {
    listEl.innerHTML = `<div style="text-align:center; padding:30px; color:#ff5c7a;">Error al cargar retos: ${err.message}</div>`;
  }
}

function launchCommunityChallenge(ch) {
  window.COMMUNITY_CHALLENGE = ch;
  // Cerrar modal
  const modal = $('#modal-community');
  if (modal) modal.classList.remove('open');

  // Configurar banner HUD flotante
  const banner = $('#hud-community-banner');
  const title = $('#hud-community-title');
  const goal = $('#hud-community-goal');
  if (banner && title && goal) {
    title.textContent = ch.title;
    goal.textContent = ch.target_desc;
    banner.style.display = 'flex';
  }

  toast(`Iniciando Reto de la Comunidad: ${ch.title}`);

  // Iniciar el nivel correspondiente al tema
  if (ch.theme === 'balance') {
    startLevel1();
  } else if (ch.theme === 'sintonia') {
    startLevelSintonia();
  } else if (ch.theme === 'despliegue') {
    startLevel2();
  } else if (ch.theme === 'cosecha') {
    startLevel3();
  } else {
    startLevel1();
  }
}

function exitCommunityChallenge() {
  window.COMMUNITY_CHALLENGE = null;
  const banner = $('#hud-community-banner');
  if (banner) banner.style.display = 'none';
  toast('Has salido del Reto de la Comunidad');
  renderMap();
  show('screen-map');
}

// Botón de salir del banner
const btnExitCommunity = $('#btn-exit-community-run');
if (btnExitCommunity) btnExitCommunity.onclick = exitCommunityChallenge;

// Botón de abrir retos de la comunidad en el header de misiones
const btnCommunity = $('#btn-community');
if (btnCommunity) {
  btnCommunity.onclick = () => {
    const modal = $('#modal-community');
    if (modal) {
      modal.classList.add('open');
      loadCommunityChallenges();
    }
  };
}

// Botón para abrir el formulario de creación de reto
const btnOpenCreate = $('#btn-open-create-challenge');
const modalCreate = $('#modal-create-challenge');
const modalCommunity = $('#modal-community');

if (btnOpenCreate && modalCreate) {
  btnOpenCreate.onclick = () => {
    if (modalCommunity) modalCommunity.classList.remove('open');
    modalCreate.classList.add('open');
    updateTargetValGroup();
  };
}

const btnCloseCreate = $('#btn-close-create-challenge');
if (btnCloseCreate && modalCreate) {
  btnCloseCreate.onclick = () => {
    modalCreate.classList.remove('open');
    if (modalCommunity) modalCommunity.classList.add('open');
  };
}

const btnCancelCreate = $('#btn-cancel-create-challenge');
if (btnCancelCreate && modalCreate) {
  btnCancelCreate.onclick = () => {
    modalCreate.classList.remove('open');
    if (modalCommunity) modalCommunity.classList.add('open');
  };
}

// Mostrar o no el campo de valor objetivo según el tema
const themeSelect = $('#new-challenge-theme');
const targetValGroup = $('#target-val-group');
const targetValLabel = $('#target-val-label');

function updateTargetValGroup() {
  if (!themeSelect || !targetValGroup) return;
  const t = themeSelect.value;
  if (t === 'balance') {
    targetValGroup.style.display = 'block';
    if (targetValLabel) targetValLabel.textContent = 'PROBABILIDAD OBJETIVO P(A) (0.1 a 0.9):';
  } else {
    targetValGroup.style.display = 'none';
  }
}

if (themeSelect) {
  themeSelect.onchange = updateTargetValGroup;
}

// Enviar formulario de nuevo reto
const formCreateChallenge = $('#form-create-challenge');
if (formCreateChallenge) {
  formCreateChallenge.onsubmit = async (e) => {
    e.preventDefault();
    const theme = $('#new-challenge-theme').value;
    const title = $('#new-challenge-title').value.trim();
    const author = $('#new-challenge-author').value.trim() || 'Operador Anónimo';
    const context = $('#new-challenge-context').value.trim();
    const target_desc = $('#new-challenge-target-desc').value.trim();
    const target_val_input = $('#new-challenge-target-val');
    const target_val = (theme === 'balance' && target_val_input) ? parseFloat(target_val_input.value) : null;

    if (!title || !context || !target_desc) {
      toast('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      await api('/api/community', {
        theme,
        title,
        author,
        context,
        target_desc,
        target_val
      });
      toast('¡Reto publicado con éxito!');
      if (modalCreate) modalCreate.classList.remove('open');
      if (modalCommunity) {
        modalCommunity.classList.add('open');
        loadCommunityChallenges();
      }
      formCreateChallenge.reset();
      updateTargetValGroup();
    } catch (err) {
      toast('Error al publicar: ' + err.message);
    }
  };
}

const btnLeaderboard = $('#btn-leaderboard');
if (btnLeaderboard) {
  btnLeaderboard.onclick = openLeaderboard;
}

const btnHome = document.getElementById('btn-home');
if (btnHome) btnHome.onclick = () => {
  if (window.CHALLENGE_MODE) exitChallengeMode();
  if (window.COMMUNITY_CHALLENGE) exitCommunityChallenge();
  show('screen-title');
};
const btnSeeBriefing = document.getElementById('btn-see-briefing');
if (btnSeeBriefing) btnSeeBriefing.onclick = () => show('screen-briefing');

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderLevels);
} else {
  renderLevels();
}

