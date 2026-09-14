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

async function pushLocalExpensesToNotion() {
  try {
    const expensesPath = path.join(__dirname, '../src/data/expenses.json');
    if (!fs.existsSync(expensesPath)) {
      console.log('ℹ️ 目前尚無本機 expenses.json');
      return;
    }

    const localExpenses = JSON.parse(fs.readFileSync(expensesPath, 'utf-8'));
    console.log(`⏳ 正在將 ${localExpenses.length} 筆本機消費紀錄同步至 Notion...`);

    for (let i = 0; i < localExpenses.length; i++) {
      const exp = localExpenses[i];

      let cardNameInNotion = '國泰世華 CUBE 卡';
      if (exp.cardId === 'taishin_richart') cardNameInNotion = '台新 Richart 卡';
      else if (exp.cardId === 'esun_ubear') cardNameInNotion = '玉山 UBear 信用卡';
      else if (exp.cardId === 'mega_bt21') cardNameInNotion = '兆豐宇宙明星 BT21 卡';

      let statusInNotion = '🟡 待核對';
      if (exp.status === 'verified') statusInNotion = '🟢 已入帳';
      else if (exp.status === 'discrepancy') statusInNotion = '🔴 漏給需申訴';

      await notion.pages.create({
        parent: { database_id: expenseDbId.replace(/-/g, '') },
        properties: {
          '消費項目': {
            title: [{ text: { content: exp.merchantName } }]
          },
          '消費日期': {
            date: { start: exp.date || new Date().toISOString().slice(0, 10) }
          },
          '刷卡金額': {
            number: parseFloat(exp.amount) || 0
          },
          '信用卡': {
            select: { name: cardNameInNotion }
          },
          '適用方案': {
            rich_text: [{ text: { content: `${exp.schemeName} (${exp.rate}%)` } }]
          },
          '回饋率%': {
            number: parseFloat(exp.rate) || 0
          },
          '預期回饋點數': {
            number: parseInt(exp.expectedPoints) || 0
          },
          '實收回饋點數': {
            number: exp.actualPoints !== null ? parseInt(exp.actualPoints) : 0
          },
          '核對狀態': {
            select: { name: statusInNotion }
          },
          '備註': {
            rich_text: [{ text: { content: exp.notes || '' } }]
          }
        }
      });

      console.log(` [${i + 1}/${localExpenses.length}] 已同步至 Notion: ${exp.merchantName} (NT$${exp.amount})`);
      await new Promise((r) => setTimeout(r, 350));
    }

    console.log('🎉 所有消費紀錄已成功寫入 Notion 資料庫！');
  } catch (err) {
    console.error('❌ 同步至 Notion 發生錯誤:', err);
  }
}

pushLocalExpensesToNotion();
