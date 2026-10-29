// Картинка нативного сплэша: линия горизонта и половинка солнца на прозрачном фоне.
// Размеры те же, что у первого кадра SplashOverlay (src/features/splash), поэтому подмена не видна.
// Запуск: node scripts/splash-icon.mjs. В app.json у плагина expo-splash-screen imageWidth = SIZE.
// Android 12+ показывает картинку в круге 192 dp: всё нарисованное помещается в радиус 60.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

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

const N = SIZE * SCALE;
const stride = N * 4 + 1;
const raw = Buffer.alloc(stride * N);

for (let j = 0; j < N; j++) {
  raw[j * stride] = 0; // фильтр строки: нет
  for (let i = 0; i < N; i++) {
    let line = 0;
    let disc = 0;
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const x = (i + (sx + 0.5) / SS) / SCALE;
        const y = (j + (sy + 0.5) / SS) / SCALE;
        const dx = Math.abs(x - C);
        if (dx < LINE.w / 2 && Math.abs(y - C) < LINE.h / 2) line += LINE.alpha * (1 - dx / (LINE.w / 2));
        // солнце видно только над горизонтом
        if (y < C && Math.hypot(x - C, y - C) < SUN.r) disc += 1;
      }
    }
    line /= SS * SS;
    disc /= SS * SS;

    const x = (i + 0.5) / SCALE;
    const y = (j + 0.5) / SCALE;
    let glow = 0;
    if (y < C) {
      // тень с размытием blur — гаусс с сигмой blur / 2 вокруг круга
      const d = Math.hypot(x - C, y - C) - SUN.r;
      glow = SUN.glowAlpha * 0.5 * erfc(d / ((SUN.blur / 2) * Math.SQRT2));
    }

    const a = 1 - (1 - line) * (1 - disc) * (1 - glow);
    const o = j * stride + 1 + i * 4;
    raw[o] = RGB[0];
    raw[o + 1] = RGB[1];
    raw[o + 2] = RGB[2];
    raw[o + 3] = Math.round(a * 255);
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(N, 0);
ihdr.writeUInt32BE(N, 4);
ihdr[8] = 8; // бит на канал
ihdr[9] = 6; // RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = new URL('../assets/splash-icon.png', import.meta.url);
writeFileSync(out, png);
console.log(`assets/splash-icon.png: ${N}×${N}, ${png.length} байт`);
