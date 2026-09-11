import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '../public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 產生專為 iOS 桌面極小尺寸優化的高對比信用卡圖示
function generateHighContrastIcon(size) {
  const width = size;
  const height = size;
  const rawData = Buffer.alloc((width * 4 + 1) * height);

  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;

      // 1. 滿版高質感科技夜空深藍紫漸層 (iOS 會自動上圓角，不可透明裁切)
      let r = Math.round(15 + (45 - 15) * (1 - v));
      let g = Math.round(23 + (55 - 23) * (1 - v));
      let b = Math.round(42 + (90 - 42) * (1 - v));
      let a = 255;

      // 2. 中央大尺寸高對比信用卡 (白金/冰藍金屬卡身)
      const cx = width * 0.5;
      const cy = height * 0.52;
      const cardW = width * 0.76;  // 放大卡面尺寸
      const cardH = height * 0.48;
      const cardR = size * 0.06;

      // 卡片傾斜角度 (-5度)
      const angle = -0.09;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rx = cos * (x - cx) - sin * (y - cy);
      const ry = sin * (x - cx) + cos * (y - cy);

      const inCardX = rx >= -cardW / 2 && rx <= cardW / 2;
      const inCardY = ry >= -cardH / 2 && ry <= cardH / 2;

      if (inCardX && inCardY) {
        const cdx = Math.max(0, Math.abs(rx) - (cardW / 2 - cardR));
        const cdy = Math.max(0, Math.abs(ry) - (cardH / 2 - cardR));
        const inCard = cdx * cdx + cdy * cdy <= cardR * cardR;

        if (inCard) {
          // 卡面：純淨冰白到鈦金屬藍漸層 (超高辨識度)
          const grad = (rx + cardW / 2) / cardW;
          let cr = Math.round(240 - 20 * grad);
          let cg = Math.round(245 - 15 * grad);
          let cb = Math.round(255);

          // 卡片外框精緻深色立體陰影邊
          const isBorder = Math.abs(rx) > cardW / 2 - (size * 0.015) || Math.abs(ry) > cardH / 2 - (size * 0.015);
          if (isBorder) {
            cr = 200; cg = 210; cb = 235;
          }

          // 磁條區 (深色橫條)
          const lineY = -cardH * 0.15;
          const lineH = cardH * 0.22;
          if (ry >= lineY - lineH / 2 && ry <= lineY + lineH / 2) {
            cr = 30; cg = 41; cb = 59;
          }

          // 金色 EMV 晶片 (高彩度金黃色，極度吸睛)
          const chipX = -cardW * 0.25;
          const chipY = cardH * 0.18;
          const chipW = cardW * 0.26;
          const chipH = cardH * 0.32;
          const chipR = size * 0.02;

          const chipDx = Math.max(0, Math.abs(rx - chipX) - (chipW / 2 - chipR));
          const chipDy = Math.max(0, Math.abs(ry - chipY) - (chipH / 2 - chipR));
          if (chipDx * chipDx + chipDy * chipDy <= chipR * chipR) {
            cr = 245; cg = 158; cb = 11; // 亮金色
            // 晶片微電路格線
            if (Math.abs(rx - chipX) < size * 0.01 || Math.abs(ry - chipY) < size * 0.01) {
              cr = 180; cg = 83; cb = 9; // 深金電路紋
            }
          }

          // 無線感應波紋 (NFC / WiFi Waves)
          const nfcCenterX = cardW * 0.26;
          const nfcCenterY = cardH * 0.18;
          const nfcDist = Math.hypot(rx - nfcCenterX, ry - nfcCenterY);
          if (
            (nfcDist > size * 0.04 && nfcDist < size * 0.055) ||
            (nfcDist > size * 0.075 && nfcDist < size * 0.09)
          ) {
            if (rx > nfcCenterX - size * 0.02 && ry < nfcCenterY + size * 0.08 && ry > nfcCenterY - size * 0.08) {
              cr = 59; cg = 130; cb = 246; // 亮藍色波紋
            }
          }

          r = cr;
          g = cg;
          b = cb;
        }
      }

      // 3. 右上角耀眼星芒光暈
      const spDist = Math.hypot(x - width * 0.78, y - height * 0.22);
      if (spDist < size * 0.12) {
        const spFactor = Math.max(0, 1 - spDist / (size * 0.12));
        r = Math.min(255, r + Math.round(200 * spFactor));
        g = Math.min(255, g + Math.round(180 * spFactor));
        b = Math.min(255, b + Math.round(255 * spFactor));
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(6, 9);
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(4 + 4 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeInt32BE(crc, 8 + length);
  return chunk;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return ~crc;
}

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), generateHighContrastIcon(192));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), generateHighContrastIcon(512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generateHighContrastIcon(180));

console.log('✨ 已重新產生「超高對比白金卡面 + 金色晶片」專屬桌面圖示！');
