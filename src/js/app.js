import cardsData from '../data/cards.json';
import merchantsData from '../data/merchants.json';
import { Engine } from './engine.js';
import { UI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  // 初始化計算引擎與 UI
  const engine = new Engine(cardsData, merchantsData);
  const ui = new UI(engine);

  // 註冊 PWA Service Worker
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./service-worker.js')
      .then((reg) => {
        console.log('✅ PWA Service Worker 註冊成功:', reg.scope);
      })
      .catch((err) => {
        console.warn('⚠️ PWA Service Worker 註冊失敗 (若為本機檔案預覽可略過):', err);
      });
  }
});
