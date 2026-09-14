import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.NOTION_API_KEY;
const expenseDbId = process.env.NOTION_EXPENSES_DB_ID;

if (!apiKey || !expenseDbId) {
  console.error('❌ 錯誤：請在 .env 中設定 NOTION_API_KEY 與 NOTION_EXPENSES_DB_ID！');
  process.exit(1);
}

const notion = new Client({ auth: apiKey });

function getRichText(property) {
  if (!property || !property.rich_text || !property.rich_text.length) return '';
  return property.rich_text.map((t) => t.plain_text).join('');
}

function getTitle(property) {
  if (!property || !property.title || !property.title.length) return '';
  return property.title.map((t) => t.plain_text).join('');
}

async function syncExpenses() {
  try {
    console.log('🔄 正在從 Notion【💳 2026 刷卡記帳與點數對帳庫】拉取最新消費紀錄...');

    let allPages = [];
    let hasMore = true;
    let nextCursor = undefined;

    while (hasMore) {
      const resp = await notion.databases.query({
        database_id: expenseDbId.replace(/-/g, ''),
        start_cursor: nextCursor,
        page_size: 100,
        sorts: [{ property: '消費日期', direction: 'descending' }]
      });
      allPages = allPages.concat(resp.results);
      hasMore = resp.has_more;
      nextCursor = resp.next_cursor;
    }

    console.log(`📥 成功從 Notion 取得 ${allPages.length} 筆記帳資料`);

    const expenses = allPages.map((page) => {
      const props = page.properties;
      const merchantName = getTitle(props['消費項目']);
      const date = props['消費日期']?.date?.start || new Date().toISOString().slice(0, 10);
      const amount = props['刷卡金額']?.number || 0;
      const cardName = props['信用卡']?.select?.name || '國泰世華 CUBE 卡';
      const schemeName = getRichText(props['適用方案']) || '一般消費';
      const rate = props['回饋率%']?.number || 0;
      const expectedPoints = props['預期回饋點數']?.number || 0;
      const actualPoints = props['實收回饋點數']?.number ?? null;
      const statusRaw = props['核對狀態']?.select?.name || '🟡 待核對';
      const notes = getRichText(props['備註']);

      let status = 'pending';
      if (statusRaw.includes('已入帳')) status = 'verified';
      else if (statusRaw.includes('漏給')) status = 'discrepancy';

      let cardId = 'cathay_cube';
      let bank = '國泰世華';
      if (cardName.includes('台新')) {
        cardId = 'taishin_richart';
        bank = '台新銀行';
      } else if (cardName.includes('玉山')) {
        cardId = 'esun_ubear';
        bank = '玉山銀行';
      } else if (cardName.includes('兆豐')) {
        cardId = 'mega_bt21';
        bank = '兆豐銀行';
      }

      return {
        id: `exp_notion_${page.id.replace(/-/g, '').slice(0, 8)}`,
        notionPageId: page.id,
        date,
        merchantName,
        amount,
        cardId,
        cardName,
        bank,
        schemeName,
        rate,
        expectedPoints,
        actualPoints,
        unit: (cardId === 'esun_ubear' || cardId === 'mega_bt21') ? '元' : '點',
        rewardName: (cardId === 'cathay_cube') ? '小樹點' : (cardId === 'taishin_richart' ? '台新Point' : '現金折抵'),
        status,
        notes,
        createdAt: page.created_time
      };
    });

    const expensesPath = path.join(__dirname, '../src/data/expenses.json');
    fs.writeFileSync(expensesPath, JSON.stringify(expenses, null, 2), 'utf-8');
    console.log(`✅ 已成功同步 ${expenses.length} 筆資料至 src/data/expenses.json！`);
  } catch (err) {
    console.error('❌ 同步失敗:', err);
  }
}

syncExpenses();
