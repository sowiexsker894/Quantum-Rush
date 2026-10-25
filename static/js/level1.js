// Nivel 1: El Balance. País A = resultado 0, País B = resultado 1.
// Toda la simulación cuántica la hace Qiskit en el servidor (/api/nivel1).
const L1_GATES = {
  h:  { label: 'H',     name: 'Hadamard',   color: '#7b86ff' },
  x:  { label: 'X',     name: 'Pauli-X',    color: '#ff5c7a' },
  ry: { label: 'Ry(θ)', name: 'Rotación Y', color: '#ffc24a' },
  z:  { label: 'Z',     name: 'Pauli-Z',    color: '#3ee0c0' },
  y:  { label: 'Y',     name: 'Pauli-Y',    color: '#b07bff' },
  cx: { label: 'CNOT',  name: '(Nivel 2)',  color: '#7d86a8', locked: true },
};
const L1_TARGET = { A: 0.8, B: 0.2 };
const L1_FROM = { A: [590, 360], B: [630, 360] };   // luces de NOVA en cabina (1200x896)
const L1_TO = { A: [360, 640], B: [840, 640] };     // zonas terrestres País A y País B

const L1 = {};
const l1 = id => document.getElementById(id);

// ---------------------------------------------------------------- Diálogo con tiempos (kit compartido)
const l1Say = Kit.makeSay('l1');
const L1_TERMS = ['qubit', 'superposición', 'Hadamard', 'Ry', 'probabilidad', 'medición', 'disparos', 'compuerta', 'circuito', 'Pauli-X', 'Pauli-Y', 'Pauli-Z'];
l1('l1-dict').onclick = () => Kit.openGlossary('Diccionario · Nivel 1', L1_TERMS);

// ---------------------------------------------------------------- Escena y barras
function l1SetProb(pA, source) {
  const pB = 1 - pA;
  l1('l1-bar-a').style.width = (pA * 100) + '%';
  l1('l1-bar-b').style.width = (pB * 100) + '%';
  l1('l1-val-a').textContent = pA.toFixed(2);
  l1('l1-val-b').textContent = pB.toFixed(2);
  l1('l1-lbl-a').textContent = `P(A) = ${pA.toFixed(2)}`;
  l1('l1-lbl-b').textContent = `P(B) = ${pB.toFixed(2)}`;
  l1('l1-beam-a').style.opacity = 0.15 + pA * 0.85;
  l1('l1-beam-b').style.opacity = 0.15 + pB * 0.85;
  l1('l1-glow-a').style.opacity = pA;
  l1('l1-glow-b').style.opacity = pB;
  l1('l1-dark-a').style.opacity = pA < 0.3 ? (0.3 - pA) / 0.3 : 0;   // apagón si recibe muy poca energía
  l1('l1-dark-b').style.opacity = pB < 0.3 ? (0.3 - pB) / 0.3 : 0;
  if (source) l1('l1-source').textContent = source;
}

function l1Highlight(...ids) {
  document.querySelectorAll('#screen-level1 .hl').forEach(e => e.classList.remove('hl'));
  ids.forEach(sel => document.querySelectorAll(sel).forEach(e => e.classList.add('hl')));
}

function l1SetPhase(phase) {
  L1.phase = phase;
  l1('l1-phase').textContent = {
    intro: 'BRIEFING', p1: 'FASE 1/2 · EQUILIBRAR 50/50', alarm: 'ALERTA', p2: 'FASE 2/2 · CALIBRAR 80/20', done: 'COMPLETADO',
  }[phase];
  l1('l1-phase').className = 'hud-phase ' + phase;
  const showTarget = phase === 'p2';
  l1('l1-tgt-a').style.left = (L1_TARGET.A * 100) + '%';
  l1('l1-tgt-b').style.left = (L1_TARGET.B * 100) + '%';
  l1('l1-tgt-a').classList.toggle('on', showTarget);
  l1('l1-tgt-b').classList.toggle('on', showTarget);
}

// ---------------------------------------------------------------- Compuertas y circuito
function l1RenderGates() {
  l1('l1-gates').innerHTML = Object.entries(L1_GATES).map(([k, g]) => `
    <button class="gate-tile ${g.locked ? 'locked' : ''}" data-gate="${k}" draggable="${!g.locked}" style="--g:${g.color}">
      <span class="gt-glyph">${k === 'ry' ? '<svg viewBox="0 0 24 24"><path d="M19 12 A7 7 0 1 1 15 5.6"/><path d="M15 2 V6 H19"/><circle cx="12" cy="12" r="1.6"/></svg>' : k === 'cx' ? '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2.5"/><path d="M7.5 12 H16"/><circle cx="18.5" cy="12" r="3"/></svg>' : g.label}</span>
      <span class="gt-sym">${k === 'ry' || k === 'cx' ? g.label : g.label}</span>
      <small>${g.name}</small>
      ${g.locked ? '<svg class="gt-lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11 V7 A4 4 0 0 1 16 7 V11"/></svg>' : ''}
    </button>`).join('');
  document.querySelectorAll('#l1-gates .gate-tile').forEach(t => {
    const k = t.dataset.gate;
    t.onclick = () => {
      if (L1_GATES[k].locked) return toast('CNOT se desbloquea en el Nivel 2');
      const free = L1.slots.indexOf(null);
      if (free < 0) return toast('El circuito está lleno: quita una compuerta');
      l1Place(free, k);
    };
    t.ondragstart = e => { e.dataTransfer.setData('text/plain', 'gate:' + k); e.dataTransfer.effectAllowed = 'copyMove'; };
  });
}

function l1RenderSlots() {
  document.querySelectorAll('#screen-level1 .slot').forEach(slot => {
    const i = +slot.dataset.slot, k = L1.slots[i];
    slot.classList.toggle('filled', !!k);
    slot.innerHTML = k
      ? `<span class="placed" draggable="true" style="--g:${L1_GATES[k].color}" title="Clic para quitar">${k === 'ry' ? 'Ry' : L1_GATES[k].label}</span>`
      : '<span class="plus">+</span>';
    const placed = slot.querySelector('.placed');
    if (placed) {
      placed.onclick = () => l1Remove(i);
      placed.ondragstart = e => { e.dataTransfer.setData('text/plain', 'slot:' + i); e.dataTransfer.effectAllowed = 'move'; };
      placed.ondragend = e => { if (e.dataTransfer.dropEffect === 'none') l1Remove(i); }; // soltar fuera = quitar
    }
  });
}

document.querySelectorAll('#screen-level1 .slot').forEach(slot => {
  slot.ondragover = e => { e.preventDefault(); slot.classList.add('over'); };
  slot.ondragleave = () => slot.classList.remove('over');
  slot.ondrop = e => {
    e.preventDefault(); slot.classList.remove('over');
    const [kind, v] = e.dataTransfer.getData('text/plain').split(':');
    const i = +slot.dataset.slot;
    if (kind === 'gate') l1Place(i, v);
    if (kind === 'slot' && +v !== i) { const k = L1.slots[+v]; L1.slots[+v] = L1.slots[i]; L1.slots[i] = k; l1CircuitChanged(); }
  };
});

function l1Place(i, k) {
  if (L1.busy) return;
  L1.slots[i] = k;
  Kit.sfx('place');
  l1CircuitChanged();
}
function l1Remove(i) {
  if (L1.busy) return;
  L1.slots[i] = null;
  Kit.sfx('remove');
  l1CircuitChanged();
}

const l1Has = k => L1.slots.includes(k);
function l1Circuit() {
  return L1.slots.filter(Boolean).map(k => k === 'ry'
    ? { gate: 'ry', q: 0, theta: L1.theta * Math.PI / 180 }
    : { gate: k, q: 0 });
}

function l1CircuitChanged() {
  l1RenderSlots();
  const hasRy = l1Has('ry');
  l1('l1-theta').disabled = !hasRy;
  l1('l1-angle-box').classList.toggle('active', hasRy);
  l1Predict();

  // Reacciones de NOVA según la fase
  if (L1.phase === 'p1' && l1Has('h') && !L1.saidRun) {
    L1.saidRun = true;
    l1Highlight('#l1-run');
    l1Say([{ t: '¡Perfecto! La compuerta H ya está en el circuito.', hi: 'Ahora presiona EJECUTAR CIRCUITO.' }]);
  }
  if (L1.phase === 'p2' && !l1Has('h') && hasRy && !L1.saidRy) {
    L1.saidRy = true;
    l1Highlight('#l1-theta');
    l1Say([{ t: 'Rotador [[Ry]] instalado. Ahora tú controlas la dirección de la energía.', hi: 'Gira el ángulo θ hasta que la predicción marque 80 / 20 y ejecuta.' }]);
  } else if (L1.phase === 'p2' && !l1Has('h') && !hasRy) {
    l1Highlight('#l1-gates [data-gate="ry"]', '#screen-level1 .slot');
  }
}

// Predicción teórica calculada por Qiskit mientras se mueve el ángulo
let l1PredTimer = null;
function l1Predict() {
  clearTimeout(l1PredTimer);
  if (!l1Has('ry')) { l1('l1-predict').textContent = 'Coloca la compuerta Ry para usar el ángulo.'; return; }
  l1PredTimer = setTimeout(async () => {
    try {
      const r = await api('/api/nivel1', { gates: l1Circuit(), shots: 1 });
      l1('l1-predict').innerHTML = `Predicción (Qiskit): <b class="ca">País A ${Math.round(r.theory.A * 100)}%</b> · <b class="cb">País B ${Math.round(r.theory.B * 100)}%</b>`;
    } catch { /* la predicción es opcional */ }
  }, 120);
}
l1('l1-theta').oninput = e => {
  L1.theta = +e.target.value;
  l1('l1-theta-val').textContent = L1.theta + '°';
  l1Predict();
};

// ---------------------------------------------------------------- Ejecutar: Qiskit + animación de paquetes
l1('l1-run').onclick = async () => {
  if (L1.phase === 'intro') return toast('Escucha a NOVA primero (clic en su mensaje para avanzar)');
  if (L1.busy || L1.phase === 'alarm' || L1.phase === 'done') return;
  L1.busy = true;
  l1('l1-run').disabled = true;
  l1Highlight();
  Kit.sfx('run');
  let r;
  try {
    r = await api('/api/nivel1', { gates: l1Circuit(), shots: 1000 });
  } catch (e) {
    toast('Error del servidor: ' + e.message);
    L1.busy = false; l1('l1-run').disabled = false;
    return;
  }
  L1.shots += r.shots;
  l1('l1-diagram').textContent = r.diagram;
  l1('l1-code').textContent = r.code;
  await l1Animate(r);
  const measuredA = r.counts.A / r.shots;
  l1SetProb(measuredA, `Medición real con Qiskit · ${r.shots} disparos (A: ${r.counts.A} · B: ${r.counts.B})`);
  L1.busy = false;
  l1('l1-run').disabled = false;
  l1Evaluate(r, measuredA);
};

function l1Animate(r) {
  const g = l1('l1-packets');
  const seq = r.sequence;
  const travel = 650, gap = 38;
  const packets = [...seq].map((c, i) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    el.setAttribute('r', 7);
    el.setAttribute('class', 'packet ' + c.toLowerCase());
    g.appendChild(el);
    return { el, c, t0: i * gap };
  });
  return new Promise(done => {
    const start = performance.now();
    let landed = 0, a = 0;
    function frame(now) {
      const t = now - start;
      for (const p of packets) {
        const k = (t - p.t0) / travel;
        if (k < 0 || p.gone) { p.el.style.opacity = 0; continue; }
        if (k >= 1) {
          p.gone = true; p.el.remove();
          landed++; if (p.c === 'A') a++;
          if (landed % 3 === 0) Kit.sfx('packet');
          l1SetProb(a / landed, `Midiendo... ${landed} paquetes`);
          continue;
        }
        const [x0, y0] = L1_FROM[p.c], [x1, y1] = L1_TO[p.c];
        const e = k * k * (3 - 2 * k);
        p.el.setAttribute('cx', x0 + (x1 - x0) * e);
        p.el.setAttribute('cy', y0 + (y1 - y0) * e);
        p.el.style.opacity = 1;
      }
      if (packets.some(p => !p.gone)) requestAnimationFrame(frame); else done();
    }
    requestAnimationFrame(frame);
  });
}

function l1Evaluate(r, measuredA) {
  const A = r.theory.A;
  const pct = x => Math.round(x * 100) + '%';
  if (L1.phase === 'p1') {
    if (Math.abs(A - 0.5) < 0.01) return l1Phase1Done(measuredA);
    if (!l1Circuit().length) return l1Say([{ t: 'Sin compuertas, el [[qubit]] se queda en |0⟩: TODA la energía va al País A. ¡El País B queda a oscuras!', hi: 'Prueba colocando la compuerta H.' }]);
    if (A < 0.01) return l1Say([{ t: 'Ahora el 100% va al País B. Esa compuerta volteó el qubit... pero tampoco es justo.', hi: 'Necesitamos 50 / 50. Prueba con la compuerta H.' }]);
    if (A > 0.99) return l1Say([{ t: 'Nada cambió: todo sigue yendo al País A. Esa compuerta no reparte la energía.', hi: 'Prueba con la compuerta H.' }]);
    return l1Say([{ t: `Repartimos ${pct(A)} / ${pct(1 - A)}. Cerca, pero no es equidad absoluta.`, hi: 'La compuerta H divide exactamente a la mitad.' }]);
  }
  if (L1.phase === 'p2') {
    if (l1Has('h')) return l1Say([{ t: 'La compuerta H sigue en el circuito: siempre reparte mitad y mitad.', hi: 'Retírala (clic sobre ella) y coloca el Rotador Ry.' }]);
    if (!l1Has('ry')) return l1Say([{ t: 'Sin el Rotador no podemos inclinar la probabilidad.', hi: 'Arrastra la compuerta Ry al circuito.' }]);
    const okTheory = Math.abs(A - L1_TARGET.A) <= 0.02, okMeasured = Math.abs(measuredA - L1_TARGET.A) <= 0.04;
    if (okTheory && okMeasured) return l1Win(measuredA);
    if (A > L1_TARGET.A) return l1Say([{ t: `El País A recibe ${pct(measuredA)}. Es demasiado: el País B se queda corto.`, hi: 'Aumenta el ángulo θ y vuelve a ejecutar.' }]);
    return l1Say([{ t: `El País A recibe solo ${pct(measuredA)}. Necesita el 80%.`, hi: 'Disminuye el ángulo θ y vuelve a ejecutar.' }]);
  }
}

// ---------------------------------------------------------------- Fases
async function l1Phase1Done(measuredA) {
  l1SetPhase('alarm');
  Kit.sfx('success');
  await l1Say([
    { t: `¡Excelente! ${Math.round(measuredA * 100)}% / ${Math.round((1 - measuredA) * 100)}%. Has creado una [[superposición]]: cada paquete tiene la misma [[probabilidad]] de ir a A o a B.`, hold: 4200 },
    { t: 'No sabemos a dónde irá cada paquete por separado... pero sí sabemos que, en total, se reparten mitad y mitad.', hold: 3600 },
  ]);
  if (L1.phase !== 'alarm') return;
  // Alarma: sismo en el País A
  Kit.sfx('alarm');
  l1('l1-alert').classList.add('on');
  l1('l1-quake').classList.add('on');
  l1('l1-frame').classList.add('shake');
  setTimeout(() => l1('l1-frame').classList.remove('shake'), 900);
  await l1Say([
    { t: '¡ALERTA! Un sismo secundario acaba de golpear al País A. El 50/50 ya no es suficiente.', hold: 3200 },
    { t: 'Necesitamos enviar exactamente el 80% de la energía al País A y el 20% al País B.', hi: 'Retira la compuerta H y coloca el Rotador Ry.' },
  ]);
  l1('l1-alert').classList.remove('on');
  if (L1.phase !== 'alarm') return;
  l1SetPhase('p2');
  l1Highlight('#screen-level1 .slot.filled', '#l1-gates [data-gate="ry"]');
  if (!l1Has('h') && l1Has('ry')) l1CircuitChanged();
}

async function l1Win(measuredA) {
  l1SetPhase('done');
  let elapsed = 0;
  if (L1.timer) elapsed = L1.timer.stop();
  clearInterval(L1.timerId);
  l1('l1-quake').classList.remove('on');
  l1Highlight();

  if (window.CHALLENGE_MODE && typeof window.onChallengeLevelWin === 'function') {
    Kit.sfx('success');
    window.onChallengeLevelWin(elapsed);
    return;
  }

  await l1Say([
    { t: `Distribución óptima: ${Math.round(measuredA * 100)}% / ${Math.round((1 - measuredA) * 100)}%. El País A ya recibe la ayuda que necesita.`, hold: 3200 },
    { t: 'Has aprendido la primera regla de mi núcleo: no controlamos el destino de una sola partícula, controlamos la probabilidad de todo el sistema.', hold: 4200 },
  ]);
  const stars = L1.hints === 0 ? 3 : L1.hints === 1 ? 2 : 1;
  progress.balance = Math.max(progress.balance || 0, stars);
  saveProgress();
  const star = on => `<svg viewBox="0 0 24 24" class="${on ? 'on' : ''}"><path d="M12 2 L14.6 8.6 L21.5 9.2 L16.2 13.8 L17.8 20.6 L12 17 L6.2 20.6 L7.8 13.8 L2.5 9.2 L9.4 8.6 Z"/></svg>`;
  l1('l1-stars').innerHTML = [1, 2, 3].map(s => star(s <= stars)).join('');
  l1('l1-stats').innerHTML = `
    <div><small>TIEMPO</small><b>${l1('l1-timer').textContent}</b></div>
    <div><small>PISTAS</small><b>${L1.hints}</b></div>
    <div><small>DISPAROS QISKIT</small><b>${L1.shots}</b></div>
    <div><small>ÁNGULO FINAL</small><b>${L1.theta}°</b></div>`;
  Kit.sfx('win');
  l1('l1-win').classList.add('open');
}

// ---------------------------------------------------------------- Inicio / salida
const L1_HINTS = {
  intro: 'Escucha a NOVA: en unos segundos podrás usar el circuito.',
  p1: 'Arrastra la compuerta H (la azul) a uno de los espacios "+" del circuito y presiona EJECUTAR CIRCUITO.',
  alarm: 'Espera las instrucciones de NOVA.',
  p2: 'Haz clic en la H del circuito para quitarla, coloca Ry y deja el ángulo cerca de 53°. Luego ejecuta.',
};
l1('l1-hint').onclick = () => {
  const text = L1_HINTS[L1.phase] || L1_HINTS.p1;
  L1.hints++;
  Kit.openHint(text);
};

async function startLevel1() {
  Object.assign(L1, { slots: [null, null], theta: 0, hints: 0, shots: 0, busy: false, saidRun: false, saidRy: false });
  if (L1.timer) L1.timer.stop();
  clearInterval(L1.timerId);
  l1('l1-theta').value = 0; l1('l1-theta-val').textContent = '0°';
  l1('l1-win').classList.remove('open');
  l1('l1-quake').classList.remove('on');
  l1('l1-alert').classList.remove('on');
  l1('l1-timer').textContent = window.CHALLENGE_MODE ? '01:30' : '00:00';
  l1('l1-run').disabled = false;
  l1RenderGates();
  l1CircuitChanged();
  l1SetProb(0.9, 'Configuración actual de NOVA (descalibrada)');
  l1SetPhase('intro');
  show('screen-level1');
  Kit.ambient(true);

  await l1Say([
    { t: '¡Mis sistemas están descalibrados! Estoy enviando el 90% de la energía de rescate al País A y solo el 10% al País B.', hold: 4200 },
    { t: 'Los dos países necesitan la misma atención. Mira mi [[circuito]] cuántico: está vacío.', hold: 3200 },
    { t: 'Necesitamos equidad absoluta: 50% para cada país.', hi: 'Arrastra la compuerta H ([[Hadamard]]) a un espacio del circuito.', hold: 100 },
  ]);
  if (L1.phase !== 'intro' && !window.CHALLENGE_MODE) return;
  l1SetPhase('p1');
  l1Highlight('#l1-gates [data-gate="h"]', '#screen-level1 .slot');
  L1.timer = Kit.timer(l1('l1-timer'));
}

function exitLevel1() {
  l1Say.cancel();
  Kit.ambient(false);
  if (L1.timer) L1.timer.stop();
  clearInterval(L1.timerId);
  L1.phase = 'done';
  l1('l1-win').classList.remove('open');
  renderMap();
  show('screen-map');
}
l1('l1-exit').onclick = exitLevel1;
const l1MapBtn = l1('l1-map');
if (l1MapBtn) l1MapBtn.onclick = exitLevel1;
l1('l1-next').onclick = () => {
  exitLevel1();
  if (typeof startLevelSintonia === 'function') startLevelSintonia();
};
const l1Retry = l1('l1-retry'); if (l1Retry) l1Retry.onclick = () => startLevel1();
const closeL1Code = () => { l1('l1-code-modal').classList.remove('open'); Kit.sfx('click'); };
l1('l1-code-btn').onclick = () => l1('l1-code-modal').classList.add('open');
const l1CodeClose = l1('l1-code-close'); if (l1CodeClose) l1CodeClose.onclick = closeL1Code;
const l1CodeX = l1('l1-code-x'); if (l1CodeX) l1CodeX.onclick = closeL1Code;

// Atajo para presentaciones: ?pantalla=nivel1
if (new URLSearchParams(location.search).get('pantalla') === 'nivel1') startLevel1();
