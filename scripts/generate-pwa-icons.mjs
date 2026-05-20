import { deflateSync } from "zlib";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function int32(n) { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; }

function pngChunk(type, data) {
  const t = Buffer.from(type, "ascii");
  return Buffer.concat([int32(data.length), t, data, int32(crc32(Buffer.concat([t, data])))]);
}

// Draw a pixel with anti-aliased coverage [0..1]
function blend(base, r, g, b, a, coverage) {
  const alpha = (a / 255) * coverage;
  return [
    Math.round(base[0] * (1 - alpha) + r * alpha),
    Math.round(base[1] * (1 - alpha) + g * alpha),
    Math.round(base[2] * (1 - alpha) + b * alpha),
    255,
  ];
}

function makePNG(size) {
  // Gradient background: top-left #FF5C1A → bottom-right #CC2800
  const r1 = 0xFF, g1 = 0x5C, b1 = 0x1A;
  const r2 = 0xCC, g2 = 0x28, b2 = 0x00;
  const radius = Math.round(size * 0.214); // rx/180 * 38 ≈ 0.214
  const sw = Math.max(2, Math.round(size * 0.079)); // stroke width for chevron

  const pixels = [];

  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (size * 2);
      const br = Math.round(r1 + (r2 - r1) * t);
      const bg = Math.round(g1 + (g2 - g1) * t);
      const bb = Math.round(b1 + (b2 - b1) * t);

      // Rounded rect clip
      const dx = Math.max(radius - x, 0, x - (size - 1 - radius));
      const dy = Math.max(radius - y, 0, y - (size - 1 - radius));
      const inside = dx * dx + dy * dy <= radius * radius;
      if (!inside) { row.push([0, 0, 0, 0]); continue; }

      row.push([br, bg, bb, 255]);
    }
    pixels.push(row);
  }

  // Draw chevron > using line segment (p1→tip→p2) with stroke width
  const margin = size * 0.18;
  const chevLeft = margin;
  const chevRight = size * 0.434;
  const chevMid = size / 2;
  const chevTop = size * 0.306;
  const chevBot = size * 0.694;

  // Draw line segment from (x1,y1) to (x2,y2)
  function drawLine(x1, y1, x2, y2) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const nx = (y2 - y1) / len, ny = -(x2 - x1) / len; // normal
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Distance from point to line segment
        const t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / (len * len)));
        const cx = x1 + t * (x2 - x1), cy = y1 + t * (y2 - y1);
        const dist = Math.hypot(x - cx, y - cy);
        const half = sw / 2;
        if (dist < half + 1) {
          const coverage = Math.max(0, Math.min(1, half + 1 - dist));
          if (pixels[y]?.[x]?.[3]) {
            pixels[y][x] = blend(pixels[y][x], 255, 255, 255, 255, coverage);
          }
        }
      }
    }
  }

  drawLine(chevLeft, chevTop, chevRight, chevMid);
  drawLine(chevRight, chevMid, chevLeft, chevBot);

  // Draw _ cursor bar
  const cursorX1 = size * 0.511;
  const cursorX2 = size * 0.844;
  const cursorY = size * 0.678;
  drawLine(cursorX1, cursorY, cursorX2, cursorY);

  // Encode as RGBA PNG
  const rows = pixels.map(row => {
    const buf = Buffer.alloc(row.length * 4 + 1);
    buf[0] = 0;
    row.forEach(([r, g, b, a], i) => {
      buf[1 + i * 4] = r; buf[2 + i * 4] = g; buf[3 + i * 4] = b; buf[4 + i * 4] = a;
    });
    return buf;
  });

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = pngChunk("IHDR", Buffer.concat([int32(size), int32(size), Buffer.from([8, 6, 0, 0, 0])]));
  const idat = pngChunk("IDAT", deflateSync(Buffer.concat(rows)));
  const iend = pngChunk("IEND", Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

const publicDir = resolve(__dirname, "../artifacts/devlearn/public");
writeFileSync(resolve(publicDir, "pwa-192x192.png"), makePNG(192));
writeFileSync(resolve(publicDir, "pwa-512x512.png"), makePNG(512));
console.log("PWA icons generated.");
