// Quantum Rush — lógica de la interfaz.
const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];
const pct = x => (x * 100).toFixed(1).replace('.0', '') + '%';

// ---------------------------------------------------------------- API (Qiskit en el servidor)
async function api(path, body) {
  const res = await fetch(path, body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : undefined);
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ---------------------------------------------------------------- Progreso (guardado en el navegador)
// Demo: todos los niveles abiertos sin completar el anterior. Poner en false para exigir el orden.
const DEMO_MODE = true;
const FREE_MODE = DEMO_MODE || new URLSearchParams(location.search).has('libre');
const progress = (() => {
  try { return JSON.parse(localStorage.getItem('qr-progress')) || {}; } catch { return {}; }
})();
function saveProgress() {
  try { localStorage.setItem('qr-progress', JSON.stringify(progress)); } catch { /* sin almacenamiento */ }
}

// ---------------------------------------------------------------- Fondo de estrellas
(function starfield() {
  const c = $('#stars'), ctx = c.getContext('2d');
  let stars = [];
  function resize() {
    c.width = innerWidth; c.height = innerHeight;
    stars = Array.from({ length: Math.round(innerWidth * innerHeight / 5000) }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      r: Math.random() * 1.4 + 0.2, s: Math.random() * 0.3 + 0.05, t: Math.random() * 6,
    }));
  }
  function frame() {
    ctx.clearRect(0, 0, c.width, c.height);
    for (const s of stars) {
      s.x -= s.s; if (s.x < 0) s.x = c.width;
      s.t += 0.03;
      ctx.globalAlpha = 0.5 + Math.sin(s.t) * 0.4;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  addEventListener('resize', resize); resize(); frame();
})();

// ---------------------------------------------------------------- Diccionario
function glossaryKey(word) {
  const w = word.toLowerCase();
  return Object.keys(GLOSSARY).find(k => k.toLowerCase() === w);
}
function richText(text) {
  return text.replace(/\[\[([^\]]+)\]\]/g, (_, w) => `<span class="term" data-term="${glossaryKey(w) || w}">${w}</span>`);
}
document.addEventListener('mouseover', e => {
  const term = e.target.closest('.term');
  const tip = $('#tooltip');
  if (!term) { tip.classList.remove('show'); return; }
  const def = GLOSSARY[term.dataset.term];
  if (!def) return;
  tip.innerHTML = `<b>${term.dataset.term}</b><br>${def}`;
  const r = term.getBoundingClientRect();
  tip.style.left = Math.min(r.left, innerWidth - 300) + 'px';
  tip.style.top = (r.bottom + 8) + 'px';
  tip.classList.add('show');
});
function openGlossary() {
  $('#glossary-list').innerHTML = Object.entries(GLOSSARY)
    .map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  $('#modal-glossary').classList.add('open');
}
$('#btn-glossary').onclick = openGlossary;
$$('[data-close]').forEach(b => b.onclick = () => b.closest('.modal').classList.remove('open'));

// ---------------------------------------------------------------- Pantallas
function show(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
}
$('#btn-start').onclick = () => (typeof playIntro === 'function' ? playIntro() : (renderMap(), show('screen-map')));
const btnMissions = $('#btn-to-missions');
if (btnMissions) btnMissions.onclick = () => { renderMap(); show('screen-map'); };
const brandBtn = $('.brand');
if (brandBtn) {
  brandBtn.style.cursor = 'pointer';
  brandBtn.onclick = () => { renderMap(); show('screen-map'); };
}
$('#btn-back').onclick = () => { renderMap(); show('screen-map'); };
$('#btn-win-continue').onclick = () => { $('#modal-win').classList.remove('open'); renderMap(); show('screen-map'); };

function renderMap() {
  if (typeof renderLevels === 'function') renderLevels(); // la pantalla de niveles vive en levels.js
}

// ---------------------------------------------------------------- Diálogo de NOVA
const dialog = {
  queue: [], typing: null, onEmpty: null,
  say(lines, onEmpty) {
    this.queue.push(...lines);
    if (onEmpty) this.onEmpty = onEmpty;
    if (!this.typing && !this.current) this.next();
  },
  next() {
    if (this.typing) { this.finishTyping(); return; }
    const line = this.queue.shift();
    if (!line) {
      this.current = null;
      $('#btn-next').disabled = true;
      const cb = this.onEmpty; this.onEmpty = null;
      if (cb) cb();
      return;
    }
    this.current = line;
    setNova($('#nova-chapter'), line.mood);
    $('#btn-next').disabled = false;
    this.type(line.text);
  },
  type(text) {
    const el = $('#dialog-text');
    const html = richText(text);
    const plainLen = text.replace(/\[\[|\]\]/g, '').length;
    let n = 0;
    this.fullHTML = html;
    clearInterval(this.typing);
    this.typing = setInterval(() => {
      n += 2;
      // Mostramos texto plano mientras escribe, y el HTML con palabras del diccionario al final
      el.textContent = text.replace(/\[\[|\]\]/g, '').slice(0, n);
      if (n >= plainLen) this.finishTyping();
    }, 18);
  },
  finishTyping() {
    clearInterval(this.typing); this.typing = null;
    $('#dialog-text').innerHTML = this.fullHTML;
  },
  reset() {
    clearInterval(this.typing); this.typing = null;
    this.queue = []; this.current = null; this.onEmpty = null;
  },
};
$('#btn-next').onclick = () => dialog.next();

// ---------------------------------------------------------------- Capítulo
let state = null;

function startChapter(i) {
  const ch = CHAPTERS[i];
  state = { ch, mission: 0, hints: 0, done: false };
  $('#ch-number').textContent = ch.number;
  $('#ch-name').textContent = ch.name;
  $('#lab').classList.add('is-locked');
  $('#code-diagram').textContent = 'Todavía no has ejecutado ningún circuito.';
  $('#code-python').textContent = '';
  renderMissions();
  LABS[ch.lab]($('#lab-content'));
  show('screen-chapter');
  dialog.reset();
  dialog.say(ch.intro, () => {
    $('#lab').classList.remove('is-locked');
    announceMission();
  });
}

function renderMissions() {
  $('#mission-list').innerHTML = state.ch.missions.map((m, i) => {
    const cls = i < state.mission ? 'done' : i === state.mission ? 'current' : '';
    return `<li class="${cls}">${i < state.mission ? '✅' : i === state.mission ? '▶' : '○'} ${m.text}</li>`;
  }).join('');
}

function announceMission() {
  const m = state.ch.missions[state.mission];
  if (m) dialog.say([{ mood: 'happy', text: `Misión: ${m.text}` + (/[.?!)]$/.test(m.text) ? '' : '.') }]);
}

$('#btn-hint').onclick = () => {
  if (!state || state.done) return;
  const m = state.ch.missions[state.mission];
  if (!m) return;
  state.hints++;
  dialog.reset();
  dialog.say([{ mood: 'thinking', text: '💡 ' + m.hint }]);
};

// Los laboratorios llaman a esto cada vez que el jugador hace algo
function labEvent(ev) {
  if (ev.result) {
    $('#code-diagram').textContent = ev.result.diagram;
    $('#code-python').textContent = ev.result.code;
  }
  if (!state || state.done) return;
  const m = state.ch.missions[state.mission];
  if (!m || !m.check(ev)) return;
  state.mission++;
  renderMissions();
  dialog.reset();
  if (state.mission >= state.ch.missions.length) {
    state.done = true;
    dialog.say([m.reaction], finishChapter);
  } else {
    dialog.say([m.reaction], announceMission);
  }
}

function finishChapter() {
  const stars = state.hints === 0 ? 3 : state.hints <= 2 ? 2 : 1;
  progress[state.ch.id] = Math.max(progress[state.ch.id] || 0, stars);
  saveProgress();
  $('#win-stars').innerHTML = '★'.repeat(stars) + '<span class="off">' + '☆'.repeat(3 - stars) + '</span>';
  $('#win-learned').innerHTML = '<h3>Lo que aprendiste</h3><ul>' +
    state.ch.learned.map(l => `<li>${l}</li>`).join('') + '</ul>' +
    (stars < 3 ? '<p class="muted">Consejo: completa el capítulo sin pistas para ganar 3 estrellas.</p>' : '');
  $('#modal-win').classList.add('open');
}

// ---------------------------------------------------------------- Componentes reutilizables
function chips(name, values, selected) {
  return `<div class="chips" data-chips="${name}">` +
    values.map(v => `<button class="chip ${v === selected ? 'on' : ''}" data-v="${v}">${v}</button>`).join('') + '</div>';
}
function bindChips(root, name, onChange) {
  root.querySelectorAll(`[data-chips="${name}"] .chip`).forEach(b => b.onclick = () => {
    root.querySelectorAll(`[data-chips="${name}"] .chip`).forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    onChange(+b.dataset.v);
  });
}

// Histograma: barras de resultados medidos + marca de probabilidad teórica
function histogram(el, result, labels = {}) {
  const keys = Object.keys(result.counts);
  el.innerHTML = keys.map(k => {
    const f = result.counts[k] / result.shots;
    const p = result.probabilities[k];
    return `
      <div class="bar-col">
        <div class="bar-track">
          <div class="bar-fill bar-${k.length === 1 ? k : 'q'}" style="height:0%" data-h="${f * 100}"></div>
          <div class="bar-theory" style="bottom:${p * 100}%" title="Probabilidad teórica ${pct(p)}"></div>
        </div>
        <div class="bar-value">${pct(f)}</div>
        <div class="bar-count">${result.counts[k]} veces</div>
        <div class="bar-label">${labels[k] || k}</div>
      </div>`;
  }).join('');
  requestAnimationFrame(() => el.querySelectorAll('.bar-fill').forEach(b => b.style.height = b.dataset.h + '%'));
}

async function withLoading(btn, fn) {
  btn.disabled = true;
  const txt = btn.innerHTML;
  btn.innerHTML = '⚛️ Calculando con Qiskit...';
  try { await fn(); }
  catch (e) { toast('Error del servidor: ' + e.message); }
  finally { btn.disabled = false; btn.innerHTML = txt; }
}

// ---------------------------------------------------------------- Laboratorios
const LABS = {
  // Capítulo 1: la moneda cuántica (compuerta H, disparos, ley de los grandes números)
  coin(root) {
    let hasH = false, shots = 10;
    const history = [];
    root.innerHTML = `
      <div class="lab-grid">
        <div class="card">
          <h3>⚙️ Panel del faro</h3>
          <div class="coin-stage"><div class="coin" id="coin"><span>0</span></div></div>
          <label class="switch">
            <input type="checkbox" id="h-toggle">
            <span class="slider"></span>
            <span>Compuerta <b>H</b> <small>(pone el qubit a girar)</small></span>
          </label>
          <p class="label">¿Cuántas veces medimos? <span class="term" data-term="disparos">(disparos)</span></p>
          ${chips('shots', [1, 10, 100, 1000], shots)}
          <button class="btn btn-primary btn-lg full" id="btn-measure">📡 MEDIR</button>
        </div>
        <div class="card">
          <h3>📊 Resultados</h3>
          <div class="histogram" id="hist"><p class="muted">Pulsa MEDIR para ver resultados.</p></div>
          <p class="legend"><span class="legend-line"></span> lo que esperamos en teoría (probabilidad)</p>
          <h4>Historial de mediciones</h4>
          <table class="history"><thead><tr><th>H</th><th>Disparos</th><th>% de unos</th></tr></thead><tbody id="hist-table"></tbody></table>
        </div>
      </div>`;
    const coin = root.querySelector('#coin');
    root.querySelector('#h-toggle').onchange = e => {
      hasH = e.target.checked;
      coin.classList.toggle('spinning', hasH);
      coin.querySelector('span').textContent = hasH ? '?' : '0';
    };
    bindChips(root, 'shots', v => shots = v);
    const btn = root.querySelector('#btn-measure');
    btn.onclick = () => withLoading(btn, async () => {
      const gates = hasH ? [{ gate: 'h', q: 0 }] : [];
      const result = await api('/api/run', { n_qubits: 1, gates, shots });
      histogram(root.querySelector('#hist'), result, { '0': '0 · Fila A', '1': '1 · Fila B' });
      const p1 = result.counts['1'] / result.shots;
      if (shots === 1) {
        const v = result.counts['1'] ? '1' : '0';
        coin.classList.remove('spinning'); coin.querySelector('span').textContent = v;
        setTimeout(() => { if (hasH) { coin.classList.add('spinning'); coin.querySelector('span').textContent = '?'; } }, 1200);
      }
      history.unshift({ hasH, shots, p1 });
      root.querySelector('#hist-table').innerHTML = history.slice(0, 6)
        .map(h => `<tr><td>${h.hasH ? '✅' : '—'}</td><td>${h.shots}</td><td>${pct(h.p1)}</td></tr>`).join('');
      labEvent({ hasH, shots, p1, result });
    });
  },

  // Capítulo 2: perilla de rotación RY
  dial(root) {
    let deg = 0, shots = 100;
    root.innerHTML = `
      <div class="lab-grid">
        <div class="card">
          <h3>🛡️ Control del escudo</h3>
          <svg viewBox="-120 -120 240 240" class="dial">
            <circle r="100" class="dial-ring"/>
            <path id="dial-arc" class="dial-arc"/>
            <text y="-104" class="dial-txt">0 · apagado</text>
            <text y="118" class="dial-txt">1 · escudo ON</text>
            <line id="dial-arrow" x1="0" y1="0" x2="0" y2="-88" class="dial-arrow"/>
            <circle r="7" class="dial-center"/>
          </svg>
          <p class="label">Ángulo de rotación: <b id="deg-val">0°</b></p>
          <input type="range" min="0" max="180" value="0" id="deg" class="range">
          <div class="prob-readout">Probabilidad de escudo ON (teoría): <b id="p-theory">0%</b></div>
          <p class="label">Disparos:</p>
          ${chips('shots', [10, 100, 500, 1000], shots)}
          <button class="btn btn-primary btn-lg full" id="btn-measure">📡 MEDIR</button>
        </div>
        <div class="card">
          <h3>📊 Resultados</h3>
          <div class="histogram" id="hist"><p class="muted">Gira la perilla y pulsa MEDIR.</p></div>
          <p class="legend"><span class="legend-line"></span> probabilidad teórica</p>
          <div class="target-band">🎯 Objetivo final: escudo ON entre <b>70%</b> y <b>80%</b></div>
        </div>
      </div>`;
    const arrow = root.querySelector('#dial-arrow'), arc = root.querySelector('#dial-arc');
    function draw() {
      const rad = deg * Math.PI / 180;
      arrow.setAttribute('transform', `rotate(${deg})`);
      const x = 100 * Math.sin(rad), y = -100 * Math.cos(rad);
      arc.setAttribute('d', deg > 0 ? `M0 -100 A100 100 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}` : '');
      root.querySelector('#deg-val').textContent = deg + '°';
      root.querySelector('#p-theory').textContent = pct(Math.sin(rad / 2) ** 2);
    }
    root.querySelector('#deg').oninput = e => { deg = +e.target.value; draw(); };
    bindChips(root, 'shots', v => shots = v);
    const btn = root.querySelector('#btn-measure');
    btn.onclick = () => withLoading(btn, async () => {
      const result = await api('/api/run', { n_qubits: 1, gates: [{ gate: 'ry', q: 0, theta: deg * Math.PI / 180 }], shots });
      histogram(root.querySelector('#hist'), result, { '0': '0 · apagado', '1': '1 · escudo ON' });
      labEvent({ thetaDeg: deg, shots, p1: result.counts['1'] / result.shots, result });
    });
    draw();
  },

  // Capítulo 3: constructor de circuitos de 2 qubits (entrelazamiento)
  builder(root) {
    let gates = [];
    const PALETTE = [
      { label: 'H en NOVA', g: { gate: 'h', q: 0 } },
      { label: 'H en ZIP', g: { gate: 'h', q: 1 } },
      { label: 'X en NOVA', g: { gate: 'x', q: 0 } },
      { label: 'X en ZIP', g: { gate: 'x', q: 1 } },
      { label: 'CNOT NOVA → ZIP', g: { gate: 'cx', c: 0, t: 1 } },
    ];
    // Las claves de Qiskit se leen al revés: "q1 q0" → ZIP, NOVA
    const LABELS = { '00': '🤖0 · 👾0', '01': '🤖1 · 👾0', '10': '🤖0 · 👾1', '11': '🤖1 · 👾1' };
    root.innerHTML = `
      <div class="lab-grid">
        <div class="card">
          <h3>🔧 Constructor de circuitos</h3>
          <p class="muted small">Pulsa las compuertas para agregarlas en orden (de izquierda a derecha).</p>
          <div class="palette">${PALETTE.map((p, i) =>
            `<button class="gate-btn ${p.g.gate}" data-i="${i}" title="${p.g.gate === 'cx' ? GLOSSARY.CNOT : ''}">${p.label}</button>`).join('')}</div>
          <div class="circuit" id="circuit"></div>
          <div class="row">
            <button class="btn btn-ghost btn-sm" id="btn-undo">↶ Deshacer</button>
            <button class="btn btn-ghost btn-sm" id="btn-clear">🗑 Borrar todo</button>
          </div>
          <button class="btn btn-primary btn-lg full" id="btn-measure">📡 MEDIR 1000 veces</button>
        </div>
        <div class="card">
          <h3>📊 Resultados <small class="muted">🤖 NOVA · 👾 ZIP</small></h3>
          <div class="histogram" id="hist"><p class="muted">Arma un circuito y pulsa MEDIR.</p></div>
          <div class="agree" id="agree"></div>
        </div>
      </div>`;
    function drawCircuit() {
      const cols = gates.map(g => {
        if (g.gate === 'cx') return '<div class="col"><div class="cell"><span class="ctrl"></span></div><div class="cell"><span class="tgt">⊕</span></div><span class="cx-line"></span></div>';
        const box = `<span class="gbox ${g.gate}">${g.gate.toUpperCase()}</span>`;
        return `<div class="col"><div class="cell">${g.q === 0 ? box : ''}</div><div class="cell">${g.q === 1 ? box : ''}</div></div>`;
      }).join('');
      root.querySelector('#circuit').innerHTML = `
        <div class="wires"><div class="wire-name">🤖 NOVA q0</div><div class="wire-name">👾 ZIP q1</div></div>
        <div class="wire-area"><div class="wire"></div><div class="wire"></div><div class="cols">${cols}</div></div>`;
    }
    root.querySelectorAll('.gate-btn').forEach(b => b.onclick = () => {
      if (gates.length >= 8) return toast('Máximo 8 compuertas');
      gates.push({ ...PALETTE[+b.dataset.i].g }); drawCircuit();
    });
    root.querySelector('#btn-undo').onclick = () => { gates.pop(); drawCircuit(); };
    root.querySelector('#btn-clear').onclick = () => { gates = []; drawCircuit(); };
    const btn = root.querySelector('#btn-measure');
    btn.onclick = () => withLoading(btn, async () => {
      const result = await api('/api/run', { n_qubits: 2, gates, shots: 1000 });
      histogram(root.querySelector('#hist'), result, LABELS);
      const frac = Object.fromEntries(Object.entries(result.counts).map(([k, v]) => [k, v / result.shots]));
      const agree = frac['00'] + frac['11'];
      root.querySelector('#agree').innerHTML = `
        <p>¿Coinciden NOVA y ZIP? <b>${pct(agree)}</b> de las veces</p>
        <div class="meter"><div style="width:${agree * 100}%"></div></div>`;
      labEvent({
        hasH0: gates.some(g => g.gate === 'h' && g.q === 0),
        hasCX: gates.some(g => g.gate === 'cx'),
        shots: result.shots, agree, frac, result,
      });
    });
    drawCircuit();
  },

  // Capítulo 4: clasificador cuántico de meteoritos
  async classifier(root) {
    let w = 0.2, b = 0, data = [], timer = null, training = false;
    root.innerHTML = `
      <div class="lab-grid">
        <div class="card span2">
          <h3>☄️ Radar de meteoritos</h3>
          <svg viewBox="0 0 640 320" class="plot" id="plot"></svg>
          <p class="legend">🟢 seguro · 🔴 peligroso · ✖ el modelo se equivoca ·
            <span class="legend-curve"></span> probabilidad de peligro según el modelo</p>
        </div>
        <div class="card">
          <h3>🎛️ Parámetros del modelo</h3>
          <p class="label">w (sensibilidad al tamaño): <b id="w-val"></b></p>
          <input type="range" min="-2" max="3" step="0.01" id="w" class="range">
          <p class="label">b (desplazamiento): <b id="b-val"></b></p>
          <input type="range" min="-3.14" max="3.14" step="0.01" id="b" class="range">
          <button class="btn btn-primary btn-lg full" id="btn-train">🧠 ENTRENAR IA</button>
        </div>
        <div class="card">
          <h3>📈 ¿Qué tan bien lo hace?</h3>
          <div class="kpis">
            <div class="kpi"><small>Precisión</small><b id="acc">—</b></div>
            <div class="kpi"><small>Error</small><b id="loss">—</b></div>
          </div>
          <svg viewBox="0 0 300 110" class="loss-chart" id="loss-chart"></svg>
          <p class="muted small" id="epoch-info">El gráfico del error aparecerá al entrenar.</p>
        </div>
      </div>`;
    const X = x => 40 + x * 520, Y = p => 270 - p * 220;
    const modelP = x => Math.sin((w * x * Math.PI + b) / 2) ** 2; // mismo modelo que en Qiskit, solo para dibujar
    function drawPlot(points) {
      let curve = '';
      for (let i = 0; i <= 100; i++) curve += (i ? 'L' : 'M') + X(i / 100).toFixed(1) + ' ' + Y(modelP(i / 100)).toFixed(1);
      const pts = (points || data.map(d => ({ ...d, pred: d.y }))).map((d, i) => {
        const cx = X(d.x), cy = Y(d.y) + (i % 3 - 1) * 9;
        const wrong = d.pred !== d.y;
        return `<circle cx="${cx}" cy="${cy}" r="9" class="pt ${d.y ? 'danger' : 'safe'}"/>` +
          (wrong ? `<text x="${cx}" y="${cy + 5}" class="pt-x">✖</text>` : '');
      }).join('');
      root.querySelector('#plot').innerHTML = `
        <rect x="40" y="${Y(1)}" width="520" height="${Y(0.5) - Y(1)}" class="zone-danger"/>
        <rect x="40" y="${Y(0.5)}" width="520" height="${Y(0) - Y(0.5)}" class="zone-safe"/>
        <line x1="40" x2="560" y1="${Y(0.5)}" y2="${Y(0.5)}" class="half"/>
        <text x="566" y="${Y(0.5) + 4}" class="axis-txt">50%</text>
        <text x="44" y="${Y(1) - 22}" class="axis-txt">▲ zona "peligroso"</text>
        <text x="560" y="${Y(0) + 26}" class="axis-txt end">▼ zona "seguro"</text>
        <text x="300" y="314" class="axis-txt mid">pequeño ← tamaño del meteorito → grande</text>
        <path d="${curve}" class="curve"/>
        ${pts}`;
      root.querySelector('#w-val').textContent = w.toFixed(2);
      root.querySelector('#b-val').textContent = b.toFixed(2);
      root.querySelector('#w').value = w; root.querySelector('#b').value = b;
    }
    function showScore(ev) {
      root.querySelector('#acc').textContent = pct(ev.accuracy);
      root.querySelector('#loss').textContent = ev.loss.toFixed(3);
    }
    async function classify(kind) {
      const ev = await api('/api/classify', { w, b });
      drawPlot(ev.points); showScore(ev);
      labEvent({ kind, accuracy: ev.accuracy });
    }
    ['w', 'b'].forEach(id => root.querySelector('#' + id).oninput = e => {
      if (training) return;
      if (id === 'w') w = +e.target.value; else b = +e.target.value;
      drawPlot();
      clearTimeout(timer);
      timer = setTimeout(() => classify('manual').catch(err => toast(err.message)), 150);
    });
    const btn = root.querySelector('#btn-train');
    btn.onclick = () => withLoading(btn, async () => {
      training = true;
      const res = await api('/api/train', { w, b, epochs: 40 });
      const maxLoss = Math.max(...res.history.map(h => h.loss), 0.01);
      for (const h of res.history) {
        w = h.w; b = h.b; drawPlot();
        showScore(h);
        const line = res.history.slice(0, h.epoch)
          .map((p, i) => `${i ? 'L' : 'M'}${(10 + i * 280 / (res.history.length - 1)).toFixed(1)} ${(100 - p.loss / maxLoss * 90).toFixed(1)}`).join('');
        root.querySelector('#loss-chart').innerHTML = `<path d="${line}" class="loss-line"/><text x="10" y="12" class="axis-txt">error ↓</text>`;
        root.querySelector('#epoch-info').textContent = `Paso de entrenamiento ${h.epoch} de ${res.history.length}`;
        await new Promise(r => setTimeout(r, 90));
      }
      training = false;
      await classify('train');
    });
    data = await api('/api/meteors');
    drawPlot();
    classify('init').catch(err => toast(err.message));
  },
};

renderMap();

// Atajos para presentaciones: ?cap=3 abre el capítulo 3 directamente; &saltar omite el diálogo inicial
const params = new URLSearchParams(location.search);
if (params.has('cap')) {
  const i = Math.min(Math.max(+params.get('cap') - 1, 0), CHAPTERS.length - 1);
  startChapter(i);
  if (params.has('saltar')) { dialog.reset(); $('#lab').classList.remove('is-locked'); announceMission(); }
}
