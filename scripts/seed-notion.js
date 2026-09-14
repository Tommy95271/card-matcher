import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.NOTION_API_KEY;
const parentPageId = process.env.NOTION_PARENT_PAGE_ID;
const databaseId = process.env.NOTION_DATABASE_ID;

if (!apiKey) {
  console.error('❌ 錯誤：請先在 .env 中設定 NOTION_API_KEY！');
  process.exit(1);
}

if (!databaseId && !parentPageId) {
  console.error('❌ 錯誤：請在 .env 中設定 NOTION_DATABASE_ID（現有資料庫）或 NOTION_PARENT_PAGE_ID（母頁面 ID）！');
  process.exit(1);
}

const notion = new Client({ auth: apiKey });

// 讀取本地 merchants.json
const merchantsPath = path.join(__dirname, '../src/data/merchants.json');
const rawMerchants = fs.readFileSync(merchantsPath, 'utf-8');
const merchants = JSON.parse(rawMerchants);

async function seedNotion() {
  try {
    let targetDatabaseId = databaseId ? databaseId.replace(/-/g, '') : null;
    const nonTitleProperties = {
      '搜尋別名': {
        rich_text: {}
      },
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
      '玉山 UBear 回饋%': {
        number: {
          format: 'number'
        }
      },
      '兆豐 BT21 回饋%': {
        number: {
          format: 'number'
        }
      },
      '最佳支付建議': {
        rich_text: {}
      },
      '避坑防呆警語': {
        rich_text: {}
      },
      '是否為雷區通路': {
        checkbox: {}
      },
      '資料狀態': {
        select: {
          options: [
            { name: '有效', color: 'green' },
            { name: '已過期備份', color: 'gray' },
            { name: '草稿', color: 'yellow' }
          ]
        }
      }
    };

    if (!targetDatabaseId) {
      console.log('🚀 開始在 Notion 母頁面下建立【2026 信用卡方案與通路回饋庫】資料庫...');
      const cleanParentId = parentPageId.replace(/-/g, '');
      const dbResponse = await notion.databases.create({
        parent: {
          type: 'page_id',
          page_id: cleanParentId
        },
        title: [
          {
            type: 'text',
            text: {
              content: '💳 2026 信用卡方案與通路回饋庫'
            }
          }
        ],
        properties: {
          '店家名稱': { title: {} },
          ...nonTitleProperties
        }
      });
      targetDatabaseId = dbResponse.id;
      console.log(`✅ 成功建立 Notion 資料庫！Database ID: ${targetDatabaseId}`);

      // 更新 .env 中的 NOTION_DATABASE_ID
      const envPath = path.join(__dirname, '../.env');
      let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
      if (envContent.includes('NOTION_DATABASE_ID=')) {
        envContent = envContent.replace(/NOTION_DATABASE_ID=.*/, `NOTION_DATABASE_ID=${targetDatabaseId}`);
      } else {
        envContent += `\nNOTION_DATABASE_ID=${targetDatabaseId}\n`;
      }
      fs.writeFileSync(envPath, envContent);
      console.log('📝 已自動更新 .env 檔案中的 NOTION_DATABASE_ID。');
    } else {
      console.log(`🎯 正在檢查現有 Notion 資料庫欄位結構: ${targetDatabaseId}...`);
      const existingDb = await notion.databases.retrieve({ database_id: targetDatabaseId });
      const existingTitleProp = Object.keys(existingDb.properties).find(k => existingDb.properties[k].type === 'title') || 'Name';
      
      const updateProperties = {
        [existingTitleProp]: {
          name: '店家名稱'
        },
        ...nonTitleProperties
      };

      await notion.databases.update({
        database_id: targetDatabaseId,
        properties: updateProperties
      });
      console.log('✅ 現有資料庫欄位結構已更新就緒！');
    }

    // 2. 批次寫入所有店家資料
    console.log(`⏳ 正在批次寫入 ${merchants.length} 筆店家與回饋規則...`);
    for (let i = 0; i < merchants.length; i++) {
      const m = merchants[i];
      const cubeScheme = m.schemes.cathay_cube ? m.schemes.cathay_cube.schemeName : '一般消費';
      const taishinScheme = m.schemes.taishin_richart ? m.schemes.taishin_richart.schemeName : '一般消費';
      const ubearRate = m.schemes.esun_ubear ? m.schemes.esun_ubear.rate : 1.0;
      const megaRate = m.schemes.mega_bt21 ? m.schemes.mega_bt21.rate : 1.0;

      await notion.pages.create({
        parent: { database_id: targetDatabaseId },
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
      // 避免觸發 Notion API 速率限制 (3 requests/sec)
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    console.log('🎉 所有資料已成功注入您的 Notion 資料庫！');
  } catch (err) {
    console.error('❌ 注入過程發生錯誤:', err);
  }
}

seedNotion();
