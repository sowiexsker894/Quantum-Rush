// Música de fondo del menú: landing, objetivos y selección de niveles.
// Usa static/audio/musica-inicio.mp3 si existe; si no, toca una melodía espacial sintetizada.
// Se silencia con el mismo botón de sonido que los niveles (Kit), y se pausa en el video y en los niveles.
const Music = (() => {
  const MENU_SCREENS = ['screen-title', 'screen-briefing', 'screen-map'];
  const file = document.getElementById('menu-music');
  let playing = false;

  // ---------------------------------------------------------------- Melodía sintetizada (respaldo)
  // Progresión Am - F - C - G con colchón suave, bajo y un arpegio con eco.
  const CHORDS = [
    [45, 52, 57, 60, 64], // Am
    [41, 48, 53, 57, 60], // F
    [48, 55, 60, 64, 67], // C
    [43, 50, 55, 59, 62], // G
  ];
  const BAR = 4; // segundos por acorde
  const hz = midi => 440 * 2 ** ((midi - 69) / 12);
  let ctx = null, out = null, echo = null, nextBar = 0, bar = 0, timer = null;

  function setupSynth() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    out = ctx.createGain(); out.gain.value = 0.0001;
    const lowpass = ctx.createBiquadFilter(); lowpass.type = 'lowpass'; lowpass.frequency.value = 1600;
    echo = ctx.createDelay(); echo.delayTime.value = 0.375;
    const feedback = ctx.createGain(); feedback.gain.value = 0.35;
    echo.connect(feedback); feedback.connect(echo); echo.connect(lowpass);
    out.connect(lowpass); lowpass.connect(ctx.destination);
    return true;
  }

  function note(freq, t, dur, { vol, type = 'sine', attack = 0.02, toEcho = false }) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out);
    if (toEcho) g.connect(echo);
    o.start(t); o.stop(t + dur + 0.1);
  }

  function scheduleBar(t) {
    const chord = CHORDS[bar % CHORDS.length];
    note(hz(chord[0] - 12), t, BAR, { vol: 0.09, attack: 0.4 });                    // bajo
    chord.slice(1).forEach(m => {                                                     // colchón
      note(hz(m), t, BAR + 1.2, { vol: 0.025, type: 'triangle', attack: 1.2 });
      note(hz(m) * 1.004, t, BAR + 1.2, { vol: 0.02, type: 'sine', attack: 1.2 });
    });
    const arp = [chord[2], chord[3], chord[4], chord[3] + 12, chord[4] + 12, chord[3] + 12, chord[4], chord[3]];
    arp.forEach((m, i) => note(hz(m + 12), t + i * BAR / 8, 0.6, { vol: 0.03, toEcho: true })); // arpeggio
    bar++;
  }

  function startSynth() {
    if (!ctx && !setupSynth()) return;
    if (ctx.state === 'suspended') ctx.resume();
    nextBar = Math.max(nextBar, ctx.currentTime + 0.1);
    clearInterval(timer);
    timer = setInterval(() => {
      while (nextBar < ctx.currentTime + 1.5) { scheduleBar(nextBar); nextBar += BAR; }
    }, 250);
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setTargetAtTime(0.9, ctx.currentTime, 0.6);
  }

  function stopSynth() {
    if (!ctx) return;
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
    clearInterval(timer);
  }

  // ---------------------------------------------------------------- Control
  const onMenu = () => MENU_SCREENS.includes(document.querySelector('.screen.active')?.id);

  function start() {
    if (Kit.isMuted() || !onMenu()) return;
    if (file) {
      if (!playing) {
        file.volume = 0.45;
        file.play().catch(() => { playing = false; }); // bloqueado hasta que el jugador interactúe
      }
    } else if (!playing) {
      startSynth();
    } else if (ctx && ctx.state !== 'running') {
      ctx.resume();
    }
    playing = true;
  }

  function stop() {
    playing = false;
    if (file) file.pause(); else stopSynth();
  }

  const sync = () => (onMenu() && !Kit.isMuted() ? start() : stop());

  // El navegador solo deja sonar después de una interacción: cada clic o tecla reintenta arrancar
  function unlock(e) {
    // El botón de sonido decide por sí mismo, y DESPEGAR pasa directo al video (no queremos un sonido cortado)
    if (e.target.closest && e.target.closest('.sound-btn, #btn-start')) return;
    sync();
  }
  ['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, unlock));

  document.addEventListener('qr-mute', sync);
  document.addEventListener('qr-screen', sync);
  sync();

  const audible = () => playing && (file ? !file.paused : !!ctx && ctx.state === 'running');
  return { start, stop, isPlaying: audible };
})();
