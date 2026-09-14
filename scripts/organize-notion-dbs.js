import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.NOTION_API_KEY;
const parentPageId = '3d8dc85d-79dc-80aa-8b35-ff9cfa770c38';
const oldMerchantDbId = process.env.NOTION_DATABASE_ID;
const oldExpenseDbId = process.env.NOTION_EXPENSES_DB_ID;

if (!apiKey) {
  console.error('❌ 錯誤：請先在 .env 中設定 NOTION_API_KEY！');
  process.exit(1);
}

const notion = new Client({ auth: apiKey });

async function organizeNotionDbs() {
  try {
    console.log('🚀 開始在 Notion 母頁面下建立【🗃️ 2026 信用卡資料庫專區】容器頁面...');

    // 1. 建立「🗃️ 2026 信用卡資料庫專區」頁面
    const dbContainerPage = await notion.pages.create({
      parent: { page_id: parentPageId },
      icon: { type: 'emoji', emoji: '🗃️' },
      properties: {
        title: [{ text: { content: '🗃️ 2026 信用卡資料庫專區 (Databases)' } }]
      },
      children: [
        {
          object: 'block',
          type: 'callout',
          callout: {
            icon: { type: 'emoji', emoji: '💡' },
            rich_text: [{ type: 'text', text: { content: '此頁面集中管理「特約通路方案回饋庫」與「刷卡記帳對帳庫」，與信用卡查詢系統自動雙向同步。' } }]
          }
        }
      ]
    });

    const newContainerPageId = dbContainerPage.id;
    console.log(`✅ 已建立資料庫專屬頁面！ID: ${newContainerPageId}`);

    // 2. 在新頁面下建立【💳 2026 信用卡方案與通路回饋庫】
    console.log('📦 正在新頁面下建立【💳 2026 信用卡方案與通路回饋庫】...');
    const newMerchantDb = await notion.databases.create({
      parent: { type: 'page_id', page_id: newContainerPageId },
      icon: { type: 'emoji', emoji: '🏪' },
      title: [{ type: 'text', text: { content: '🏪 2026 信用卡方案與特約通路庫' } }],
      properties: {
        '店家名稱': { title: {} },
        '搜尋別名': { rich_text: {} },
        '消費分類': {
          select: {
            options: [
              { name: '四大超商', color: 'blue' },
              { name: '量販超市', color: 'green' },
              { name: '網購電商', color: 'orange' },
              { name: '美食餐飲', color: 'red' },
              { name: '外送平台', color: 'yellow' },
              { name: '手搖飲料', color: 'pink' },
              { name: '百貨商場', color: 'purple' },
              { name: '居家生活', color: 'brown' },
              { name: '交通旅遊', color: 'blue' },
              { name: '航空機票', color: 'blue' },
              { name: '海外消費', color: 'purple' },
              { name: '旅遊訂房', color: 'green' },
              { name: '加油充電', color: 'yellow' },
              { name: '影音娛樂', color: 'red' },
              { name: 'AI 服務', color: 'purple' },
              { name: '藥妝美妝', color: 'pink' },
              { name: '生活百貨', color: 'green' },
              { name: '生活繳費', color: 'gray' },
              { name: '政府稅款', color: 'gray' },
              { name: '公立醫療', color: 'gray' }
            ]
          }
        },
        '國泰 CUBE 方案': {
          select: {
            options: [
              { name: '玩數位', color: 'blue' },
              { name: '樂饗購', color: 'red' },
              { name: '趣旅行', color: 'purple' },
              { name: '集精選', color: 'green' },
              { name: '全支付', color: 'orange' },
              { name: '台塑家', color: 'yellow' },
              { name: '慶生月', color: 'pink' },
              { name: '童樂匯', color: 'brown' },
              { name: '固定回饋', color: 'gray' },
              { name: '一般消費', color: 'default' }
            ]
          }
        },
        '台新 Richart 方案': {
          select: {
            options: [
              { name: 'Chill 刷 (10%)', color: 'red' },
              { name: 'Pay 著刷 (3.8%)', color: 'orange' },
              { name: '天天刷 (3.3%)', color: 'blue' },
              { name: '大筆刷 (3.3%)', color: 'purple' },
              { name: '好饗刷 (3.3%)', color: 'yellow' },
              { name: '數趣刷 (3.3%)', color: 'green' },
              { name: '玩旅刷 (3.3%)', color: 'blue' },
              { name: '假日刷 (2.0%)', color: 'pink' },
              { name: '一般消費', color: 'default' }
            ]
          }
        },
        '玉山 UBear 回饋%': { number: { format: 'number' } },
        '兆豐 BT21 回饋%': { number: { format: 'number' } },
        '最佳支付建議': { rich_text: {} },
        '避坑防呆警語': { rich_text: {} },
        '是否為雷區通路': { checkbox: {} },
        '資料狀態': {
          select: {
            options: [
              { name: '有效', color: 'green' },
              { name: '已過期備份', color: 'gray' },
              { name: '草稿', color: 'yellow' }
            ]
          }
        }
      }
    });
    console.log(`✅ 已建立新特約通路資料庫！ID: ${newMerchantDb.id}`);

    // 3. 在新頁面下建立【💳 2026 刷卡記帳與點數對帳庫】
    console.log('📦 正在新頁面下建立【💳 2026 刷卡記帳與點數對帳庫】...');
    const newExpenseDb = await notion.databases.create({
      parent: { type: 'page_id', page_id: newContainerPageId },
      icon: { type: 'emoji', emoji: '💳' },
      title: [{ type: 'text', text: { content: '💳 2026 刷卡記帳與點數對帳庫' } }],
      properties: {
        '消費項目': { title: {} },
        '消費日期': { date: {} },
        '刷卡金額': { number: { format: 'new_taiwan_dollar' } },
        '信用卡': {
          select: {
            options: [
              { name: '國泰世華 CUBE 卡', color: 'green' },
              { name: '台新 Richart 卡', color: 'red' },
              { name: '玉山 UBear 信用卡', color: 'blue' },
              { name: '兆豐宇宙明星 BT21 卡', color: 'purple' }
            ]
          }
        },
        '適用方案': { rich_text: {} },
        '回饋率%': { number: { format: 'number' } },
        '預期回饋點數': { number: { format: 'number' } },
        '實收回饋點數': { number: { format: 'number' } },
        '核對狀態': {
          select: {
            options: [
              { name: '🟡 待核對', color: 'yellow' },
              { name: '🟢 已入帳', color: 'green' },
              { name: '🔴 漏給需申訴', color: 'red' }
            ]
          }
        },
        '備註': { rich_text: {} },
        '客服申訴話術': { rich_text: {} }
      }
    });
    console.log(`✅ 已建立新刷卡對帳資料庫！ID: ${newExpenseDb.id}`);

    // 4. 更新 .env 檔案中的 Database IDs
    const envPath = path.join(__dirname, '../.env');
    let envContent = `NOTION_API_KEY=${apiKey}\nNOTION_DATABASE_ID=${newMerchantDb.id.replace(/-/g, '')}\nNOTION_EXPENSES_DB_ID=${newExpenseDb.id.replace(/-/g, '')}\n`;
    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log('📝 已更新 .env 檔案指向新頁面下的資料庫。');

    // 5. 將所有 60 筆特約店家資料移入新資料庫
    const merchantsPath = path.join(__dirname, '../src/data/merchants.json');
    if (fs.existsSync(merchantsPath)) {
      const merchants = JSON.parse(fs.readFileSync(merchantsPath, 'utf-8'));
      console.log(`⏳ 正在將 ${merchants.length} 筆店家資料寫入新資料庫...`);

      for (let i = 0; i < merchants.length; i++) {
        const m = merchants[i];
        const cubeScheme = m.schemes.cathay_cube ? m.schemes.cathay_cube.schemeName : '一般消費';
        const taishinScheme = m.schemes.taishin_richart ? m.schemes.taishin_richart.schemeName : '一般消費';
        const ubearRate = m.schemes.esun_ubear ? m.schemes.esun_ubear.rate : 1.0;
        const megaRate = m.schemes.mega_bt21 ? m.schemes.mega_bt21.rate : 1.0;

        await notion.pages.create({
          parent: { database_id: newMerchantDb.id },
          properties: {
            '店家名稱': {
              title: [{ text: { content: m.name } }]
            },
            '搜尋別名': {
              rich_text: [{ text: { content: m.aliases.join(', ') } }]
            },
            '消費分類': {
              select: { name: m.categoryName || '生活百貨' }
            },
            '國泰 CUBE 方案': {
              select: { name: cubeScheme }
            },
            '台新 Richart 方案': {
              select: { name: taishinScheme }
            },
            '玉山 UBear 回饋%': {
              number: ubearRate
            },
            '兆豐 BT21 回饋%': {
              number: megaRate
            },
            '最佳支付建議': {
              rich_text: [{ text: { content: m.paymentAdvice || '' } }]
            },
            '避坑防呆警語': {
              rich_text: [{ text: { content: m.pitfallWarning || '' } }]
            },
            '是否為雷區通路': {
              checkbox: !!m.isPitfall
            },
            '資料狀態': {
              select: { name: '有效' }
            }
          }
        });

        console.log(` [${i + 1}/${merchants.length}] 已注入: ${m.name}`);
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }

    // 6. 歸檔舊的散落在外面的資料庫（若有）
    try {
      if (oldMerchantDbId) {
        console.log('🧹 正在清理外層舊資料庫...');
        await notion.databases.update({
          database_id: oldMerchantDbId.replace(/-/g, ''),
          archived: true
        });
      }
      if (oldExpenseDbId) {
        await notion.databases.update({
          database_id: oldExpenseDbId.replace(/-/g, ''),
          archived: true
        });
      }
      console.log('✨ 舊資料庫已歸檔清理！');
    } catch (cleanErr) {
      console.log('ℹ️ 舊資料庫清理提示:', cleanErr.message);
    }

    console.log('🎉 所有資料庫已成功移入【🗃️ 2026 信用卡資料庫專區】內層頁面！');
  } catch (err) {
    console.error('❌ 搬移過程發生錯誤:', err);
  }
}

organizeNotionDbs();
