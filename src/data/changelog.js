/**
 * 2026 信用卡最佳方案與商店查詢系統 - 系統開發與更新日誌
 */
export const CHANGELOG_DATA = [
  {
    version: 'v2026.4.0',
    date: '2026-09-15',
    title: '頂部導覽列整合：單一入口個人與二級下拉選單',
    highlights: [
      {
        tag: 'feat',
        label: '✨ 導覽整合',
        desc: '將原先分散之 Google 帳號狀態與設定按鈕整合成單一個人膠囊按鈕，點擊展開精緻二級下拉選單。'
      },
      {
        tag: 'ui',
        label: '🎨 靜奢下拉',
        desc: '採用 Taste Skill v2 啞光微毛玻璃卡片、細緻 1px 邊框與浮層進場微動畫，並支援點擊外部與 Escape 鍵關閉。'
      },
      {
        tag: 'ux',
        label: '💡 體驗強化',
        desc: '選單內整合持卡設定、系統開發日誌、專案介紹、同步除錯日誌與 Google 登入/登出快速入口。'
      }
    ]
  },
  {
    version: 'v2026.3.2',
    date: '2026-09-15',
    title: '淺色模式純淨重構與人機互動體驗優化',
    highlights: [
      {
        tag: 'fix',
        label: '🐞 錯誤修復',
        desc: '徹底修正日間淺色模式下的背景色彩與文字對比度，全面採用純淨象牙白 (#F6F8FA) 與高對比深石墨字體。'
      },
      {
        tag: 'ui',
        label: '🎨 互動體驗',
        desc: '修正主題切換按鈕圖示人機互動邏輯（深色模式顯示 ☀️ 提示切換日間、淺色模式顯示 🌙 提示切換夜間），並同步更新手機狀態列。'
      }
    ]
  },
  {
    version: 'v2026.3.0',
    date: '2026-09-14',
    title: 'Taste Skill v2 靜奢冷淡風全面重構與三大核心功能升級',
    highlights: [
      {
        tag: 'ui',
        label: '🎨 靜奢美學',
        desc: '導入 Taste Skill v2 (Quiet Luxury) 設計規範，全面替換刺眼霓虹光暈，採用沉穩黑曜石 (#0F1217) 與 1px 啞光邊框。'
      },
      {
        tag: 'feat',
        label: '✨ 智慧記帳',
        desc: '「記一筆」新增動態歷史常用店家分析，智慧計算個人消費頻率最高的 Top 5 組合一鍵快速帶入。'
      },
      {
        tag: 'feat',
        label: '🚪 帳號防呆',
        desc: '新增 Google 帳號登出二次確認彈窗，防止手滑誤觸登出。'
      },
      {
        tag: 'perf',
        label: '⚡ 效能躍升',
        desc: '實現 0ms 零感知主題秒切換，消除多層毛玻璃在 GPU 上的影格重算卡頓。'
      }
    ]
  },
  {
    version: 'v2026.2.0',
    date: '2026-09-12',
    title: '點數對帳與查核中心、雙軌雲端同步上線',
    highlights: [
      {
        tag: 'feat',
        label: '📊 點數查核',
        desc: '推出當月累積刷卡、預期點數試算、漏給警示與一鍵生成客服申訴話術功能。'
      },
      {
        tag: 'feat',
        label: '🔄 雙軌同步',
        desc: '整合 Google Firebase Firestore 秒級跨裝置同步與中央 Notion 雲端對帳庫。'
      },
      {
        tag: 'feat',
        label: '📋 同步診斷',
        desc: '新增即時連線健康指標與詳細同步除錯日誌視窗。'
      }
    ]
  },
  {
    version: 'v2026.1.0',
    date: '2026-09-01',
    title: '2026 四大神卡回饋試算引擎正式上線',
    highlights: [
      {
        tag: 'feat',
        label: '💳 四大神卡',
        desc: '完整支援國泰世華 CUBE 卡（7大權益方案）、台新 Richart 玫瑰/太陽卡（8大方案）、玉山 U Bear 卡及兆豐 BT21 信用卡。'
      },
      {
        tag: 'feat',
        label: '⚠️ 避坑指南',
        desc: '內建全家/7-11/全聯等 MCC 特店不回饋雷區警語與最優支付路徑建議。'
      },
      {
        tag: 'feat',
        label: '📱 PWA 支援',
        desc: '支援離線 PWA 安裝至手機主畫面與無感背景即時更新。'
      }
    ]
  }
];
