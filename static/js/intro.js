// Flujo de inicio: Despegar → video de la historia → objetivos de la misión → mapa.
const introVideo = document.getElementById('intro-video');

function playIntro() {
  show('screen-intro');
  introVideo.currentTime = 0;
  // El clic en "Despegar" permite reproducir con sonido; si el navegador lo bloquea, probamos en silencio
  introVideo.play().catch(() => { introVideo.muted = true; updateMuteIcon(); introVideo.play(); });
}

function endIntro() {
  introVideo.pause();
  show('screen-briefing');
}

function updateMuteIcon() {
  document.getElementById('btn-mute').classList.toggle('muted', introVideo.muted);
}

introVideo.addEventListener('timeupdate', () => {
  const p = introVideo.duration ? introVideo.currentTime / introVideo.duration : 0;
  document.getElementById('intro-bar').style.width = (p * 100) + '%';
});
introVideo.addEventListener('ended', endIntro);
introVideo.addEventListener('error', endIntro); // si el video no carga, no dejamos al jugador atascado
introVideo.addEventListener('click', () => introVideo.paused ? introVideo.play() : introVideo.pause());

document.getElementById('btn-skip').onclick = endIntro;
document.getElementById('btn-mute').onclick = () => { introVideo.muted = !introVideo.muted; updateMuteIcon(); };
document.getElementById('btn-replay').onclick = playIntro;
document.getElementById('btn-to-map').onclick = () => { renderMap(); show('screen-map'); };

// Tecla Esc también omite la animación
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('screen-intro').classList.contains('active')) endIntro();
});

// Atajo para presentaciones: ?pantalla=historia, ?pantalla=objetivos o ?pantalla=niveles
const pantalla = new URLSearchParams(location.search).get('pantalla');
if (pantalla === 'objetivos') show('screen-briefing');
if (pantalla === 'niveles') { renderMap(); show('screen-map'); }
if (pantalla === 'historia') { show('screen-intro'); introVideo.muted = true; updateMuteIcon(); introVideo.play(); }
