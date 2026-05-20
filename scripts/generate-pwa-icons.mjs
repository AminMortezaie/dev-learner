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

function int32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const crcBuf = Buffer.concat([t, data]);
  return Buffer.concat([int32(data.length), t, data, int32(crc32(crcBuf))]);
}

function makePNG(size, hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const radius = Math.round(size * 0.2);

  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(size * 4 + 1);
    row[0] = 0; // filter none
    for (let x = 0; x < size; x++) {
      const dx = Math.max(radius - x, 0, x - (size - 1 - radius));
      const dy = Math.max(radius - y, 0, y - (size - 1 - radius));
      const alpha = dx * dx + dy * dy <= radius * radius ? 255 : 0;
      const i = 1 + x * 4;
      row[i] = r;
      row[i + 1] = g;
      row[i + 2] = b;
      row[i + 3] = alpha;
    }
    rows.push(row);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = pngChunk(
    "IHDR",
    Buffer.concat([int32(size), int32(size), Buffer.from([8, 6, 0, 0, 0])])
  );
  const idat = pngChunk("IDAT", deflateSync(Buffer.concat(rows)));
  const iend = pngChunk("IEND", Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

const publicDir = resolve(__dirname, "../artifacts/devlearn/public");
writeFileSync(resolve(publicDir, "pwa-192x192.png"), makePNG(192, "#FF3C00"));
writeFileSync(resolve(publicDir, "pwa-512x512.png"), makePNG(512, "#FF3C00"));
console.log("PWA icons generated.");
