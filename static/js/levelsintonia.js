// Nivel 2: La Sintonía. Entrelazamiento de 2 qubits con CNOT y Correlación.
// Toda la simulación cuántica la hace Qiskit en el servidor (/api/sintonia).

const LS_GATES = {
  h:  { label: 'H',    name: 'Hadamard',    color: '#7b86ff', desc: 'Pone Alfa en superposición (50/50)' },
  cx: { label: 'CNOT', name: 'Control-NOT', color: '#3ee08f', desc: 'Entrelaza Alfa con Beta' },
  x:  { label: 'X',    name: 'Pauli-X',     color: '#ff5c7a', desc: 'Invierte el qubit (0 a 1)' },
};

const LS_TERMS = ['qubit', 'entrelazamiento', 'CNOT', 'correlación', 'superposición', 'Hadamard', 'Pauli-X', 'probabilidad'];

const LS = {};
const ls = id => document.getElementById(id);
const lsSay = Kit.makeSay('ls');
const lsHl = (...s) => Kit.highlight('screen-sintonia', ...s);
const pctS = v => Math.round(v * 100) + '%';

function lsSetPhase(phase) {
  LS.phase = phase;
  const badge = ls('ls-phase');
  if (!badge) return;
  badge.textContent = {
    intro: 'BRIEFING',
    p1: 'FASE 1/2 · SINCRONIZAR (100% ACUERDO)',
    alarm: 'ALERTA',
    p2: 'FASE 2/2 · CORRELACIÓN INVERSA',
    done: 'COMPLETADO',
  }[phase] || phase;
  badge.className = 'hud-phase ' + (phase === 'p2' ? 'p2' : phase === 'done' ? 'done' : '');
}

// ---------------------------------------------------------------- Monitor de correlación
function lsSetGauge(agreement, correlation, note) {
  const bar = ls('ls-agree-bar');
  const val = ls('ls-agree-val');
  const corVal = ls('ls-cor-val');
  const noteEl = ls('ls-gauge-note');
  if (bar) bar.style.width = agreement == null ? '0%' : (agreement * 100) + '%';
  if (val) val.textContent = agreement == null ? '—' : pctS(agreement);
  if (corVal) corVal.textContent = correlation == null ? '—' : (correlation > 0 ? '+' : '') + correlation.toFixed(2);
  if (noteEl && note) noteEl.innerHTML = note;
}

// ---------------------------------------------------------------- Compuertas y slots
function lsRenderGates() {
  const container = ls('ls-gates');
  if (!container) return;
  container.innerHTML = Object.entries(LS_GATES).map(([k, g]) => `
    <button class="gate-tile" data-gate="${k}" draggable="true" style="--g:${g.color}" title="${g.desc}">
      <span class="gt-glyph">${g.label}</span>
      <small>${g.name}</small>
    </button>`).join('');

  container.querySelectorAll('.gate-tile').forEach(t => {
    const k = t.dataset.gate;
    t.onclick = () => {
      if (k === 'cx') {
        lsPlace(1, 'cx');
      } else if (k === 'h') {
        lsPlace(0, 'h');
      } else if (k === 'x') {
        if (LS.phase === 'p2') lsPlace(2, 'x');
        else lsPlace(0, 'x');
      }
    };
    t.ondragstart = e => e.dataTransfer.setData('text/plain', 'gate:' + k);
  });
}

function lsRenderSlots() {
  document.querySelectorAll('#screen-sintonia .slot').forEach(slot => {
    const i = +slot.dataset.slot, k = LS.slots[i];
    slot.classList.toggle('filled', !!k);
    if (!k) {
      slot.innerHTML = '<span class="plus">+</span>';
      return;
    }
    const gateInfo = LS_GATES[k] || { label: k.toUpperCase(), color: '#3ee08f' };
    slot.innerHTML = `<span class="placed ${k === 'cx' ? 'placed-cx' : ''}" draggable="true" style="--g:${gateInfo.color}" title="Clic para quitar">${gateInfo.label}</span>`;
    const pl = slot.querySelector('.placed');
    pl.onclick = () => lsRemove(i);
    pl.ondragstart = e => e.dataTransfer.setData('text/plain', 'slot:' + i);
    pl.ondragend = e => { if (e.dataTransfer.dropEffect === 'none') lsRemove(i); };
  });
}

function lsSetupDragDrop() {
  document.querySelectorAll('#screen-sintonia .slot').forEach(slot => {
    slot.ondragover = e => { e.preventDefault(); slot.classList.add('over'); };
    slot.ondragleave = () => slot.classList.remove('over');
    slot.ondrop = e => {
      e.preventDefault(); slot.classList.remove('over');
      const [kind, v] = e.dataTransfer.getData('text/plain').split(':');
      const i = +slot.dataset.slot;
      if (kind === 'gate') lsPlace(i, v);
    };
  });
}

function lsPlace(i, k) {
  if (LS.busy || LS.phase === 'done' || LS.phase === 'alarm') return;
  // Regla de slots: slot 0 en Alfa (H, X), slot 1 es CNOT que une Alfa y Beta, slot 2 en Beta (X)
  if (i === 1 && k !== 'cx') return toast('La ranura central es para la compuerta CNOT');
  if (i !== 1 && k === 'cx') return toast('CNOT conecta ambas balizas: va en el enlace central');
  LS.slots[i] = k;
  Kit.sfx('place');
  lsCircuitChanged();
}

function lsRemove(i) {
  if (LS.busy || LS.phase === 'done' || LS.phase === 'alarm') return;
  LS.slots[i] = null;
  Kit.sfx('remove');
  lsCircuitChanged();
}

function lsCircuit() {
  const gates = [];
  if (LS.slots[0]) gates.push({ gate: LS.slots[0], q: 0 });
  if (LS.slots[1] === 'cx') gates.push({ gate: 'cx', c: 0, t: 1 });
  if (LS.slots[2]) gates.push({ gate: LS.slots[2], q: 1 });
  return gates;
}

function lsCircuitChanged() {
  lsRenderSlots();
  const hasH = LS.slots[0] === 'h';
  const hasCX = LS.slots[1] === 'cx';
  const hasX = LS.slots[2] === 'x';

  if (LS.phase === 'p1' && hasH && hasCX && !LS.saidRun) {
    LS.saidRun = true;
    lsHl('#ls-run');
    lsSay([{ t: '¡Circuito de entrelazamiento listo! H en Alfa + CNOT hacia Beta.', hi: 'Presiona EJECUTAR CIRCUITO para probar la sintonía.' }]);
  } else if (LS.phase === 'p2' && hasH && hasCX && hasX && !LS.saidRunP2) {
    LS.saidRunP2 = true;
    lsHl('#ls-run');
    lsSay([{ t: 'Compuerta X colocada en Beta. Ahora invertirá su decisión.', hi: 'Presiona EJECUTAR CIRCUITO para verificar la correlación inversa.' }]);
  }
}

// ---------------------------------------------------------------- Animación de pulsos
function lsAnimatePulse(sequence) {
  return new Promise(done => {
    const beam = ls('ls-entangle-beam');
    const dotA = ls('ls-pulse-a');
    const dotB = ls('ls-pulse-b');
    if (!beam || !dotA || !dotB) return done();

    let step = 0;
    const maxSteps = Math.min(sequence.length, 24);
    const interval = setInterval(() => {
      if (step >= maxSteps) {
        clearInterval(interval);
        dotA.style.opacity = '0';
        dotB.style.opacity = '0';
        beam.classList.remove('active');
        return done();
      }
      const pair = sequence[step]; // e.g. '00', '11', '01'
      const a = pair[0], b = pair[1];
      dotA.setAttribute('fill', a === '0' ? '#63d8e6' : '#ffc24a');
      dotB.setAttribute('fill', b === '0' ? '#63d8e6' : '#ffc24a');
      dotA.style.opacity = '1';
      dotB.style.opacity = '1';
      beam.classList.toggle('active', a === b);
      if (step % 4 === 0) Kit.sfx('packet');
      step++;
    }, 70);
  });
}

// ---------------------------------------------------------------- Ejecutar
ls('ls-run').onclick = async () => {
  if (LS.busy || LS.phase === 'intro' || LS.phase === 'alarm' || LS.phase === 'done') return;
  LS.busy = true;
  ls('ls-run').disabled = true;
  lsHl();
  Kit.sfx('run');

  let r;
  try {
    r = await api('/api/sintonia', { gates: lsCircuit(), shots: 1000 });
  } catch (e) {
    toast('Error del servidor: ' + e.message);
    LS.busy = false;
    ls('ls-run').disabled = false;
    return;
  }

  LS.shots += r.shots;
  ls('ls-diagram').textContent = r.diagram;
  ls('ls-code').textContent = r.code;

  await lsAnimatePulse(r.sequence);

  const agree = r.measured_agree;
  const cor = r.correlation;
  lsSetGauge(agree, cor, `Acuerdo medido: <b>${pctS(agree)}</b> · Correlación: <b>${cor > 0 ? '+' : ''}${cor}</b>`);

  LS.busy = false;
  ls('ls-run').disabled = false;
  lsEvaluate(r);
};

function lsEvaluate(r) {
  const agree = r.measured_agree;
  const hasH = LS.slots[0] === 'h';
  const hasCX = LS.slots[1] === 'cx';
  const hasX = LS.slots[2] === 'x';

  if (LS.phase === 'p1') {
    if (!hasH && !hasCX) {
      return lsSay([{ t: 'Sin compuertas, ambas balizas se quedan siempre en |00⟩. No hay superposición ni aleatoriedad.', hi: 'Coloca H en Alfa para darle libertad de decisión.' }]);
    }
    if (hasH && !hasCX) {
      return lsSay([{ t: `Acuerdo: ${pctS(agree)}. Como Alfa decide al azar y Beta no está conectada, ¡solo coinciden la mitad de las veces! Correlación cero.`, hi: 'Conéctalas con la compuerta CNOT en la ranura central.' }]);
    }
    if (hasH && hasCX && agree >= 0.96) {
      return lsPhase1Done(agree);
    }
    return lsSay([{ t: `Acuerdo: ${pctS(agree)}. Casi, pero necesitamos sintonía absoluta (100%).`, hi: 'Revisa que tengas H en Alfa y CNOT en el centro.' }]);
  }

  if (LS.phase === 'p2') {
    if (!hasX) {
      return lsSay([{ t: 'Siguen diciendo lo mismo (100% acuerdo). Necesitamos oposición coordinada: cuando Alfa diga 0, Beta debe decir 1.', hi: 'Coloca la compuerta X en la ranura de Beta.' }]);
    }
    if (hasH && hasCX && hasX && agree <= 0.05) {
      return lsWin(r);
    }
    return lsSay([{ t: `Acuerdo actual: ${pctS(agree)}. Debe ser 0% de acuerdo con correlación -1.0.`, hi: 'Mantén H y CNOT y asegúrate de colocar X en Beta.' }]);
  }
}

async function lsPhase1Done(agree) {
  lsSetPhase('alarm');
  Kit.sfx('success');
  await lsSay([
    { t: `¡Sincronización perfecta! ${pctS(agree)} de acuerdo. Al medir solo salen |00⟩ o |11⟩: ambas coinciden siempre.`, hold: 4200 },
    { t: 'Eso es el [[entrelazamiento]]: las dos balizas actúan como un solo sistema coordinado, con [[correlación]] perfecta.', hold: 4200 },
  ]);

  if (LS.phase !== 'alarm') return;
  Kit.sfx('alarm');
  ls('ls-alert').classList.add('on');
  await lsSay([
    { t: '¡ALERTA DE SEGURIDAD! Un satélite no autorizado intenta interceptar la señal.', hold: 3200 },
    { t: 'El protocolo de camuflaje exige correlación inversa: cuando Alfa diga 0, Beta debe responder 1, y viceversa.', hold: 4000 },
    { t: 'Queremos 0% de coincidencia pero 100% de coordinación (correlación -1.0).', hi: 'Agrega una compuerta X en la ranura de Beta (q1) y ejecuta.' },
  ]);
  ls('ls-alert').classList.remove('on');
  if (LS.phase !== 'alarm') return;
  lsSetPhase('p2');
  lsHl('#ls-gates [data-gate="x"]', '#screen-sintonia .slot[data-slot="2"]');
}

async function lsWin(r) {
  lsSetPhase('done');
  let elapsed = 0;
  if (LS.timer) elapsed = LS.timer.stop();
  lsHl();

  if (window.CHALLENGE_MODE && typeof window.onChallengeLevelWin === 'function') {
    Kit.sfx('success');
    window.onChallengeLevelWin(elapsed);
    return;
  }

  Kit.sfx('success');
  await lsSay([
    { t: `¡Correlación inversa lograda! Solo se miden |01⟩ y |10⟩. La sincronización es absoluta y a prueba de intercepciones.`, hold: 4000 },
    { t: 'Ahora entiendes el puente fundamental: medir probabilidad conjunta y correlación entre dos qubits te permitirá comparar perfiles en el siguiente nivel.', hold: 4800 },
  ]);

  const stars = Kit.starsFor(LS.hints);
  progress.sintonia = Math.max(progress.sintonia || 0, stars);
  saveProgress();

  ls('ls-stars').innerHTML = Kit.stars(stars);
  ls('ls-stats').innerHTML = `
    <div><small>TIEMPO</small><b>${ls('ls-timer').textContent}</b></div>
    <div><small>PISTAS</small><b>${LS.hints}</b></div>
    <div><small>DISPAROS QISKIT</small><b>${LS.shots}</b></div>
    <div><small>CORRELACIÓN</small><b>-1.00</b></div>`;
  Kit.sfx('win');
  ls('ls-win').classList.add('open');
}

// ---------------------------------------------------------------- Inicio / Salida
const LS_HINTS = {
  p1: 'Coloca H en la ranura de Alfa (q0) y la compuerta CNOT en el enlace central. Luego presiona EJECUTAR.',
  p2: 'Deja H y CNOT donde están, y arrastra una compuerta X a la ranura derecha de Beta (q1).',
};

ls('ls-hint').onclick = () => {
  if (!LS_HINTS[LS.phase]) return;
  LS.hints++;
  Kit.sfx('click');
  lsSay([{ t: 'Pista:', hi: LS_HINTS[LS.phase], hold: 6500 }]);
};

const closeLsCode = () => { ls('ls-code-modal').classList.remove('open'); Kit.sfx('click'); };
ls('ls-code-btn').onclick = () => ls('ls-code-modal').classList.add('open');
const lsCodeClose = ls('ls-code-close'); if (lsCodeClose) lsCodeClose.onclick = closeLsCode;
const lsCodeX = ls('ls-code-x'); if (lsCodeX) lsCodeX.onclick = closeLsCode;

async function startLevelSintonia() {
  Object.assign(LS, {
    slots: [null, null, null],
    hints: 0,
    shots: 0,
    busy: false,
    saidRun: false,
    saidRunP2: false,
  });

  if (LS.timer) LS.timer.stop();
  ls('ls-win').classList.remove('open');
  ls('ls-timer').textContent = '00:00';
  ls('ls-run').disabled = false;
  lsSetGauge(0.5, 0.0, 'Balizas en espera. Ejecuta un circuito para medir su sintonía.');
  lsSetPhase('intro');
  lsRenderGates();
  lsRenderSlots();
  lsSetupDragDrop();
  show('screen-sintonia');
  Kit.ambient(true);

  await lsSay([
    { t: 'Operador, antes de enviar los escuadrones necesitamos asegurar las comunicaciones entre el sector Binara y la base.', hold: 3800 },
    { t: 'Tenemos dos balizas cuánticas: Baliza Alfa (q0) y Baliza Beta (q1). Si toman decisiones descoordinadas, el enlace colapsa.', hold: 4200 },
    { t: 'En este nivel aprenderás a entrelazarlas usando la compuerta [[CNOT]] y a medir su [[correlación]].', hold: 4000 },
    { t: 'Fase 1: Logra que ambas balizas coincidan siempre (100% de acuerdo).', hi: 'Coloca H en Alfa y CNOT en el enlace central.', hold: 100 },
  ]);

  if (LS.phase !== 'intro' && !window.CHALLENGE_MODE) return;
  lsSetPhase('p1');
  lsHl('#ls-gates [data-gate="h"]', '#screen-sintonia .slot[data-slot="0"]');
  LS.timer = Kit.timer(ls('ls-timer'));
}

function exitLevelSintonia() {
  lsSay.cancel();
  Kit.ambient(false);
  if (LS.timer) LS.timer.stop();
  LS.phase = 'done';
  ls('ls-win').classList.remove('open');
  renderMap();
  show('screen-map');
}

ls('ls-exit').onclick = exitLevelSintonia;
ls('ls-retry').onclick = () => startLevelSintonia();
ls('ls-map').onclick = exitLevelSintonia;
ls('ls-next').onclick = () => {
  exitLevelSintonia();
  startLevel2(); // Pasa al Nivel 3 (El Despliegue)
};

if (new URLSearchParams(location.search).get('pantalla') === 'sintonia') startLevelSintonia();
