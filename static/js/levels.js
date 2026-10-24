// Pantalla de selección de niveles (los 3 niveles del guion "Proyecto NOVA").
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
    id: 'despliegue', num: '02', name: 'El Despliegue', accent: '#ffd36e',
    concept: 'Similitud cuántica y KNN',
    desc: 'Hay escuadrones sin diagnóstico. Mide qué tan parecidos son a operarios sanos o exhaustos y clasifícalos por mayoría de vecinos.',
    tags: [['q', 'SWAP Test'], ['s', 'Similitud'], ['m', 'K vecinos']],
    gates: 'H · CSWAP', difficulty: 2,
    chapter: null, start: () => startLevel2(),
  },
  {
    id: 'cosecha', num: '03', name: 'La Cosecha', accent: '#a98bff',
    concept: 'Clasificador variacional cuántico',
    desc: 'Los arándanos sanos y dañados están mezclados en espirales. Construye una red neuronal cuántica y entrénala para separarlos.',
    tags: [['q', 'Entrelazamiento'], ['m', 'Red neuronal'], ['m', 'Entrenamiento']],
    gates: 'Rx · Ry · CNOT', difficulty: 3,
    chapter: null, start: () => startLevel3(),
  },
];

const NOVA_LINES = [
  'Operador, hay tres crisis activas. Empecemos por la primera: el País A y el País B se están quedando sin energía.',
  'La energía está balanceada. Ahora los equipos de rescate necesitan un diagnóstico. Vamos al Nivel 2.',
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
const VISUALS = { balance: visualBalance, despliegue: visualDespliegue, cosecha: visualCosecha };

// ---------- Render ----------
function levelStars(lv) {
  return progress[lv.id] || (lv.chapter != null ? progress[CHAPTERS[lv.chapter].id] || 0 : 0);
}

function renderLevels() {
  const stars = LEVELS.map(levelStars);
  const done = stars.filter(Boolean).length;
  $('#lv-done').textContent = done;
  $('#stars-count').textContent = stars.reduce((a, b) => a + b, 0);
  $('#map-bubble').textContent = NOVA_LINES[done];

  const starSVG = on => `<svg viewBox="0 0 24 24" class="${on ? 'on' : ''}"><path d="M12 2 L14.6 8.6 L21.5 9.2 L16.2 13.8 L17.8 20.6 L12 17 L6.2 20.6 L7.8 13.8 L2.5 9.2 L9.4 8.6 Z"/></svg>`;
  $('#planet-grid').innerHTML = LEVELS.map((lv, i) => {
    const locked = !FREE_MODE && i > 0 && !stars[i - 1];
    const state = stars[i] ? 'done' : locked ? 'locked' : 'open';
    const stateText = { done: 'COMPLETADO', locked: 'BLOQUEADO', open: 'DISPONIBLE' }[state];
    return `
      <article class="level-card state-${state}" style="--accent:${lv.accent}; animation-delay:${0.1 + i * 0.12}s">
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

  $$('.lv-btn:not([disabled])').forEach(b => b.onclick = () => {
    const lv = LEVELS[+b.dataset.i];
    if (lv.start) return lv.start();
    if (lv.chapter == null) return toast(`El nivel ${lv.num} se está construyendo`);
    startChapter(lv.chapter);
  });
}

document.getElementById('btn-home').onclick = () => show('screen-title');
document.getElementById('btn-see-briefing').onclick = () => show('screen-briefing');
