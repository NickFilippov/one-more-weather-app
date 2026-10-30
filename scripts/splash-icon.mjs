// Картинка нативного сплэша: линия горизонта и половинка солнца на прозрачном фоне.
// Размеры те же, что у первого кадра SplashOverlay (src/features/splash), поэтому подмена не видна.
// Запуск: node scripts/splash-icon.mjs. В app.json у плагина expo-splash-screen imageWidth = SIZE.
// Android 12+ показывает картинку в круге 192 dp: всё нарисованное помещается в радиус 60.
import { writePng } from './png.mjs';

const SIZE = 160; // pt
const SCALE = 6; // пикселей на pt: с запасом для @3x и xxxhdpi
const C = SIZE / 2; // горизонт и центр солнца
const LINE = { w: 120, h: 2, alpha: 0.9 }; // градиент прозрачный → 0.9 → прозрачный
const SUN = { r: 14, blur: 18, glowAlpha: 0.45 }; // boxShadow '0 0 18px rgba(244,247,255,0.45)'
const RGB = [0xf4, 0xf7, 0xff];
const SS = 4; // подвыборок на пиксель по каждой оси

// erfc по Абрамовицу и Стигану, точности хватает для размытой тени
function erfc(x) {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r =
    t *
    Math.exp(
      -z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))),
    );
  return x >= 0 ? r : 2 - r;
}

function pixel(px, py) {
  let line = 0;
  let disc = 0;
  for (let sy = 0; sy < SS; sy++) {
    for (let sx = 0; sx < SS; sx++) {
      const x = (px - 0.5 + (sx + 0.5) / SS) / SCALE;
      const y = (py - 0.5 + (sy + 0.5) / SS) / SCALE;
      const dx = Math.abs(x - C);
      if (dx < LINE.w / 2 && Math.abs(y - C) < LINE.h / 2) line += LINE.alpha * (1 - dx / (LINE.w / 2));
      // солнце видно только над горизонтом
      if (y < C && Math.hypot(x - C, y - C) < SUN.r) disc += 1;
    }
  }
  line /= SS * SS;
  disc /= SS * SS;

  const x = px / SCALE;
  const y = py / SCALE;
  let glow = 0;
  if (y < C) {
    // тень с размытием blur — гаусс с сигмой blur / 2 вокруг круга
    const d = Math.hypot(x - C, y - C) - SUN.r;
    glow = SUN.glowAlpha * 0.5 * erfc(d / ((SUN.blur / 2) * Math.SQRT2));
  }
  const a = 1 - (1 - line) * (1 - disc) * (1 - glow);
  return [RGB[0], RGB[1], RGB[2], Math.round(a * 255)];
}

const N = SIZE * SCALE;
const bytes = writePng(new URL('../assets/splash-icon.png', import.meta.url), N, pixel);
console.log(`assets/splash-icon.png: ${N}×${N}, ${bytes} байт`);
