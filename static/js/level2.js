// Nivel 2: El Despliegue. SWAP test (fidelidad) + KNN con K = 3. Todo el cálculo cuántico lo hace Qiskit (/api/nivel2/*).
const L2_GATES = {
  h: { label: 'H', name: 'Hadamard', color: '#7b86ff' },
  x: { label: 'X', name: 'Pauli-X', color: '#ff5c7a' },
  z: { label: 'Z', name: 'Pauli-Z', color: '#3ee0c0' },
  y: { label: 'Y', name: 'Pauli-Y', color: '#b07bff' },
};
const L2_TERMS = ['estado cuántico', 'fidelidad', 'SWAP test', 'CSWAP', 'Hadamard', 'ortogonal', 'KNN', 'vecino', 'mayoría', 'clasificar', 'probabilidad'];
const L2_RADAR = ['h', 'cswap', 'h'];
const L2_EYE = [240, 220]; // visor/proyector de NOVA en la escena (origen del haz de escaneo)
const MAP = { x0: 220, w: 760, y0: 320, h: 360 };
const mapXY = p => [MAP.x0 + p.x * MAP.w, MAP.y0 + p.y * MAP.h];

const L2 = {};
const l2 = id => document.getElementById(id);
const l2Say = Kit.makeSay('l2');
const l2Hl = (...s) => Kit.highlight('screen-level2', ...s);
const pct2 = v => Math.round(v * 100) + '%';

const closeL2Code = () => { l2('l2-code-modal').classList.remove('open'); Kit.sfx('click'); };
l2('l2-code-btn').onclick = () => l2('l2-code-modal').classList.add('open');
const l2CodeClose = l2('l2-code-close'); if (l2CodeClose) l2CodeClose.onclick = closeL2Code;
const l2CodeX = l2('l2-code-x'); if (l2CodeX) l2CodeX.onclick = closeL2Code;

function l2SetPhase(phase) {
  L2.phase = phase;
  l2('l2-phase').textContent = { intro: 'BRIEFING', p1: 'FASE 1/2 · ENSAMBLAR RADAR', scan: 'ESCANEANDO', p2: 'FASE 2/2 · CLASIFICAR (K = 3)', done: 'COMPLETADO' }[phase];
  l2('l2-phase').className = 'hud-phase ' + (phase === 'p2' ? 'p2' : phase === 'done' ? 'done' : '');
}

// ---------------------------------------------------------------- Monitor de similitud
function l2SetSim(v, verdict) {
  l2('l2-sim-fill').style.width = v == null ? '0%' : (v * 100) + '%';
  l2('l2-sim-val').textContent = v == null ? '—' : pct2(v);
  if (verdict) l2('l2-verdict').innerHTML = verdict;
}
function l2Verdict(v) {
  if (v >= 0.9) return '<b class="ok">Muy parecidos</b>: casi idénticos.';
  if (v >= 0.7) return '<b class="mid">Algo parecidos</b>.';
  return '<b class="bad">Totalmente distintos</b> (cerca de 50%).';
}

// ---------------------------------------------------------------- Compuertas y circuito
function l2RenderGates() {
  l2('l2-gates').innerHTML = Object.entries(L2_GATES).map(([k, g]) => `
    <button class="gate-tile" data-gate="${k}" draggable="true" style="--g:${g.color}" title="${GLOSSARY[g.name] || ''}">
      <span class="gt-glyph">${g.label}</span><small>${g.name}</small>
    </button>`).join('');
  document.querySelectorAll('#screen-level2 .gate-tile').forEach(t => {
    const k = t.dataset.gate;
    t.onclick = () => {
      if (k === 'cswap') return l2Place(1, 'cswap');
      const free = [0, 2].find(i => !L2.slots[i]);
      if (free == null) return toast('Los espacios pequeños están llenos: quita una compuerta');
      l2Place(free, k);
    };
    t.ondragstart = e => e.dataTransfer.setData('text/plain', 'gate:' + k);
  });
}

function l2RenderSlots() {
  document.querySelectorAll('#screen-level2 .slot').forEach(slot => {
    const i = +slot.dataset.slot, k = L2.slots[i];
    slot.classList.toggle('filled', !!k);
    if (!k) {
      slot.innerHTML = '<span class="plus">+</span>' + (i === 1 ? '<span class="dots"><i></i><i></i><i></i></span>' : '');
      return;
    }
    const color = k === 'cswap' ? '#9aa6c8' : L2_GATES[k].color;
    slot.innerHTML = `<span class="placed ${k === 'cswap' ? 'placed-cswap' : ''}" draggable="true" style="--g:${color}" title="Clic para quitar">${k === 'cswap' ? 'CSWAP' : L2_GATES[k].label}</span>`;
    const pl = slot.querySelector('.placed');
    pl.onclick = () => l2Remove(i);
    pl.ondragstart = e => e.dataTransfer.setData('text/plain', 'slot:' + i);
    pl.ondragend = e => { if (e.dataTransfer.dropEffect === 'none') l2Remove(i); };
  });
}

document.querySelectorAll('#screen-level2 .slot').forEach(slot => {
  slot.ondragover = e => { e.preventDefault(); slot.classList.add('over'); };
  slot.ondragleave = () => slot.classList.remove('over');
  slot.ondrop = e => {
    e.preventDefault(); slot.classList.remove('over');
    const [kind, v] = e.dataTransfer.getData('text/plain').split(':');
    const i = +slot.dataset.slot;
    if (kind === 'gate') l2Place(i, v);
    if (kind === 'slot' && +v !== i) {
      const k = L2.slots[+v];
      if ((k === 'cswap') !== (i === 1)) return l2WrongSlot(k);
      L2.slots[+v] = L2.slots[i]; L2.slots[i] = k; l2CircuitChanged();
    }
  };
});

function l2WrongSlot(k) {
  Kit.sfx('error');
  toast(k === 'cswap' ? 'CSWAP usa los 3 cables: va en el bloque grande del centro' : 'Ese espacio es solo para CSWAP');
}
function l2Place(i, k) {
  if (L2.busy || L2.phase === 'p2' || L2.phase === 'done') return;
  if ((k === 'cswap') !== (i === 1)) return l2WrongSlot(k);
  L2.slots[i] = k;
  Kit.sfx('place');
  l2CircuitChanged();
}
function l2Remove(i) {
  if (L2.busy || L2.phase === 'p2' || L2.phase === 'done') return;
  L2.slots[i] = null;
  Kit.sfx('remove');
  l2CircuitChanged();
}
const l2Gates = () => L2.slots.filter(Boolean);
const l2IsRadar = () => L2.slots.join(',') === L2_RADAR.join(',');

function l2CircuitChanged() {
  l2RenderSlots();
  if (L2.phase === 'p1' && l2IsRadar() && !L2.saidRun) {
    L2.saidRun = true;
    l2Hl('#l2-run');
    l2Say([{ t: 'Radar de interferencia ensamblado: H → CSWAP → H.', hi: 'Presiona EJECUTAR para escanear al escuadrón gris.' }]);
  }
}

// ---------------------------------------------------------------- Mapa táctico
function l2Point(p, cls) {
  const [x, y] = mapXY(p);
  return `<g class="pt ${cls}" data-id="${p.id}" transform="translate(${x} ${y})">
    <circle r="24" class="halo"/><circle r="12" class="core"/></g>`;
}

function l2RenderMap() {
  const d = L2.data;
  let html = d.points.map(p => l2Point(p, p.label ? 'tired' : 'apt')).join('');
  const g0cls = L2.firstDone ? 'tired classified' : 'gray first';
  html += l2Point(d.first, g0cls);
  if (L2.grays) html += L2.grays.map(g => l2Point(g, g.done ? (g.label ? 'tired classified' : 'apt classified') : 'gray drop')).join('');
  l2('l2-points').innerHTML = html;
  l2RenderLines();
}

function l2RenderLines() {
  const byId = id => [...L2.data.points, L2.data.first, ...(L2.grays || [])].find(p => p.id === id);
  l2('l2-lines').innerHTML = L2.links.map(l => {
    const [x1, y1] = mapXY(byId(l.from)), [x2, y2] = mapXY(byId(l.to));
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const cls = l.sim == null ? 'pending' : l.sim >= 0.9 ? 'hi' : l.sim >= 0.7 ? 'mid' : 'lo';
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="link ${cls}"/>` +
      (l.sim == null ? '' : `<g transform="translate(${mx} ${my})"><rect x="-30" y="-15" width="60" height="26" rx="6" class="link-tag ${cls}"/><text y="4" class="link-txt">${pct2(l.sim)}</text></g>`);
  }).join('');
}

// Cono de escaneo desde el visor de NOVA hacia un punto
function l2Cone(p, on) {
  const cone = l2('l2-cone-shape');
  if (!on) { cone.classList.remove('on'); return; }
  const [x, y] = mapXY(p);
  cone.setAttribute('points', `${L2_EYE[0] - 10},${L2_EYE[1]} ${L2_EYE[0] + 10},${L2_EYE[1]} ${x + 34},${y} ${x - 34},${y}`);
  cone.classList.add('on');
}

// ---------------------------------------------------------------- Ejecutar el radar (fase 1)
l2('l2-run').onclick = async () => {
  if (L2.busy || L2.phase !== 'p1') {
    if (L2.phase === 'intro') toast('Escucha a NOVA primero (clic en su mensaje para avanzar)');
    if (L2.phase === 'p2') toast('El radar ya está automatizado: traza cables en el mapa');
    return;
  }
  L2.busy = true; l2('l2-run').disabled = true; l2Hl();
  Kit.sfx('run');
  let r;
  try {
    r = await api('/api/nivel2/scan', { gates: l2Gates(), a: L2.data.healthy, b: L2.data.first, shots: 1000 });
  } catch (e) { toast('Error del servidor: ' + e.message); L2.busy = false; l2('l2-run').disabled = false; return; }
  L2.scans++;
  l2('l2-diagram').textContent = r.diagram; l2('l2-code').textContent = r.code;
  // Animación: cono de escaneo + monitor que se llena
  l2Cone(L2.data.first, true); Kit.sfx('scan');
  await l2FillMonitor(r.measured);
  l2Cone(null, false);
  L2.busy = false; l2('l2-run').disabled = false;

  if (l2IsRadar()) return l2FirstScanDone(r);
  if (r.theory > 0.99) return l2Say([{ t: `El monitor marca ${pct2(r.measured)}... pero es una lectura FALSA: sin las dos compuertas H no hay interferencia.`, hi: 'El radar necesita H antes y después del CSWAP.' }]);
  if (Math.abs(r.theory - 0.5) < 0.01) return l2Say([{ t: 'Siempre 50%, sin importar a quién escaneemos: falta cerrar la interferencia.', hi: 'Orden correcto: H → CSWAP → H.' }]);
  return l2Say([{ t: 'Esa combinación no forma el radar: la lectura no significa nada.', hi: 'Orden correcto: H → CSWAP → H. Usa los tres cables.' }]);
};

function l2FillMonitor(target) {
  return new Promise(done => {
    const t0 = performance.now(), dur = 1500;
    function f(now) {
      const k = Math.min(1, (now - t0) / dur);
      const v = 0.5 + (target - 0.5) * k + (k < 1 ? (Math.random() - 0.5) * 0.08 : 0);
      l2SetSim(Math.max(0, Math.min(1, v)), k < 1 ? 'Escaneando...' : null);
      if (k % 0.1 < 0.02) Kit.sfx('tick');
      if (k < 1) requestAnimationFrame(f); else { l2SetSim(target, l2Verdict(target)); done(); }
    }
    requestAnimationFrame(f);
  });
}

async function l2FirstScanDone(r) {
  l2SetPhase('scan');
  await l2Say([
    { t: `Lectura: ${pct2(r.measured)}. En mi arquitectura, 100% significa idénticos y 50% significa [[ortogonal]]: no se parecen en nada.`, hold: 4800 },
    { t: 'Diagnóstico: el Escuadrón Gris NO se parece a un operario sano. Está EXHAUSTO.', hold: 2800 },
  ]);
  if (L2.phase !== 'scan') return;
  L2.firstDone = true; Kit.sfx('success'); l2RenderMap();
  await new Promise(r2 => setTimeout(r2, 600));
  Kit.sfx('alarm');
  L2.grays = L2.data.grays.map(g => ({ ...g, done: false }));
  l2RenderMap();
  await l2Say([
    { t: '¡Múltiples escuadrones reportando! Hay tres puntos grises nuevos en el mapa.', hold: 3000 },
    { t: 'Automaticé el radar: cada cable que traces hará un [[SWAP test]] con Qiskit y mostrará la similitud.', hold: 3800 },
    { t: 'Usa [[KNN]] con K = 3: conecta cada gris con 3 [[vecino]]s y la [[mayoría]] decide su diagnóstico.', hi: 'Arrastra desde un punto gris hasta un punto de color. Elige los más parecidos.' },
  ]);
  if (L2.phase !== 'scan') return;
  l2SetPhase('p2');
  l2Hl('#l2-points .gray');
}

// ---------------------------------------------------------------- Fase 2: cables de medición (KNN)
const svgPt = (svg, e) => {
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
};
const l2Map = l2('l2-map');
l2Map.addEventListener('pointerdown', e => {
  if (L2.phase !== 'p2') return;
  const g = e.target.closest('.pt.gray');
  if (g && !g.classList.contains('first')) {
    // Empieza a trazar un cable desde un punto gris
    const gray = L2.grays.find(x => x.id === g.dataset.id);
    if (!gray || gray.done) return;
    L2.drag = gray; L2.selected = gray;
    const [x, y] = mapXY(gray);
    Object.assign(l2('l2-drag'), {}); l2('l2-drag').setAttribute('x1', x); l2('l2-drag').setAttribute('y1', y);
    l2('l2-drag').setAttribute('x2', x); l2('l2-drag').setAttribute('y2', y);
    l2('l2-drag').classList.add('on');
    document.querySelectorAll('#l2-points .pt').forEach(p => p.classList.toggle('sel', p === g));
    l2Map.setPointerCapture(e.pointerId);
    e.preventDefault();
    return;
  }
  // Clic en un punto de color con un gris seleccionado = conectar
  const c = e.target.closest('.pt.apt:not(.classified), .pt.tired:not(.classified)');
  if (c && L2.selected) l2Connect(L2.selected, c.dataset.id);
});
l2Map.addEventListener('pointermove', e => {
  if (!L2.drag) return;
  const p = svgPt(l2Map, e);
  l2('l2-drag').setAttribute('x2', p.x); l2('l2-drag').setAttribute('y2', p.y);
});
l2Map.addEventListener('pointerup', e => {
  if (!L2.drag) return;
  const gray = L2.drag; L2.drag = null;
  l2('l2-drag').classList.remove('on');
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const c = el && el.closest('#l2-points .pt.apt:not(.classified), #l2-points .pt.tired:not(.classified)');
  if (c) l2Connect(gray, c.dataset.id);
});

async function l2Connect(gray, targetId) {
  if (gray.done || L2.busy) return;
  const mine = L2.links.filter(l => l.from === gray.id);
  if (mine.some(l => l.to === targetId)) return toast('Ese cable ya está conectado');
  if (mine.length >= 3) return toast('Ya tiene 3 vecinos (K = 3)');
  const target = L2.data.points.find(p => p.id === targetId);
  const link = { from: gray.id, to: targetId, sim: null, label: target.label };
  L2.links.push(link); l2RenderLines(); Kit.sfx('connect');
  L2.busy = true;
  try {
    const r = await api('/api/nivel2/scan', { gates: L2_RADAR, a: target, b: gray, shots: 1000 });
    L2.scans++;
    link.sim = r.measured;
    l2('l2-diagram').textContent = r.diagram; l2('l2-code').textContent = r.code;
    l2SetSim(r.measured, l2Verdict(r.measured));
  } catch (e) {
    toast('Error del servidor: ' + e.message);
    L2.links.splice(L2.links.indexOf(link), 1);
  }
  L2.busy = false;
  l2RenderLines();
  if (!L2.saidFirstLink && link.sim != null) {
    L2.saidFirstLink = true;
    l2Say([{ t: `Cable conectado: similitud ${pct2(link.sim)}. Mientras más cerca de 100%, más parecido es ese [[vecino]].`, hi: 'Conecta 2 cables más desde el mismo punto gris.' }]);
  }
  const now = L2.links.filter(l => l.from === gray.id && l.sim != null);
  if (now.length === 3) l2Vote(gray, now);
}

async function l2Vote(gray, links) {
  const red = links.filter(l => l.label === 1).length;
  const vote = red >= 2 ? 1 : 0;
  const name = vote ? 'EXHAUSTO' : 'APTO';
  if (vote === gray.label) {
    gray.done = true; L2.selected = null;
    Kit.sfx('success');
    l2RenderMap();
    const left = L2.grays.filter(g => !g.done).length;
    if (!left) return l2Win();
    l2Say([{ t: `Escuadrón clasificado: ${name} por [[mayoría]] (${vote ? red : 3 - red} de 3 vecinos).`, hi: `Quedan ${left} punto${left > 1 ? 's' : ''} gris${left > 1 ? 'es' : ''}.` }]);
  } else {
    Kit.sfx('error');
    L2.mistakes++;
    const low = links.some(l => l.sim < 0.85);
    await l2Say([{ t: `La mayoría dice ${name}, pero el diagnóstico no es confiable${low ? ': conectaste vecinos poco parecidos (lecturas bajas)' : ''}.`, hi: 'Borré esos cables. Conecta con los vecinos de lectura más alta.', hold: 4200 }]);
    L2.links = L2.links.filter(l => l.from !== gray.id);
    l2RenderLines();
  }
}

async function l2Win() {
  l2SetPhase('done');
  let elapsed = 0;
  if (L2.timer) elapsed = L2.timer.stop();
  l2Hl();

  if (window.CHALLENGE_MODE && typeof window.onChallengeLevelWin === 'function') {
    Kit.sfx('success');
    window.onChallengeLevelWin(elapsed);
    return;
  }

  Kit.sfx('success');
  await l2Say([
    { t: 'Clasificación exitosa. Usar similitud cuántica nos permite comparar perfiles sin medir distancias clásicas.', hold: 3800 },
    { t: 'Los escuadrones exhaustos han sido evacuados. ¡Buen trabajo, Operador!', hold: 2600 },
  ]);
  const stars = Kit.starsFor(L2.hints);
  progress.despliegue = Math.max(progress.despliegue || 0, stars);
  saveProgress();
  l2('l2-stars').innerHTML = Kit.stars(stars);
  l2('l2-stats').innerHTML = `
    <div><small>TIEMPO</small><b>${l2('l2-timer').textContent}</b></div>
    <div><small>PISTAS</small><b>${L2.hints}</b></div>
    <div><small>SWAP TESTS</small><b>${L2.scans}</b></div>
    <div><small>ERRORES</small><b>${L2.mistakes}</b></div>`;
  Kit.sfx('win');
  l2('l2-win').classList.add('open');
}

// ---------------------------------------------------------------- Inicio / salida
const L2_HINTS = {
  intro: 'Espera a que termine el briefing de NOVA. Luego arrastra H, CSWAP y H al circuito.',
  p1: 'Arrastra una H al primer espacio, CSWAP al bloque grande del centro y otra H al último espacio. Luego presiona EJECUTAR.',
  p2: 'Mantén presionado sobre un punto gris y suelta sobre un punto de color cercano. Las lecturas cercanas a 100% son las mejores. Repite hasta tener 3 cables.',
};

l2('l2-dict').onclick = () => Kit.openGlossary('Diccionario · Nivel 3', L2_TERMS);

l2('l2-hint').onclick = () => {
  const text = L2_HINTS[L2.phase] || L2_HINTS.p1;
  L2.hints++;
  Kit.openHint(text);
};

async function startLevel2() {
  Object.assign(L2, { slots: [null, null, null], hints: 0, scans: 0, mistakes: 0, busy: false, saidRun: false,
    saidFirstLink: false, firstDone: false, grays: null, links: [], drag: null, selected: null });
  if (L2.timer) L2.timer.stop();
  l2('l2-win').classList.remove('open');
  l2('l2-timer').textContent = window.CHALLENGE_MODE ? '01:30' : '00:00';
  l2('l2-run').disabled = false;
  l2SetSim(null, 'El monitor mostrará la lectura del radar.');
  l2SetPhase('intro');
  l2RenderGates(); l2RenderSlots();
  show('screen-level2');
  Kit.ambient(true);
  try { L2.data = await api('/api/nivel2/data'); } catch (e) { toast('Error del servidor: ' + e.message); return; }
  l2RenderMap();

  if (window.COMMUNITY_CHALLENGE && window.COMMUNITY_CHALLENGE.theme === 'despliegue') {
    l2SetPhase('p1');
    l2Hl('#l2-gates [data-gate="h"]', '#screen-level2 .cswap-tile', '#screen-level2 .slot');
    L2.timer = Kit.timer(l2('l2-timer'));
    await l2Say([
      { t: `[RETO COMUNITARIO] ${window.COMMUNITY_CHALLENGE.title}: ${window.COMMUNITY_CHALLENGE.context}`, hold: 5000 },
      { t: `OBJETIVO: ${window.COMMUNITY_CHALLENGE.target_desc}`, hi: 'Ensambla el Radar SWAP Test y clasifica las unidades.' }
    ]);
    return;
  }

  await l2Say([
    { t: 'Los equipos de rescate están en el terreno, pero la biometría clásica está fallando por la interferencia.', hold: 3600 },
    { t: 'En el mapa: verde = operarios aptos, rojo = exhaustos. El punto gris es un escuadrón sin diagnóstico.', hold: 3800 },
    { t: 'No calcularemos su cansancio: mediremos su [[fidelidad]], qué tan parecido es su [[estado cuántico]] al de un operario sano.', hold: 4400 },
    { t: 'Ensambla el Radar de Interferencia: el [[SWAP test]].', hi: 'Coloca H → CSWAP → H siguiendo los tres cables.', hold: 100 },
  ]);
  if (L2.phase !== 'intro' && !window.CHALLENGE_MODE) return;
  l2SetPhase('p1');
  l2Hl('#l2-gates [data-gate="h"]', '#screen-level2 .cswap-tile', '#screen-level2 .slot');
  L2.timer = Kit.timer(l2('l2-timer'));
}

function exitLevel2() {
  l2Say.cancel(); Kit.ambient(false);
  if (L2.timer) L2.timer.stop();
  L2.phase = 'done';
  l2('l2-win').classList.remove('open');
  if (window.COMMUNITY_CHALLENGE) {
    window.COMMUNITY_CHALLENGE = null;
    const banner = $('#hud-community-banner');
    if (banner) banner.style.display = 'none';
  }
  renderMap(); show('screen-map');
}
l2('l2-exit').onclick = exitLevel2;
const l2MapBtn = l2('l2-map-btn');
if (l2MapBtn) l2MapBtn.onclick = exitLevel2;
l2('l2-next').onclick = () => {
  exitLevel2();
  if (typeof startLevel3 === 'function') startLevel3();
};
l2('l2-retry').onclick = () => startLevel2();

if (new URLSearchParams(location.search).get('pantalla') === 'nivel2' || new URLSearchParams(location.search).get('pantalla') === 'nivel3_despliegue') startLevel2();
