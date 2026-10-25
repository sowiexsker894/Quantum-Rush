// Kit compartido por los niveles: sonido, diálogo de NOVA con diccionario, cronómetro y resaltados.
const Kit = (() => {
  // ---------------------------------------------------------------- Sonido (sintetizado, sin archivos)
  let ctx = null, master = null, drone = null;
  let muted = false;
  try { muted = localStorage.getItem('qr-muted') === '1'; } catch { /* sin almacenamiento */ }

  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, { type = 'sine', vol = 0.15, to = null, delay = 0 } = {}) {
    const a = audio(); if (!a) return;
    const t = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  const SFX = {
    type:    () => tone(1400 + Math.random() * 300, 0.03, { type: 'square', vol: 0.02 }),
    click:   () => tone(700, 0.06, { type: 'triangle', vol: 0.08 }),
    place:   () => { tone(420, 0.08, { type: 'triangle', vol: 0.12 }); tone(840, 0.1, { type: 'sine', vol: 0.08, delay: 0.05 }); },
    remove:  () => tone(500, 0.12, { type: 'triangle', vol: 0.1, to: 220 }),
    run:     () => { tone(180, 0.5, { type: 'sawtooth', vol: 0.06, to: 720 }); tone(360, 0.5, { type: 'sine', vol: 0.06, to: 1440 }); },
    packet:  () => tone(900 + Math.random() * 500, 0.05, { type: 'sine', vol: 0.03 }),
    scan:    () => { for (let i = 0; i < 4; i++) tone(1200, 0.12, { type: 'sine', vol: 0.06, to: 600, delay: i * 0.35 }); },
    connect: () => { tone(660, 0.07, { type: 'square', vol: 0.05 }); tone(990, 0.09, { type: 'sine', vol: 0.07, delay: 0.06 }); },
    alarm:   () => { for (let i = 0; i < 4; i++) { tone(880, 0.18, { type: 'square', vol: 0.07, delay: i * 0.4 }); tone(620, 0.18, { type: 'square', vol: 0.07, delay: i * 0.4 + 0.2 }); } },
    success: () => [523, 659, 784].forEach((f, i) => tone(f, 0.18, { type: 'triangle', vol: 0.12, delay: i * 0.09 })),
    error:   () => { tone(220, 0.18, { type: 'sawtooth', vol: 0.07 }); tone(180, 0.22, { type: 'sawtooth', vol: 0.07, delay: 0.12 }); },
    win:     () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.25, { type: 'triangle', vol: 0.13, delay: i * 0.12 })),
    tick:    () => tone(1800, 0.02, { type: 'square', vol: 0.025 }),
  };
  function sfx(name) { if (!muted && SFX[name]) SFX[name](); }

  // Zumbido ambiental de la nave mientras se juega un nivel
  function ambient(on) {
    if (on && !drone) {
      const a = audio(); if (!a) return;
      const g = a.createGain(); g.gain.value = 0.0001;
      const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 320;
      const oscs = [55, 55.4, 110.3].map((fr, i) => {
        const o = a.createOscillator(); o.type = i === 2 ? 'sine' : 'sawtooth'; o.frequency.value = fr; o.connect(f); o.start(); return o;
      });
      f.connect(g); g.connect(master);
      g.gain.exponentialRampToValueAtTime(0.035, a.currentTime + 1.5);
      drone = { g, oscs };
    } else if (!on && drone) {
      const d = drone; drone = null;
      d.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      setTimeout(() => d.oscs.forEach(o => o.stop()), 700);
    }
  }

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem('qr-muted', m ? '1' : '0'); } catch { /* sin almacenamiento */ }
    if (master) master.gain.value = m ? 0 : 0.5;
    document.querySelectorAll('.sound-btn').forEach(b => b.classList.toggle('muted', m));
  }
  document.querySelectorAll('.sound-btn').forEach(b => {
    b.classList.toggle('muted', muted);
    b.onclick = () => { setMuted(!muted); if (!muted) sfx('click'); };
  });

  // ---------------------------------------------------------------- Diálogo de NOVA (con tiempos y diccionario)
  // Cada línea: { t: texto, hi: instrucción resaltada, hold: ms de lectura }. [[palabra]] = término del diccionario.
  function makeSay(prefix) {
    const $id = s => document.getElementById(`${prefix}-${s}`);
    let sayId = 0, skip = null;
    $id('bubble').addEventListener('click', e => {
      if (e.target.closest('.term')) return; // tocar una palabra del diccionario no salta el diálogo
      if (skip) skip();
    });
    function say(lines) {
      if (window.CHALLENGE_MODE) {
        return Promise.resolve();
      }
      const id = ++sayId;
      return (async () => {
        for (const line of lines) {
          if (id !== sayId) return;
          const p = $id('say'), hi = $id('say-hi');
          const plain = line.t.replace(/\[\[|\]\]/g, '');
          hi.innerHTML = '';
          const b = $id('bubble'); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
          let n = 0;
          await new Promise(done => {
            skip = () => { n = plain.length; };
            const timer = setInterval(() => {
              if (id !== sayId) { clearInterval(timer); return done(); }
              n += 2; p.textContent = plain.slice(0, n);
              if (n % 6 === 0) sfx('type');
              if (n >= plain.length) { clearInterval(timer); done(); }
            }, 22);
          });
          if (id !== sayId) return;
          p.innerHTML = richText(line.t);
          hi.innerHTML = line.hi ? richText(line.hi) : '';
          await new Promise(done => {
            skip = () => { done(); };
          });
        }
        skip = null;
      })();
    }
    say.cancel = () => { sayId++; };
    return say;
  }

  // ---------------------------------------------------------------- Utilidades
  function highlight(screenId, ...sels) {
    if (window.CHALLENGE_MODE) return;
    document.querySelectorAll(`#${screenId} .hl`).forEach(e => e.classList.remove('hl'));
    sels.forEach(sel => document.querySelectorAll(sel).forEach(e => e.classList.add('hl')));
  }

  function timer(el) {
    if (window.CHALLENGE_MODE) {
      // Modo reto: cuenta regresiva de 1:30 min (90s).
      const totalLimit = 90;
      let left = totalLimit;
      el.textContent = '01:30';
      const id = setInterval(() => {
        left--;
        if (left < 0) left = 0;
        const mins = Math.floor(left / 60);
        const secs = left % 60;
        el.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
        if (left <= 0) {
          clearInterval(id);
          if (typeof window.onChallengeTimeout === 'function') {
            window.onChallengeTimeout();
          }
        }
      }, 1000);
      return {
        stop: () => {
          clearInterval(id);
          return totalLimit - left; // Devuelve segundos transcurridos
        },
        getElapsed: () => totalLimit - left
      };
    }

    const t0 = Date.now();
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      el.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }, 500);
    return {
      stop: () => {
        clearInterval(id);
        return Math.floor((Date.now() - t0) / 1000);
      },
      getElapsed: () => Math.floor((Date.now() - t0) / 1000)
    };
  }

  function openGlossary(title, terms) {
    document.querySelector('#modal-glossary h2').textContent = title;
    document.getElementById('glossary-list').innerHTML = terms
      .filter(k => GLOSSARY[k])
      .map(k => `<dt>${k}</dt><dd>${GLOSSARY[k]}</dd>`).join('');
    document.getElementById('modal-glossary').classList.add('open');
    sfx('click');
  }

  function openHint(text) {
    const hintText = document.getElementById('hint-text');
    if (hintText) hintText.innerHTML = richText(text);
    const m = document.getElementById('modal-hint');
    if (m) m.classList.add('open');
    sfx('click');
  }

  // Delegación global para cierre de modales (botón [data-close], clic en fondo oscuro o tecla Escape)
  document.addEventListener('click', e => {
    const closeBtn = e.target.closest('[data-close]');
    if (closeBtn) {
      const modal = closeBtn.closest('.modal');
      if (modal) {
        modal.classList.remove('open');
        sfx('click');
      }
      return;
    }
    if (e.target.classList && e.target.classList.contains('modal') && e.target.classList.contains('open')) {
      e.target.classList.remove('open');
      sfx('click');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
    }
  });

  const STAR = '<path d="M12 2 L14.6 8.6 L21.5 9.2 L16.2 13.8 L17.8 20.6 L12 17 L6.2 20.6 L7.8 13.8 L2.5 9.2 L9.4 8.6 Z"/>';
  const stars = n => [1, 2, 3].map(s => `<svg viewBox="0 0 24 24" class="${s <= n ? 'on' : ''}">${STAR}</svg>`).join('');
  const starsFor = hints => hints === 0 ? 3 : hints === 1 ? 2 : 1;

  return { sfx, ambient, makeSay, highlight, timer, openGlossary, openHint, stars, starsFor };
})();
