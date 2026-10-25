// Quantum Rush: utilidades compartidas por todas las pantallas (API, progreso, diccionario, navegación).
const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

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
// En los diálogos, [[palabra]] se convierte en una palabra con explicación al pasar el mouse.
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
$$('[data-close]').forEach(b => b.onclick = () => b.closest('.modal').classList.remove('open'));

// ---------------------------------------------------------------- Pantallas
function show(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
}
$('#btn-start').onclick = () => playIntro();
