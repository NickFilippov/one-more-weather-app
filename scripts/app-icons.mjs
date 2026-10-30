// Иконка приложения «Восход»: ночное небо, свет вдоль горизонта, половинка солнца с ореолом.
// Макет: доска «Иконка · восход» в макетах. Запуск: node scripts/app-icons.mjs → assets/*.png.
// Рисунок в координатах 1024 × 1024, горизонт на y = 600.
import { writePng } from './png.mjs';

const N = 1024;
const SS = 3; // подвыборок на пиксель по каждой оси
const HORIZON = 600;
const SKY = [
  [0, [0x15, 0x24, 0x52]],
  [0.38, [0x0f, 0x1a, 0x3e]],
  [1, [0x07, 0x0d, 0x24]],
];
const SUN = [0xff, 0xd3, 0x6b];
const PALE = [0xf4, 0xf7, 0xff];
const WHITE = [0xff, 0xff, 0xff];
// Android показывает центральные 2/3 слоя адаптивной иконки: рисунок уменьшен до этой зоны
const ANDROID_SCALE = 2 / 3;

function sky(y) {
  const t = Math.min(1, Math.max(0, y / N));
  for (let i = 1; i < SKY.length; i++) {
    const [t1, c1] = SKY[i];
    const [t0, c0] = SKY[i - 1];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0);
      return c0.map((v, j) => v + (c1[j] - v) * k);
    }
  }
  return SKY[SKY.length - 1][1];
}

/**
 * Слои рисунка в точке (x, y) снизу вверх: [цвет, непрозрачность].
 * kind: color — иконка целиком; glyph — без неба; tinted — белым для тонировки iOS; mono — сплошной знак.
 */
function layers(x, y, kind) {
  const out = [];
  const above = y < HORIZON;
  const dist = Math.hypot(x - 512, y - HORIZON);
  if (kind === 'mono') {
    if (above && dist < 150) out.push([WHITE, 1]);
    if (Math.abs(y - HORIZON) < 10 && x > 160 && x < 864) out.push([WHITE, 1]);
    return out;
  }
  if (kind === 'color') out.push([sky(y), 1]);
  const glow = kind === 'tinted' ? WHITE : SUN;
  if (kind !== 'tinted') {
    // свет вдоль горизонта: эллипс 880 × 300
    const e = Math.hypot((x - 512) / 440, (y - HORIZON) / 150);
    if (e < 1) out.push([SUN, 0.38 * (1 - e)]);
  }
  if (above && dist < 330) out.push([glow, (kind === 'tinted' ? 0.4 : 0.6) * (1 - dist / 330)]);
  if (above && dist < 150) out.push([kind === 'tinted' ? WHITE : PALE, 1]);
  // горизонт: 704 × 14, к краям тает
  if (Math.abs(y - HORIZON) < 7 && x > 160 && x < 864) {
    out.push([kind === 'tinted' ? WHITE : PALE, (kind === 'tinted' ? 1 : 0.95) * (1 - Math.abs(x - 512) / 352)]);
  }
  return out;
}

/** Пиксель картинки: усреднение подвыборок, сложение слоёв «поверх» с предумножением. */
function render(kind, scale = 1, bg = false) {
  return (px, py) => {
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const ix = px - 0.5 + (sx + 0.5) / SS;
        const iy = py - 0.5 + (sy + 0.5) / SS;
        const x = 512 + (ix - 512) / scale;
        const y = 512 + (iy - 512) / scale;
        let cr = 0;
        let cg = 0;
        let cb = 0;
        let ca = 0;
        const list = bg ? [[sky(y), 1]] : layers(x, y, kind);
        for (const [[lr, lg, lb], la] of list) {
          cr = lr * la + cr * (1 - la);
          cg = lg * la + cg * (1 - la);
          cb = lb * la + cb * (1 - la);
          ca = la + ca * (1 - la);
        }
        r += cr;
        g += cg;
        b += cb;
        a += ca;
      }
    }
    const n = SS * SS;
    if (a === 0) return [0, 0, 0, 0];
    return [Math.round(r / a), Math.round(g / a), Math.round(b / a), Math.round((a / n) * 255)];
  };
}

const out = (name) => new URL(`../assets/${name}`, import.meta.url);
const files = [
  ['icon.png', render('color')],
  ['icon-dark.png', render('glyph')],
  ['icon-tinted.png', render('tinted')],
  ['android-icon-foreground.png', render('glyph', ANDROID_SCALE)],
  ['android-icon-background.png', render('color', ANDROID_SCALE, true)],
  ['android-icon-monochrome.png', render('mono', ANDROID_SCALE)],
];
for (const [name, pixel] of files) {
  const bytes = writePng(out(name), N, pixel);
  console.log(`assets/${name}: ${N}×${N}, ${bytes} байт`);
}
