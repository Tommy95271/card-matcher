import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.NOTION_API_KEY;
const databaseId = process.env.NOTION_DATABASE_ID;

if (!apiKey || !databaseId) {
  console.error('❌ 錯誤：請先在 .env 中設定 NOTION_API_KEY 與 NOTION_DATABASE_ID！');
  process.exit(1);
}

const notion = new Client({ auth: apiKey });

const merchantsPath = path.join(__dirname, '../src/data/merchants.json');
const backupsDir = path.join(__dirname, '../src/data/backups');

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// 輔助函式：從 Rich Text 陣列提取字串
function getRichText(property) {
  if (!property || !property.rich_text || !property.rich_text.length) return '';
  return property.rich_text.map((t) => t.plain_text).join('');
}

// 輔助函式：從 Title 提取字串
function getTitle(property) {
  if (!property || !property.title || !property.title.length) return '';
  return property.title.map((t) => t.plain_text).join('');
}

async function syncNotion() {
  try {
    console.log('🔄 正在從 Notion 資料庫拉取最新店家與方案回饋資料...');

    const response = await notion.databases.query({
      database_id: databaseId.replace(/-/g, '')
    });

    const results = response.results;
    console.log(`📥 成功取得 ${results.length} 筆資料`);

    const newMerchants = [];

    for (const page of results) {
      const props = page.properties;

      // 檢查狀態，若非有效或為歷史存檔則略過
      const status = props['資料狀態']?.select?.name || '有效';
      if (status === '已過期備份' || status === '草稿') {
        continue;
      }

      const name = getTitle(props['店家名稱']);
      if (!name) continue;

      const aliasesRaw = getRichText(props['搜尋別名']);
      const aliases = aliasesRaw ? aliasesRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];
      if (!aliases.includes(name)) aliases.unshift(name);

      const categoryName = props['消費分類']?.select?.name || '生活百貨';
      const cubeSchemeName = props['國泰 CUBE 方案']?.select?.name || '一般消費';
      const taishinSchemeName = props['台新 Richart 方案']?.select?.name || '一般消費';
      const ubearRate = props['玉山 UBear 回饋%']?.number ?? 1.0;
      const megaRate = props['兆豐 BT21 回饋%']?.number ?? 1.0;
      const paymentAdvice = getRichText(props['最佳支付建議']);
      const pitfallWarning = getRichText(props['避坑防呆警語']);
      const isPitfall = props['是否為雷區通路']?.checkbox ?? false;

      let cubeSchemeId = 'general';
      if (cubeSchemeName.includes('玩數位')) cubeSchemeId = 'digital';
      else if (cubeSchemeName.includes('樂饗購')) cubeSchemeId = 'dining';
      else if (cubeSchemeName.includes('趣旅行')) cubeSchemeId = 'travel';
      else if (cubeSchemeName.includes('集精選')) cubeSchemeId = 'essentials';
      else if (cubeSchemeName.includes('慶生月')) cubeSchemeId = 'birthday';
      else if (cubeSchemeName.includes('全支付')) cubeSchemeId = 'pxpay';
      else if (cubeSchemeName.includes('台塑家')) cubeSchemeId = 'formosa';

      let taishinSchemeId = 'daily';
      if (taishinSchemeName.includes('Chill') || taishinSchemeName.includes('10%')) taishinSchemeId = 'chill';
      else if (taishinSchemeName.includes('Pay') || taishinSchemeName.includes('3.8%')) taishinSchemeId = 'pay';
      else if (taishinSchemeName.includes('好饗')) taishinSchemeId = 'gourmet';
      else if (taishinSchemeName.includes('大筆')) taishinSchemeId = 'big_spending';
      else if (taishinSchemeName.includes('數趣')) taishinSchemeId = 'digital_fun';
      else if (taishinSchemeName.includes('玩旅')) taishinSchemeId = 'travel_fun';
      else if (taishinSchemeName.includes('假日')) taishinSchemeId = 'holiday';
      else if (taishinSchemeName.includes('一般消費')) taishinSchemeId = 'general';

      // 生成標準 Merchant 物件
      newMerchants.push({
        id: `m_${page.id.replace(/-/g, '').slice(0, 8)}`,
        name,
        aliases,
        categories: ['general'],
        categoryName,
        isPitfall,
        pitfallWarning,
        paymentAdvice,
        schemes: {
          cathay_cube: {
            schemeId: cubeSchemeId,
            schemeName: cubeSchemeName,
            rate: (cubeSchemeId === 'essentials' || cubeSchemeId === 'pxpay' || cubeSchemeId === 'formosa') ? 2.0 : (cubeSchemeId === 'birthday' ? 10.0 : 3.0),
            notes: `${cubeSchemeName}`
          },
          taishin_richart: {
            schemeId: taishinSchemeId,
            schemeName: taishinSchemeName,
            rate: taishinSchemeId === 'chill' ? 10.0 : (taishinSchemeId === 'pay' ? 3.8 : (taishinSchemeId === 'holiday' ? 2.0 : 3.3)),
            notes: `${taishinSchemeName}`
          },
          esun_ubear: {
            schemeId: 'online_shopping',
            schemeName: '回饋方案',
            rate: ubearRate,
            notes: `回饋 ${ubearRate}%`
          },
          mega_bt21: {
            schemeId: 'mobile_pay',
            schemeName: '回饋方案',
            rate: megaRate,
            notes: `回饋 ${megaRate}%`
          }
        }
      });
    }

    // 1. 建立非破壞性時間戳版本備份
    if (fs.existsSync(merchantsPath)) {
      const now = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupsDir, `data-${now}.json`);
      fs.copyFileSync(merchantsPath, backupPath);
      console.log(`📦 已將前一版本完整備份至: src/data/backups/data-${now}.json`);
    }

    // 2. 寫入最新 merchants.json
    fs.writeFileSync(merchantsPath, JSON.stringify(newMerchants, null, 2), 'utf-8');
    console.log(`✅ 同步完成！共更新 ${newMerchants.length} 筆有效通路回饋資料至 src/data/merchants.json`);
  } catch (err) {
    console.error('❌ 同步失敗:', err);
  }
}

syncNotion();
