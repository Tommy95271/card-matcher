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
  console.error('❌ 錯誤：請在 .env 中設定 NOTION_API_KEY 與 NOTION_DATABASE_ID！');
  process.exit(1);
}

const notion = new Client({ auth: apiKey });

// 輔助函式：從 Title 提取純文字
function getTitle(property) {
  if (!property || !property.title || !property.title.length) return '';
  return property.title.map((t) => t.plain_text).join('');
}

// 完整的特約店家與通路資料清單 (含官方最新核實)
const merchantsToUpsert = [
  {
    name: "博客來 (Books.com.tw)",
    aliases: ["博客來 (Books.com.tw)", "博客來", "博客來網路書店", "Books.com.tw", "買書", "網路書店"],
    categoryName: "網購電商",
    cubeScheme: "一般消費",
    taishinScheme: "數趣刷 (3.3%)",
    ubearRate: 3.0,
    megaRate: 2.0,
    paymentAdvice: "📚 首選推薦：台新數趣刷 3.3% 或 玉山 UBear 3.0%（⚠️ 國泰 CUBE 玩數位不包含博客來，僅 0.3% 一般消費）",
    pitfallWarning: "⚠️ 【CUBE 避坑】：國泰世華 CUBE 卡的「玩數位」官方加碼名單排除博客來網路書店！博客來僅計一般消費 0.3%，建議切換至台新數趣刷 3.3% 或使用玉山 UBear 3.0%。",
    isPitfall: true
  },
  {
    name: "Coupang 酷澎",
    aliases: ["Coupang 酷澎", "酷澎", "Coupang", "火箭跨境", "火箭速配", "酷朋"],
    categoryName: "網購電商",
    cubeScheme: "玩數位",
    taishinScheme: "數趣刷 (3.3%)",
    ubearRate: 3.0,
    megaRate: 2.0,
    paymentAdvice: "🚀 推薦 台新數趣刷 3.3%、CUBE 玩數位 3.0%~3.3% 或 玉山 UBear 3.0%",
    pitfallWarning: "",
    isPitfall: false
  },
  {
    name: "淘寶網 / 天貓 (Taobao / Tmall)",
    aliases: ["淘寶網 / 天貓 (Taobao / Tmall)", "淘寶", "淘寶網", "天貓", "Taobao", "Tmall", "大陸集運"],
    categoryName: "網購電商",
    cubeScheme: "一般消費",
    taishinScheme: "數趣刷 (3.3%)",
    ubearRate: 3.0,
    megaRate: 2.0,
    paymentAdvice: "📦 推薦 台新數趣刷 3.3% 或 玉山 UBear 3.0%（⚠️ 國泰 CUBE 玩數位不支援淘寶）",
    pitfallWarning: "⚠️ 【CUBE 避坑】：淘寶/天貓不屬於 CUBE 玩數位加碼通路，刷 CUBE 僅享 0.3% 一般消費；請改刷台新數趣刷 3.3% 或玉山 UBear 3.0%。",
    isPitfall: true
  },
  {
    name: "台茂購物中心 (TaiMall)",
    aliases: ["台茂購物中心 (TaiMall)", "台茂", "TaiMall", "桃園台茂", "南崁台茂", "台茂影城"],
    categoryName: "百貨商場",
    cubeScheme: "樂饗購",
    taishinScheme: "大筆刷 (3.3%)",
    ubearRate: 1.0,
    megaRate: 3.0,
    paymentAdvice: "🛍️ 推薦 台新大筆刷 3.3%、CUBE 樂饗購 3.0%~3.3% 或 兆豐 BT21 (Apple Pay 3.0%)",
    pitfallWarning: "⚠️ 【百貨刷卡避坑】：1. 百貨內餐廳若為商場統開發票，CUBE 切【樂饗購】/ 台新切【大筆刷】適用；2. 特賣獨立開票櫃位可能排除加碼。",
    isPitfall: false
  },
  {
    name: "南紡購物中心 (T.S. Mall)",
    aliases: ["南紡購物中心 (T.S. Mall)", "南紡", "台南南紡", "TS Mall", "南紡夢時代", "南紡購物"],
    categoryName: "百貨商場",
    cubeScheme: "樂饗購",
    taishinScheme: "大筆刷 (3.3%)",
    ubearRate: 1.0,
    megaRate: 3.0,
    paymentAdvice: "🛍️ 推薦 台新大筆刷 3.3%、CUBE 樂饗購 3.0%~3.3% 或 兆豐 BT21 (Apple Pay 3.0%)",
    pitfallWarning: "",
    isPitfall: false
  },
  {
    name: "Big City 遠東巨城購物中心",
    aliases: ["Big City 遠東巨城購物中心", "巨城", "遠東巨城", "新竹巨城", "Big City", "巨城購物中心"],
    categoryName: "百貨商場",
    cubeScheme: "樂饗購",
    taishinScheme: "大筆刷 (3.3%)",
    ubearRate: 1.0,
    megaRate: 3.0,
    paymentAdvice: "🛍️ 推薦 台新大筆刷 3.3%、CUBE 樂饗購 3.0%~3.3% 或 兆豐 BT21 (Apple Pay 3.0%)",
    pitfallWarning: "",
    isPitfall: false
  },
  {
    name: "新店裕隆城 (誠品生活裕隆城)",
    aliases: ["新店裕隆城 (誠品生活裕隆城)", "裕隆城", "新店裕隆城", "誠品裕隆城", "誠品生活新店", "裕隆城威秀"],
    categoryName: "百貨商場",
    cubeScheme: "樂饗購",
    taishinScheme: "大筆刷 (3.3%)",
    ubearRate: 1.0,
    megaRate: 3.0,
    paymentAdvice: "🛍️ 推薦 台新大筆刷 3.3%、CUBE 樂饗購 3.0%~3.3% 或 兆豐 BT21 (Apple Pay 3.0%)",
    pitfallWarning: "",
    isPitfall: false
  },
  {
    name: "大江國際購物中心 (MetroWalk)",
    aliases: ["大江國際購物中心 (MetroWalk)", "大江", "大江購物中心", "MetroWalk", "中壢大江"],
    categoryName: "百貨商場",
    cubeScheme: "樂饗購",
    taishinScheme: "大筆刷 (3.3%)",
    ubearRate: 1.0,
    megaRate: 3.0,
    paymentAdvice: "🛍️ 推薦 台新大筆刷 3.3%、CUBE 樂饗購 3.0%~3.3% 或 兆豐 BT21 (Apple Pay 3.0%)",
    pitfallWarning: "",
    isPitfall: false
  },
  {
    name: "三井 Outlet (MITSUI OUTLET PARK / LaLaport)",
    aliases: ["三井 Outlet (MITSUI OUTLET PARK / LaLaport)", "三井Outlet", "三井", "林口三井", "台中港三井", "台南三井", "LaLaport", "台中LaLaport", "南港LaLaport"],
    categoryName: "百貨商場",
    cubeScheme: "樂饗購",
    taishinScheme: "大筆刷 (3.3%)",
    ubearRate: 1.0,
    megaRate: 3.0,
    paymentAdvice: "🛍️ 推薦 台新大筆刷 3.3%、CUBE 樂饗購 3.0%~3.3% 或 兆豐 BT21 (Apple Pay 3.0%)",
    pitfallWarning: "",
    isPitfall: false
  },
  {
    name: "華泰名品城 (GLORIA OUTLETS)",
    aliases: ["華泰名品城 (GLORIA OUTLETS)", "華泰名品城", "華泰", "GLORIA OUTLETS", "桃園華泰", "青埔華泰"],
    categoryName: "百貨商場",
    cubeScheme: "樂饗購",
    taishinScheme: "大筆刷 (3.3%)",
    ubearRate: 1.0,
    megaRate: 3.0,
    paymentAdvice: "🛍️ 推薦 台新大筆刷 3.3%、CUBE 樂饗購 3.0%~3.3% 或 兆豐 BT21 (Apple Pay 3.0%)",
    pitfallWarning: "",
    isPitfall: false
  },
  {
    name: "宏匯廣場 (HONHUI PLAZA)",
    aliases: ["宏匯廣場 (HONHUI PLAZA)", "宏匯廣場", "宏匯", "新莊宏匯", "HONHUI PLAZA"],
    categoryName: "百貨商場",
    cubeScheme: "樂饗購",
    taishinScheme: "大筆刷 (3.3%)",
    ubearRate: 1.0,
    megaRate: 3.0,
    paymentAdvice: "🛍️ 推薦 台新大筆刷 3.3%、CUBE 樂饗購 3.0%~3.3% 或 兆豐 BT21 (Apple Pay 3.0%)",
    pitfallWarning: "",
    isPitfall: false
  },
  {
    name: "統一時代百貨 (台北店 / 高雄店 / 夢時代)",
    aliases: ["統一時代百貨 (台北店 / 高雄店 / 夢時代)", "統一時代", "時代百貨", "統一阪急", "阪急", "夢時代", "高雄夢時代", "統一時代台北店", "統一時代高雄店"],
    categoryName: "百貨商場",
    cubeScheme: "樂饗購",
    taishinScheme: "大筆刷 (3.3%)",
    ubearRate: 1.0,
    megaRate: 3.0,
    paymentAdvice: "🛍️ 推薦 台新大筆刷 3.3% 或 CUBE 樂饗購 3.0%~3.3%；行動支付支援 LINE Pay/Apple Pay 享 3.0%",
    pitfallWarning: "⚠️ 【百貨刷卡避坑】：1. 百貨內餐廳若為百貨統開發票，國泰 CUBE 需切【樂饗購】，台新請切【大筆刷】；2. 部分快閃特賣櫃位若屬獨立發票可能排除百貨加碼。",
    isPitfall: false
  },
  {
    name: "大全聯 (原大潤發 / 全聯量販)",
    aliases: ["大全聯 (原大潤發 / 全聯量販)", "大全聯", "大潤發", "RT-MART", "大潤發量販", "全聯大潤發"],
    categoryName: "量販超市",
    cubeScheme: "全支付",
    taishinScheme: "天天刷 (3.3%)",
    ubearRate: 1.0,
    megaRate: 1.0,
    paymentAdvice: "🛒 推薦 台新天天刷 (實體/PX Pay) 3.3%、國泰全支付 2.0% 或 兆豐 BT21",
    pitfallWarning: "⚠️ 【大全聯/大潤發支付注意】：原大潤發已整併為大全聯生態系，刷卡推薦使用台新天天刷或綁定全支付享加碼回饋。",
    isPitfall: false
  },
  {
    name: "LOPIA 台灣 (日系連鎖超市)",
    aliases: ["LOPIA 台灣 (日系連鎖超市)", "LOPIA", "台灣LOPIA", "樂比亞", "日系超市", "LOPIA超市"],
    categoryName: "量販超市",
    cubeScheme: "集精選",
    taishinScheme: "天天刷 (3.3%)",
    ubearRate: 1.0,
    megaRate: 1.0,
    paymentAdvice: "🥩 推薦 台新天天刷 3.3%、CUBE 集精選 2.0%",
    pitfallWarning: "",
    isPitfall: false
  },
  {
    name: "電動車充電站 (EVOASIS / U-POWER / EVALUE / TAIL)",
    aliases: ["電動車充電站 (EVOASIS / U-POWER / EVALUE / TAIL)", "EVOASIS", "U-POWER", "EVALUE", "TAIL", "特爾電力", "充電樁", "電動車充電", "源點科技", "華城電能"],
    categoryName: "加油充電",
    cubeScheme: "集精選",
    taishinScheme: "天天刷 (3.3%)",
    ubearRate: 3.0,
    megaRate: 3.0,
    paymentAdvice: "⚡ 推薦 台新天天刷 3.3%、CUBE 集精選 2.0% 或 兆豐 BT21 / 玉山 UBear 3.0%",
    pitfallWarning: "",
    isPitfall: false
  },
  {
    name: "智慧停車 (車麻吉 / uTagGo)",
    aliases: ["智慧停車 (車麻吉 / uTagGo)", "車麻吉", "uTagGo", "停車", "智慧停車", "停車大聲公", "路邊停車"],
    categoryName: "交通旅遊",
    cubeScheme: "集精選",
    taishinScheme: "天天刷 (3.3%)",
    ubearRate: 3.0,
    megaRate: 3.0,
    paymentAdvice: "🅿️ 推薦 台新天天刷 3.3%、CUBE 集精選 2.0% 或 玉山 UBear / 兆豐 BT21 (Apple Pay/LINE Pay) 3.0%",
    pitfallWarning: "",
    isPitfall: false
  },
  {
    name: "王品集團 (王品/西堤/陶板屋/石二鍋/肉次方/初瓦/響辣/聚)",
    aliases: ["王品集團 (王品/西堤/陶板屋/石二鍋/肉次方/初瓦/響辣/聚)", "王品", "王品集團", "西堤", "陶板屋", "石二鍋", "肉次方", "初瓦", "向辣", "聚日式鍋物", "品田牧場", "青花驕", "和牛涮", "享鴨", "丰禾", "THE WANG", "王品牛排"],
    categoryName: "美食餐飲",
    cubeScheme: "樂饗購",
    taishinScheme: "好饗刷 (3.3%)",
    ubearRate: 1.0,
    megaRate: 3.0,
    paymentAdvice: "🥩 推薦 台新好饗刷 3.3%、CUBE 樂饗購 3.0%~3.3% 或 兆豐 BT21 (LINE Pay 3.0%)",
    pitfallWarning: "",
    isPitfall: false
  },
  {
    name: "饗賓餐旅 (饗食天堂/饗饗/旭集/果然匯/小福利/開飯川食堂/饗泰多)",
    aliases: ["饗賓餐旅 (饗食天堂/饗饗/旭集/果然匯/小福利/開飯川食堂/饗泰多)", "饗賓", "饗食天堂", "饗饗", "INPARADISE", "旭集", "果然匯", "小福利", "開飯川食堂", "饗泰多", "真珠", "朵頤"],
    categoryName: "美食餐飲",
    cubeScheme: "樂饗購",
    taishinScheme: "好饗刷 (3.3%)",
    ubearRate: 1.0,
    megaRate: 3.0,
    paymentAdvice: "🍽️ 推薦 台新好饗刷 3.3%、CUBE 樂饗購 3.0%~3.3% 或 兆豐 BT21 (LINE Pay 3.0%)",
    pitfallWarning: "",
    isPitfall: false
  },
  {
    name: "瓦城泰統集團 (瓦城/非常泰/大心/1010湘/時時香/樂子/BO BO)",
    aliases: ["瓦城泰統集團 (瓦城/非常泰/大心/1010湘/時時香/樂子/BO BO)", "瓦城", "瓦城泰統", "非常泰", "大心", "1010湘", "時時香", "樂子the Diner", "BO BO", "泰式料理"],
    categoryName: "美食餐飲",
    cubeScheme: "樂饗購",
    taishinScheme: "好饗刷 (3.3%)",
    ubearRate: 1.0,
    megaRate: 3.0,
    paymentAdvice: "🍛 推薦 台新好饗刷 3.3%、CUBE 樂饗購 3.0%~3.3% 或 兆豐 BT21 (LINE Pay 3.0%)",
    pitfallWarning: "",
    isPitfall: false
  },
  {
    name: "藏壽司 (Kura Sushi)",
    aliases: ["藏壽司 (Kura Sushi)", "藏壽司", "Kura", "Kura Sushi", "扭蛋壽司", "迴轉壽司"],
    categoryName: "美食餐飲",
    cubeScheme: "樂饗購",
    taishinScheme: "好饗刷 (3.3%)",
    ubearRate: 1.0,
    megaRate: 3.0,
    paymentAdvice: "🍣 推薦 台新好饗刷 3.3%、CUBE 樂饗購 3.0%~3.3% 或 兆豐 BT21 (Apple Pay/LINE Pay 3.0%)",
    pitfallWarning: "",
    isPitfall: false
  },
  {
    name: "壽司郎 (Sushiro)",
    aliases: ["壽司郎 (Sushiro)", "壽司郎", "Sushiro", "スシロー", "台灣壽司郎"],
    categoryName: "美食餐飲",
    cubeScheme: "樂饗購",
    taishinScheme: "好饗刷 (3.3%)",
    ubearRate: 1.0,
    megaRate: 3.0,
    paymentAdvice: "🍣 推薦 台新好饗刷 3.3%、CUBE 樂饗購 3.0%~3.3% (或 CUBE 童樂匯 5%) 或 兆豐 BT21 (LINE Pay 3.0%)",
    pitfallWarning: "",
    isPitfall: false
  },
  {
    name: "鼎泰豐 (Din Tai Fung)",
    aliases: ["鼎泰豐 (Din Tai Fung)", "鼎泰豐", "小籠包", "Din Tai Fung", "DTF"],
    categoryName: "美食餐飲",
    cubeScheme: "樂饗購",
    taishinScheme: "好饗刷 (3.3%)",
    ubearRate: 1.0,
    megaRate: 3.0,
    paymentAdvice: "🥟 推薦 台新好饗刷 3.3% 或 CUBE 樂饗購 3.0%~3.3%",
    pitfallWarning: "",
    isPitfall: false
  }
];

async function updateAllNotionMerchants() {
  try {
    const targetDbId = databaseId.replace(/-/g, '');
    console.log(`🔍 正在查詢 Notion 資料庫現有資料: ${targetDbId}...`);

    // 1. 先抓取目前 Notion 資料庫所有頁面
    let hasMore = true;
    let nextCursor = undefined;
    const existingPagesMap = new Map(); // key: name -> page_id

    while (hasMore) {
      const resp = await notion.databases.query({
        database_id: targetDbId,
        start_cursor: nextCursor,
        page_size: 100
      });
      for (const page of resp.results) {
        const name = getTitle(page.properties['店家名稱']);
        if (name) {
          existingPagesMap.set(name, page.id);
        }
      }
      hasMore = resp.has_more;
      nextCursor = resp.next_cursor;
    }

    console.log(`📋 資料庫現有 ${existingPagesMap.size} 筆店家，開始智能更新與新增...`);

    for (let i = 0; i < merchantsToUpsert.length; i++) {
      const m = merchantsToUpsert[i];
      const existingPageId = existingPagesMap.get(m.name);

      const properties = {
        '店家名稱': {
          title: [{ text: { content: m.name } }]
        },
        '搜尋別名': {
          rich_text: [{ text: { content: m.aliases.join(', ') } }]
        },
        '消費分類': {
          select: { name: m.categoryName }
        },
        '國泰 CUBE 方案': {
          select: { name: m.cubeScheme }
        },
        '台新 Richart 方案': {
          select: { name: m.taishinScheme }
        },
        '玉山 UBear 回饋%': {
          number: m.ubearRate
        },
        '兆豐 BT21 回饋%': {
          number: m.megaRate
        },
        '最佳支付建議': {
          rich_text: [{ text: { content: m.paymentAdvice } }]
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
      };

      if (existingPageId) {
        await notion.pages.update({
          page_id: existingPageId,
          properties
        });
        console.log(`🔄 [${i + 1}/${merchantsToUpsert.length}] 已更新: ${m.name}`);
      } else {
        await notion.pages.create({
          parent: { database_id: targetDbId },
          properties
        });
        console.log(`✨ [${i + 1}/${merchantsToUpsert.length}] 已新增: ${m.name}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    console.log('🎉 Notion 資料庫已更新完畢！');
  } catch (err) {
    console.error('❌ 更新 Notion 發生錯誤:', err);
  }
}

updateAllNotionMerchants();
