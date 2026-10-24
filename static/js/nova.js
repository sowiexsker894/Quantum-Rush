// NOVA: robot espacial expresivo dibujado en SVG.
// Estados de ánimo: happy, nervous, thinking, celebrate, sad, surprised
const NOVA_FACES = {
  happy: {
    eyes: '<ellipse cx="78" cy="92" rx="9" ry="11" class="eye"/><ellipse cx="122" cy="92" rx="9" ry="11" class="eye"/>',
    mouth: '<path d="M84 116 Q100 130 116 116" class="mouth"/>',
  },
  nervous: {
    eyes: '<ellipse cx="78" cy="94" rx="8" ry="8" class="eye"/><ellipse cx="122" cy="94" rx="8" ry="8" class="eye"/>' +
          '<path d="M66 78 L88 84 M134 78 L112 84" class="brow"/>',
    mouth: '<path d="M84 122 L90 117 L96 122 L102 117 L108 122 L114 117" class="mouth"/>',
    extra: '<path d="M150 60 Q156 72 150 78 Q144 72 150 60 Z" class="sweat"/>',
  },
  thinking: {
    eyes: '<ellipse cx="80" cy="90" rx="8" ry="10" class="eye"/><rect x="112" y="90" width="20" height="5" rx="2" class="eye"/>',
    mouth: '<path d="M88 120 L112 116" class="mouth"/>',
    extra: '<circle cx="168" cy="40" r="5" class="dot"/><circle cx="180" cy="26" r="7" class="dot"/>',
  },
  celebrate: {
    eyes: '<path d="M68 96 Q78 82 88 96 M112 96 Q122 82 132 96" class="mouth"/>',
    mouth: '<path d="M80 112 Q100 138 120 112 Z" class="mouth-fill"/>',
    extra: '<path d="M30 40 l6 12 l12 2 l-9 8 l2 12 l-11 -6 l-11 6 l2 -12 l-9 -8 l12 -2 Z" class="spark"/>' +
           '<path d="M168 30 l4 8 l8 1 l-6 6 l1 8 l-7 -4 l-7 4 l1 -8 l-6 -6 l8 -1 Z" class="spark"/>',
  },
  sad: {
    eyes: '<ellipse cx="78" cy="96" rx="8" ry="9" class="eye"/><ellipse cx="122" cy="96" rx="8" ry="9" class="eye"/>' +
          '<path d="M66 84 L88 78 M134 84 L112 78" class="brow"/>',
    mouth: '<path d="M86 124 Q100 112 114 124" class="mouth"/>',
  },
  surprised: {
    eyes: '<circle cx="78" cy="90" r="12" class="eye"/><circle cx="122" cy="90" r="12" class="eye"/>',
    mouth: '<ellipse cx="100" cy="120" rx="7" ry="9" class="mouth-fill"/>',
  },
};

function novaSVG(mood) {
  const f = NOVA_FACES[mood] || NOVA_FACES.happy;
  return `
  <svg viewBox="0 0 200 220" class="nova-svg" aria-label="NOVA, robot ${mood}">
    <line x1="100" y1="22" x2="100" y2="46" class="antenna"/>
    <circle cx="100" cy="18" r="8" class="antenna-light"/>
    <rect x="38" y="46" width="124" height="104" rx="34" class="head"/>
    <rect x="52" y="60" width="96" height="76" rx="22" class="face"/>
    ${f.eyes}${f.mouth}
    <rect x="22" y="86" width="16" height="30" rx="8" class="ear"/>
    <rect x="162" y="86" width="16" height="30" rx="8" class="ear"/>
    <rect x="66" y="152" width="68" height="44" rx="16" class="body"/>
    <circle cx="100" cy="174" r="8" class="core"/>
    <rect x="44" y="160" width="18" height="10" rx="5" class="arm arm-l"/>
    <rect x="138" y="160" width="18" height="10" rx="5" class="arm arm-r"/>
    <ellipse cx="100" cy="212" rx="34" ry="6" class="shadow"/>
    ${f.extra || ''}
  </svg>`;
}

function setNova(el, mood) {
  if (!el) return;
  el.innerHTML = novaSVG(mood);
  el.className = el.className.replace(/\bmood-\w+/g, '').trim() + ' mood-' + mood;
}

document.querySelectorAll('[data-nova]').forEach(el => setNova(el, el.dataset.mood || 'happy'));
