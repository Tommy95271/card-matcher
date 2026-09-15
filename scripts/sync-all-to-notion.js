import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collectionGroup, getDocs } from 'firebase/firestore';

dotenv.config();

const notionApiKey = process.env.NOTION_API_KEY;
const expenseDbId = (process.env.NOTION_EXPENSES_DB_ID || process.env.NOTION_DATABASE_ID || '').replace(/-/g, '').trim();

if (!notionApiKey || !expenseDbId) {
  console.error('❌ 錯誤：請先在 .env 中設定 NOTION_API_KEY 與 NOTION_EXPENSES_DB_ID！');
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('🚀 開始全域 Notion 批次同步作業 (All Users ➔ Central Notion)...');
console.log(`📁 目標 Notion Database ID: ${expenseDbId}`);

const notion = new Client({ auth: notionApiKey });

async function fetchAllNotionRecordIds() {
  console.log('🔍 正在查詢 Notion 現有已存在的紀錄 ID 以避免重複寫入...');
  const existingIds = new Set();
  let hasMore = true;
  let nextCursor = undefined;

  while (hasMore) {
    const resp = await notion.databases.query({
      database_id: expenseDbId,
      start_cursor: nextCursor,
      page_size: 100
    });
    for (const page of resp.results) {
      const recordIdProp = page.properties['紀錄 ID'];
      if (recordIdProp && recordIdProp.rich_text && recordIdProp.rich_text.length) {
        const idVal = recordIdProp.rich_text.map((t) => t.plain_text).join('').trim();
        if (idVal) existingIds.add(idVal);
      }
    }
    hasMore = resp.has_more;
    nextCursor = resp.next_cursor;
  }
  console.log(`✅ 目前 Notion 中已有 ${existingIds.size} 筆紀錄 ID`);
  return existingIds;
}

async function run() {
  try {
    const existingNotionIds = await fetchAllNotionRecordIds();
    let recordsToSync = [];

    // 1. 嘗試讀取本地 src/data/expenses.json
    try {
      const fs = await import('fs');
      const path = await import('path');
      const localExpPath = path.resolve('src/data/expenses.json');
      if (fs.existsSync(localExpPath)) {
        const raw = fs.readFileSync(localExpPath, 'utf-8');
        const parsed = JSON.parse(raw || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`📄 找到本地 expenses.json，包含 ${parsed.length} 筆紀錄`);
          recordsToSync.push(...parsed);
        }
      }
    } catch (e) {
      console.warn('讀取本地 expenses.json 略過:', e.message);
    }

    // 2. 嘗試從 Firebase Firestore 讀取所有使用者紀錄
    try {
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      console.log('📥 正在從 Firebase Firestore (collectionGroup: expenses) 讀取所有人紀錄...');
      const snapshot = await getDocs(collectionGroup(db, 'expenses'));
      console.log(`📦 Firestore 共找到 ${snapshot.docs.length} 筆消費紀錄`);
      snapshot.docs.forEach((doc) => {
        recordsToSync.push({ id: doc.id, ...doc.data() });
      });
    } catch (fbErr) {
      if (fbErr.code === 'permission-denied') {
        console.warn('\n⚠️ 注意：Firestore 目前處於個人隔離安全規則，無法透過未驗證的 Node 腳本全域跨帳號讀取。');
        console.warn('💡 提示：日常記帳在網頁/手機 PWA 登入狀態下記帳會【自動即時秒同步至中央 Notion】，無需執行本腳本！');
        if (recordsToSync.length === 0) {
          console.log('若需匯入本地資料，請將紀錄放置於 src/data/expenses.json 後再執行一次。');
        }
      } else {
        console.warn('讀取 Firestore 失敗:', fbErr.message);
      }
    }

    // 去重
    const uniqueRecords = [];
    const seenIds = new Set();
    for (const r of recordsToSync) {
      const rId = r.id || r.notionPageId || `${r.date}_${r.amount}_${r.merchantName}`;
      if (!seenIds.has(rId)) {
        seenIds.add(rId);
        uniqueRecords.push(r);
      }
    }

    let syncedCount = 0;
    let skippedCount = 0;

    for (const data of uniqueRecords) {
      const expenseId = data.id || data.notionPageId || '';

      if (existingNotionIds.has(expenseId)) {
        skippedCount++;
        continue;
      }

      let cardNameInNotion = '國泰世華 CUBE 卡';
      if (data.cardId === 'taishin_richart' || (data.cardName && data.cardName.includes('台新'))) {
        cardNameInNotion = '台新 Richart 卡';
      } else if (data.cardId === 'esun_ubear' || (data.cardName && data.cardName.includes('玉山'))) {
        cardNameInNotion = '玉山 UBear 信用卡';
      } else if (data.cardId === 'mega_bt21' || (data.cardName && data.cardName.includes('兆豐'))) {
        cardNameInNotion = '兆豐宇宙明星 BT21 卡';
      }

      let statusInNotion = '🟡 待核對';
      if (data.status === 'verified') statusInNotion = '🟢 已入帳';
      else if (data.status === 'discrepancy') statusInNotion = '🔴 漏給需申訴';

      const userTag = (data.userIdentifier || data.userName || data.userEmail || '雲端同步使用者').trim().slice(0, 100);

      const body = {
        parent: { database_id: expenseDbId },
        properties: {
          '消費項目': {
            title: [{ text: { content: data.merchantName || '一般消費' } }]
          },
          '記帳人': {
            select: { name: userTag.replace(/,/g, '') }
          },
          '消費日期': {
            date: { start: data.date || new Date().toISOString().slice(0, 10) }
          },
          '刷卡金額': {
            number: Number(data.amount) || 0
          },
          '信用卡': {
            select: { name: cardNameInNotion }
          },
          '適用方案': {
            rich_text: [{ text: { content: `${data.schemeName || '一般消費'} (${data.rate || 0}%)` } }]
          },
          '回饋率%': {
            number: Number(data.rate) || 0
          },
          '預期回饋點數': {
            number: parseInt(data.expectedPoints, 10) || 0
          },
          '實收回饋點數': {
            number: (data.actualPoints !== null && data.actualPoints !== undefined) ? parseInt(data.actualPoints, 10) : 0
          },
          '核對狀態': {
            select: { name: statusInNotion }
          },
          '紀錄 ID': {
            rich_text: [{ text: { content: expenseId } }]
          },
          '備註': {
            rich_text: [{ text: { content: data.notes || '' } }]
          }
        }
      };

      await notion.pages.create(body);
      existingNotionIds.add(expenseId);
      syncedCount++;
      console.log(`  [+${syncedCount}] 成功匯入【${data.merchantName || '消費'}】NT$ ${data.amount} (記帳人: ${userTag})`);
      
      // 避免觸發 Notion API 頻率限制
      await new Promise((r) => setTimeout(r, 350));
    }

    console.log(`\n🎉 全域 Notion 同步完成！成功補拋: ${syncedCount} 筆，略過已存在: ${skippedCount} 筆。`);
    process.exit(0);
  } catch (err) {
    console.error('❌ 同步發生錯誤:', err);
    process.exit(1);
  }
}

run();
