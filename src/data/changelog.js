/**
 * 2026 信用卡最佳方案與商店查詢系統 - 系統開發與更新日誌
 */
export const CHANGELOG_DATA = [
  {
    version: 'v2026.4.3',
    date: '2026-11-09',
    title: '全域資安加固 (Firestore 多租戶隔離、XSS 注入防護與安全防禦 Headers)',
    highlights: [
      {
        tag: 'security',
        label: '🛡️ Firestore 租戶權限隔離',
        desc: '重構安全規則 (firestore.rules)，將 expenses 與 profile 嚴格限制為僅本人 UID 可讀寫，杜絕匿名爬取與跨租戶未授權竄改 (IDOR)。'
      },
      {
        tag: 'security',
        label: '🔒 XSS 跨站腳本注入防護',
        desc: '引進全域 escapeHtml 安全轉義機制，全面防禦記帳備註、自訂店家名稱與同步日誌的 Stored / DOM-based XSS 攻擊。'
      },
      {
        tag: 'security',
        label: '🌐 安全性 HTTP Headers 部署',
        desc: '在 Firebase Hosting 注入 X-Content-Type-Options: nosniff、X-Frame-Options: DENY 與 Referrer-Policy 標頭，阻擋點擊劫持與 MIME 探測。'
      }
    ]
  },
  {
    version: 'v2026.4.2',
    date: '2026-11-09',
    title: '特殊支付通路重點標記與指定行動支付防呆提醒',
    highlights: [
      {
        tag: 'feat',
        label: '🚨 勿刷實體卡警示',
        desc: '針對超商（7-11/全家/萊爾富/OK）與全聯等不支援直接刷實體卡或 0% 排除之通路，新增高能見度「特殊支付限定橫幅」與徽章（如 台新 Pay / 全盈+PAY）。'
      },
      {
        tag: 'ux',
        label: '📱 方案與結帳聯動',
        desc: '卡片推薦方案旁直接標註必備行動支付方式，並在「⚡ 記一筆」時自動預填備註與提供即時防呆提示，避免櫃檯誤掏實體卡。'
      },
      {
        tag: 'data',
        label: '🏪 四大超商與量販資料擴充',
        desc: '補齊萊爾富與 OK 超商特約資料，結構化建立 disallowPhysicalCard 與 requiredPayments 欄位。'
      }
    ]
  },
  {
    version: 'v2026.4.1',
    date: '2026-09-15',
    title: '介面極簡降噪與典雅視覺重構',
    highlights: [
      {
        tag: 'ui',
        label: '🎨 視覺降噪',
        desc: '去除分類標籤與介面多餘的裝飾性 Emoji，採用低調奢華 (Quiet Luxury) 純文字微膠囊，大幅提升介面呼吸感。'
      },
      {
        tag: 'ux',
        label: '💡 方案微膠囊',
        desc: '將原本龐大的今日方案鎖定區塊重構為搜尋框下方的緊湊微膠囊列，消除第一屏視覺壓迫感。'
      },
      {
        tag: 'fix',
        label: '⚠️ 警語強化',
        desc: '保持並強化避坑防呆警語的高對比琥珀金色系與醒目字體，確保關鍵刷卡限制一目了然。'
      }
    ]
  },
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
        desc: '選單內整合持卡設定、系統開發日誌、專案介紹、同步除錯日誌與 Google 登入/登出快速入口；同步精簡卡片設定彈窗，移除重複之日誌按鈕。'
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
