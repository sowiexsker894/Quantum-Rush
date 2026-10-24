// Landing: lunas en órbita alrededor del planeta y efecto de profundidad con el mouse.
(function () {
  const scene = document.getElementById('scene');
  if (!scene) return;
  // Centro del planeta dentro de la escena (en fracciones) y la inclinación de los anillos
  const CX = 0.58, CY = 0.486, TILT = -24 * Math.PI / 180;
  const moons = [...scene.querySelectorAll('.moon')].map(el => {
    const [rx, ry, phase, period] = el.dataset.orbit.split(',').map(Number);
    return { el, rx, ry, phase, period };
  });

  function frame(t) {
    const w = scene.clientWidth, h = scene.clientHeight;
    for (const m of moons) {
      const a = m.phase + (t / 1000) * (2 * Math.PI / m.period);
      // Elipse inclinada: x/y en el plano de la órbita, luego rotada como los anillos
      const ox = Math.cos(a) * m.rx * w, oy = Math.sin(a) * m.ry * w;
      const x = CX * w + ox * Math.cos(TILT) - oy * Math.sin(TILT);
      const y = CY * h + ox * Math.sin(TILT) + oy * Math.cos(TILT);
      const front = Math.sin(a) > 0; // mitad de abajo de la órbita = delante del planeta
      const s = m.el.offsetWidth;
      m.el.style.transform = `translate(${x - s / 2}px, ${y - s / 2}px) scale(${front ? 1.15 : 0.8})`;
      m.el.style.zIndex = front ? 5 : 1;
      m.el.style.opacity = front ? 1 : 0.7;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Paralaje: el robot y el planeta se mueven un poco siguiendo el mouse
  const landing = document.getElementById('screen-title');
  landing.addEventListener('mousemove', e => {
    const r = landing.getBoundingClientRect();
    scene.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5) * 2);
    scene.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5) * 2);
  });
})();
