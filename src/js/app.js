import cardsData from '../data/cards.json';
import merchantsData from '../data/merchants.json';
import { Engine } from './engine.js';
import { UI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  // 初始化計算引擎與 UI
  const engine = new Engine(cardsData, merchantsData);
  const ui = new UI(engine);

  // 註冊 PWA Service Worker 與無感熱更新機制
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./service-worker.js')
      .then((reg) => {
        console.log('✅ PWA Service Worker 註冊成功:', reg.scope);

        const promptNewVersion = (waitingWorker) => {
          ui.showPwaUpdatePrompt(() => {
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
          });
        };

        // 若已有安裝好等待中的 Service Worker，立即提示更新
        if (reg.waiting) {
          promptNewVersion(reg.waiting);
        }

        // 監聽是否有新版本下載完成
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              promptNewVersion(newWorker);
            }
          });
        });

        // 當手機使用者切換回 App 前景時，主動向伺服器檢查是否有新版本發布
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => {});
          }
        });

        // 每 10 分鐘背景定時檢查一次更新
        setInterval(() => {
          reg.update().catch(() => {});
        }, 10 * 60 * 1000);
      })
      .catch((err) => {
        console.warn('⚠️ PWA Service Worker 註冊失敗 (若為本機檔案預覽可略過):', err);
      });

    // 當新版 Service Worker 成功接管時，自動重新整理頁面
    let isRefreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!isRefreshing) {
        isRefreshing = true;
        window.location.reload();
      }
    });
  }
});
