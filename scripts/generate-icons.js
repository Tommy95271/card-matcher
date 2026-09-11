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

// 產生精緻信用卡圖示 (含漸層背景、卡片外框、晶片、晶亮光澤)
function generateAppIcon(size) {
  const width = size;
  const height = size;
  const rawData = Buffer.alloc((width * 4 + 1) * height);

  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;

      // 1. 底層圓角背景：科技靛藍到深紫漸層
      let r = Math.round(30 + (99 - 30) * (1 - v) + 20 * u);
      let g = Math.round(27 + (102 - 27) * (1 - v));
      let b = Math.round(75 + (241 - 75) * (1 - v) + 14 * u);
      let a = 255;

      // 圓角外裁切
      const bgRadius = size * 0.22;
      const cornerDists = [
        [bgRadius - x, bgRadius - y],
        [x - (width - bgRadius), bgRadius - y],
        [bgRadius - x, y - (height - bgRadius)],
        [x - (width - bgRadius), y - (height - bgRadius)]
      ];
      for (const [dx, dy] of cornerDists) {
        if (dx > 0 && dy > 0 && dx * dx + dy * dy > bgRadius * bgRadius) {
          a = 0;
          break;
        }
      }

      if (a > 0) {
        // 2. 繪製中央微傾斜的高質感信用卡 (Card Silhouette)
        // 卡片尺寸與中心點
        const cx = width * 0.5;
        const cy = height * 0.52;
        const cardW = width * 0.68;
        const cardH = height * 0.44;
        const cardR = size * 0.05;

        // 計算點到卡片中心的旋轉座標 (稍微傾斜 -6 度)
        const angle = -0.10;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rx = cos * (x - cx) - sin * (y - cy);
        const ry = sin * (x - cx) + cos * (y - cy);

        const inCardX = rx >= -cardW / 2 && rx <= cardW / 2;
        const inCardY = ry >= -cardH / 2 && ry <= cardH / 2;

        if (inCardX && inCardY) {
          // 檢查卡片圓角
          const cdx = Math.max(0, Math.abs(rx) - (cardW / 2 - cardR));
          const cdy = Math.max(0, Math.abs(ry) - (cardH / 2 - cardR));
          const inCard = cdx * cdx + cdy * cdy <= cardR * cardR;

          if (inCard) {
            // 卡片本體：炫彩金屬紫青漸層 + 亮面反光
            const cardFactor = (rx + cardW / 2) / cardW;
            let cr = Math.round(245 - 60 * cardFactor);
            let cg = Math.round(180 + 30 * cardFactor);
            let cb = Math.round(255);

            // 卡片邊框高光
            const isBorder = Math.abs(rx) > cardW / 2 - 2.5 || Math.abs(ry) > cardH / 2 - 2.5;
            if (isBorder) {
              cr = 255; cg = 255; cb = 255;
            }

            // 晶片區塊 (EMV Chip)
            const chipX = -cardW * 0.28;
            const chipY = -cardH * 0.12;
            const chipW = cardW * 0.22;
            const chipH = cardH * 0.30;
            if (rx >= chipX - chipW / 2 && rx <= chipX + chipW / 2 && ry >= chipY - chipH / 2 && ry <= chipY + chipH / 2) {
              // 金色晶片
              cr = 250; cg = 204; cb = 21; // 金黃色
              // 晶片十字刻痕
              if (Math.abs(rx - chipX) < 1 || Math.abs(ry - chipY) < 1) {
                cr = 217; cg = 119; cb = 6; // 深金
              }
            }

            // 磁條/裝飾線條
            const lineY = cardH * 0.22;
            if (ry >= lineY && ry <= lineY + size * 0.02) {
              cr = Math.round(cr * 0.6);
              cg = Math.round(cg * 0.6);
              cb = Math.round(cb * 0.8);
            }

            // 無線感應圖示 (WiFi wave dots)
            const wifiDist = Math.hypot(rx - cardW * 0.28, ry - (-cardH * 0.12));
            if (wifiDist > size * 0.04 && wifiDist < size * 0.055 && rx > cardW * 0.28) {
              cr = 255; cg = 255; cb = 255;
            }

            r = cr;
            g = cg;
            b = cb;
          }
        }

        // 3. 右上方小閃光 (Sparkle)
        const spDist = Math.hypot(x - width * 0.78, y - height * 0.24);
        if (spDist < size * 0.06) {
          const spFactor = Math.max(0, 1 - spDist / (size * 0.06));
          r = Math.min(255, r + Math.round(255 * spFactor));
          g = Math.min(255, g + Math.round(255 * spFactor));
          b = Math.min(255, b + Math.round(255 * spFactor));
        }
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

// 產生帶信用卡圖形的清晰圖示
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), generateAppIcon(192));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), generateAppIcon(512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generateAppIcon(180));

console.log('✨ 已成功生成包含「信用卡與金色晶片圖樣」的高解析度 PWA App 圖示！');
