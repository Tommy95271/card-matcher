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

// 完整 2026 官方特約通路與方案對照總清單
const comprehensiveMerchants = [
  // ==========================================
  // 1. 旅遊、訂房、機票、票券 (國泰【趣旅行】/ 台新【大玩客/玩旅刷】)
  // ==========================================
  {
    name: 'KKday (旅遊體驗與票券平台)',
    aliases: ['KKday', 'kkday', 'KKDay', '酷遊天', '旅遊票券', '一日遊', '網卡', '行程預訂', '門票'],
    categoryName: '旅遊訂房',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '✈️ 推薦 國泰 CUBE 趣旅行 (3.0%~3.3%)、台新大玩客 (3.3%) 或 玉山 UBear (3.0% 網購折抵)',
    cubeScheme: '趣旅行',
    taishinScheme: '玩旅刷 (3.3%)',
    ubearRate: 3.0,
    megaRate: 1.0
  },
  {
    name: 'Klook (客路旅遊平台)',
    aliases: ['Klook', 'klook', '客路', '旅遊行程', '交通票券', '景點門票', '租車', '一日遊'],
    categoryName: '旅遊訂房',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '✈️ 推薦 國泰 CUBE 趣旅行 (3.0%~3.3%)、台新大玩客 (3.3%) 或 玉山 UBear (3.0%)',
    cubeScheme: '趣旅行',
    taishinScheme: '玩旅刷 (3.3%)',
    ubearRate: 3.0,
    megaRate: 1.0
  },
  {
    name: 'Agoda (安可達國際訂房網)',
    aliases: ['Agoda', 'agoda', '安可達', '訂房', '飯店預訂', '住宿', '飯店', 'Hotel'],
    categoryName: '旅遊訂房',
    isPitfall: true,
    pitfallWarning: '⚠️ Agoda 若選擇「延後付款 (Pay Later)」或「外幣計價」，可能產生 1.5% 海外交易手續費；CUBE 趣旅行與台新大玩客皆認定為指定通路可拿滿 3.0%~3.3% 回饋！',
    paymentAdvice: '🏨 推薦 國泰 CUBE 趣旅行 (3.0%~3.3%)、台新大玩客 (3.3%) 或 玉山 UBear (3.0%)',
    cubeScheme: '趣旅行',
    taishinScheme: '玩旅刷 (3.3%)',
    ubearRate: 3.0,
    megaRate: 1.0
  },
  {
    name: 'Booking.com (繽客訂房網)',
    aliases: ['Booking.com', 'Booking', 'booking', '繽客', '訂房網', '住宿', '民宿'],
    categoryName: '旅遊訂房',
    isPitfall: true,
    pitfallWarning: '⚠️ 部分飯店由現場飯店直接向您請款，若在國外現場刷卡請維持【趣旅行/大玩客】方案。',
    paymentAdvice: '🏨 推薦 國泰 CUBE 趣旅行 (3.0%~3.3%) 或 台新大玩客 (3.3%)',
    cubeScheme: '趣旅行',
    taishinScheme: '玩旅刷 (3.3%)',
    ubearRate: 3.0,
    megaRate: 1.0
  },
  {
    name: 'Trip.com (攜程旅遊)',
    aliases: ['Trip.com', 'trip.com', 'Trip', '攜程', '機票預訂', '火車票', '訂房'],
    categoryName: '旅遊訂房',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '✈️ 推薦 國泰 CUBE 趣旅行 (3.0%~3.3%) 或 台新大玩客 (3.3%)',
    cubeScheme: '趣旅行',
    taishinScheme: '玩旅刷 (3.3%)',
    ubearRate: 3.0,
    megaRate: 1.0
  },
  {
    name: 'Airbnb (愛彼迎全球民宿網)',
    aliases: ['Airbnb', 'airbnb', '愛彼迎', '民宿', '短租', '公寓'],
    categoryName: '旅遊訂房',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🏡 推薦 國泰 CUBE 趣旅行 (3.0%~3.3%)、台新大玩客 (3.3%) 或 玉山 UBear (3.0%)',
    cubeScheme: '趣旅行',
    taishinScheme: '玩旅刷 (3.3%)',
    ubearRate: 3.0,
    megaRate: 1.0
  },
  {
    name: 'Hotels.com / Expedia (智遊網)',
    aliases: ['Hotels.com', 'Expedia', '智遊網', '飯店網', '好訂網', '飯店訂房'],
    categoryName: '旅遊訂房',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🏨 推薦 國泰 CUBE 趣旅行 (3.0%~3.3%) 或 台新大玩客 (3.3%)',
    cubeScheme: '趣旅行',
    taishinScheme: '玩旅刷 (3.3%)',
    ubearRate: 3.0,
    megaRate: 1.0
  },
  {
    name: '雄獅旅遊 / 易遊網 / 可樂旅遊 / 東南旅遊',
    aliases: ['雄獅旅遊', '易遊網', '可樂旅遊', '東南旅遊', 'ezTravel', 'Lion Travel', 'Cola Tour', '旅行社', '團體旅遊', '自由行'],
    categoryName: '旅遊訂房',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🧳 推薦 國泰 CUBE 趣旅行 (3.0%~3.3%) 或 台新大玩客 (3.3%)',
    cubeScheme: '趣旅行',
    taishinScheme: '玩旅刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 1.0
  },
  {
    name: '中華航空 / 長榮航空 / 星宇航空 / 台灣虎航',
    aliases: ['中華航空', '長榮航空', '星宇航空', '台灣虎航', '華航', '長榮', '星宇', '虎航', 'China Airlines', 'EVA Air', 'STARLUX', 'Tigerair', '機票', '航空'],
    categoryName: '航空機票',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '✈️ 推薦 國泰 CUBE 趣旅行 (3.0%~3.3%) 或 台新大玩客 (3.3%) 享高額機票回饋無上限',
    cubeScheme: '趣旅行',
    taishinScheme: '玩旅刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 1.0
  },
  {
    name: '國泰航空 / 華信航空 / 立榮航空 / 樂桃航空',
    aliases: ['國泰航空', '華信航空', '立榮航空', '樂桃航空', 'Cathay Pacific', 'Peach', '廉航', '國內線機票'],
    categoryName: '航空機票',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '✈️ 推薦 國泰 CUBE 趣旅行 (3.0%~3.3%) 或 台新大玩客 (3.3%)',
    cubeScheme: '趣旅行',
    taishinScheme: '玩旅刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 1.0
  },
  {
    name: '海外實體消費 (日/韓/歐/美/泰等全球實體店面)',
    aliases: ['海外實體消費 (日/韓/歐/美/泰等全球實體店面)', '海外消費', '國外刷卡', '日本實體', '韓國實體', '歐洲實體', '美國實體', '泰國實體', '出國刷卡', '免稅店', '外幣實體'],
    categoryName: '海外消費',
    isPitfall: true,
    pitfallWarning: '⚠️ 海外刷卡請務必選擇「當地貨幣 (如日幣/美金/歐元)」結帳，切勿選擇「新台幣 (DCC 動態貨幣轉換)」，否則將被加收 3%~5% 匯差手續費！',
    paymentAdvice: '🌍 日本消費切換【日本賞 3.5%】；其他全球各國實體店面切換【CUBE 趣旅行 3.0%~3.3%】或【台新大玩客 3.3%】',
    cubeScheme: '趣旅行',
    taishinScheme: '玩旅刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 1.0
  },

  // ==========================================
  // 2. 交通、計程車、高鐵、租車 (國泰【趣旅行】/ 台新【大玩客/天天刷】)
  // ==========================================
  {
    name: '台灣高鐵 (台灣高速鐵路)',
    aliases: ['台灣高鐵 (台灣高速鐵路)', '台灣高鐵', '高鐵', 'THSR', '高鐵購票', '高鐵T-EX', '高鐵自由座'],
    categoryName: '交通旅遊',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🚅 推薦 國泰 CUBE 趣旅行 (3.0%~3.3%) 或 台新大玩客 (3.3%)，App 或臨櫃皆享回饋',
    cubeScheme: '趣旅行',
    taishinScheme: '玩旅刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 1.0
  },
  {
    name: '台灣鐵路 (台鐵 / 火車)',
    aliases: ['台灣鐵路 (台鐵 / 火車)', '台灣鐵路', '台鐵', '火車', 'TRA', '台鐵購票', '自強號', '太魯閣號', '普悠瑪'],
    categoryName: '交通旅遊',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🚆 推薦 國泰 CUBE 趣旅行 (3.0%~3.3%) 或 台新大玩客 (3.3%)',
    cubeScheme: '趣旅行',
    taishinScheme: '玩旅刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 1.0
  },
  {
    name: 'Uber (優步計程車 / 乘車服務)',
    aliases: ['Uber (優步計程車 / 乘車服務)', 'Uber', '優步', 'Uber乘車', 'Uber計程車', '小黃', '叫車'],
    categoryName: '交通旅遊',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🚖 推薦 國泰 CUBE 趣旅行 (3.0%~3.3%)、台新大玩客 (3.3%) 或 玉山 UBear (3.0% 網購折抵)',
    cubeScheme: '趣旅行',
    taishinScheme: '玩旅刷 (3.3%)',
    ubearRate: 3.0,
    megaRate: 1.0
  },
  {
    name: '台灣大車隊 (55688) / yoxi / LINE GO',
    aliases: ['台灣大車隊', '55688', 'yoxi', 'LINE GO', 'LINE TAXI', '計程車', '車資', '叫車服務'],
    categoryName: '交通旅遊',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🚕 推薦 國泰 CUBE 趣旅行 (3.0%~3.3%) 或 台新大玩客 (3.3%)，LINE GO 亦可綁兆豐 BT21 (3.0%)',
    cubeScheme: '趣旅行',
    taishinScheme: '玩旅刷 (3.3%)',
    ubearRate: 3.0,
    megaRate: 3.0
  },
  {
    name: '和運租車 / 格上租車 / iRent / 共享汽機車',
    aliases: ['和運租車', '格上租車', 'iRent', 'GoShare', 'WeMo', '租車', '共享汽車', '共享機車'],
    categoryName: '交通旅遊',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🚗 推薦 國泰 CUBE 趣旅行 (3.0%~3.3%) 或 台新大玩客 (3.3%)',
    cubeScheme: '趣旅行',
    taishinScheme: '玩旅刷 (3.3%)',
    ubearRate: 3.0,
    megaRate: 1.0
  },

  // ==========================================
  // 3. 網購電商、書籍與數位影音 (國泰【玩數位】/ 台新【數趣刷】)
  // ==========================================
  {
    name: '博客來網路書店 (Books.com.tw)',
    aliases: ['博客來網路書店 (Books.com.tw)', '博客來', 'Books.com.tw', '買書', '電子書', '博客來書店'],
    categoryName: '網購電商',
    isPitfall: true,
    pitfallWarning: '⚠️ 博客來已被國泰 CUBE 排除在【玩數位】之外！請切換為【台新 Richart 數趣刷 3.3%】或使用【玉山 UBear 3.0%】！',
    paymentAdvice: '📚 首選推薦：台新 Richart 數趣刷 3.3% 或 玉山 UBear 3.0%（CUBE 僅一般消費 0.3%）',
    cubeScheme: '一般消費',
    taishinScheme: '數趣刷 (3.3%)',
    ubearRate: 3.0,
    megaRate: 1.0
  },
  {
    name: '誠品線上 (eslite.com)',
    aliases: ['誠品線上 (eslite.com)', '誠品線上', '誠品網路書店', 'eslite', '誠品購物'],
    categoryName: '網購電商',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '📖 推薦 台新數趣刷 3.3% 或 玉山 UBear 3.0%（若至誠品實體門市請切換 CUBE 樂饗購 3.0%）',
    cubeScheme: '一般消費',
    taishinScheme: '數趣刷 (3.3%)',
    ubearRate: 3.0,
    megaRate: 1.0
  },
  {
    name: '酷澎 (Coupang 台灣/韓國直送)',
    aliases: ['酷澎 (Coupang 台灣/韓國直送)', '酷澎', 'Coupang', '火箭跨境', '火箭速配', '韓國電商', '酷胖'],
    categoryName: '網購電商',
    isPitfall: true,
    pitfallWarning: '⚠️ Coupang 火箭跨境屬海外交易；推薦使用玉山 UBear 3.0% 或台新數趣刷 3.3%！',
    paymentAdvice: '🚀 推薦 台新數趣刷 3.3% 或 玉山 UBear 3.0%',
    cubeScheme: '玩數位',
    taishinScheme: '數趣刷 (3.3%)',
    ubearRate: 3.0,
    megaRate: 1.0
  },
  {
    name: 'Apple 媒體服務 (App Store / iCloud / Apple Music)',
    aliases: ['App Store', 'iCloud', 'Apple Music', 'Apple TV+', '蘋果商店', '課金', '訂閱', 'Apple Arcade'],
    categoryName: '影音娛樂',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🍎 推薦 玉山 UBear (最高 10%~13%)、國泰 CUBE 玩數位 (3.0%~3.3%) 或 台新數趣刷 (3.3%)',
    cubeScheme: '玩數位',
    taishinScheme: '數趣刷 (3.3%)',
    ubearRate: 10.0,
    megaRate: 1.0
  },
  {
    name: 'Google Play 商店 (應用程式/課金/YouTube Premium)',
    aliases: ['Google Play', 'Google Play 商店', 'Google Play 課金', 'YouTube Premium', 'Google One', 'YT Premium', 'Google 商店'],
    categoryName: '影音娛樂',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '▶️ 推薦 玉山 UBear (最高 10%~13%)、國泰 CUBE 玩數位 (3.0%~3.3%) 或 台新數趣刷 (3.3%)',
    cubeScheme: '玩數位',
    taishinScheme: '數趣刷 (3.3%)',
    ubearRate: 10.0,
    megaRate: 1.0
  },
  {
    name: 'Netflix (網飛線上串流)',
    aliases: ['Netflix', 'netflix', '網飛', '影集', '電影', '追劇'],
    categoryName: '影音娛樂',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🍿 推薦 玉山 UBear (影音加碼 10%~13%)、國泰 CUBE 玩數位 (3.0%~3.3%) 或 台新數趣刷 (3.3%)',
    cubeScheme: '玩數位',
    taishinScheme: '數趣刷 (3.3%)',
    ubearRate: 10.0,
    megaRate: 1.0
  },
  {
    name: 'Disney+ (迪士尼線上影音)',
    aliases: ['Disney+', 'disney+', 'Disney Plus', '迪士尼', '漫威', '皮克斯'],
    categoryName: '影音娛樂',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '✨ 推薦 玉山 UBear (影音加碼 10%~13%)、國泰 CUBE 玩數位 (3.0%~3.3%) 或 台新數趣刷 (3.3%)',
    cubeScheme: '玩數位',
    taishinScheme: '數趣刷 (3.3%)',
    ubearRate: 10.0,
    megaRate: 1.0
  },
  {
    name: 'Spotify (音樂串流服務)',
    aliases: ['Spotify', 'spotify', '聲田', '音樂訂閱', '聽歌'],
    categoryName: '影音娛樂',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🎵 推薦 玉山 UBear (影音加碼 10%~13%)、國泰 CUBE 玩數位 (3.0%~3.3%) 或 台新數趣刷 (3.3%)',
    cubeScheme: '玩數位',
    taishinScheme: '數趣刷 (3.3%)',
    ubearRate: 10.0,
    megaRate: 1.0
  },
  {
    name: 'Steam / PlayStation Network / Nintendo eShop',
    aliases: ['Steam', 'PlayStation', 'PSN', 'Nintendo', 'Switch eShop', '任天堂', '遊戲購買', '課金'],
    categoryName: '影音娛樂',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🎮 推薦 台新數趣刷 (3.3%)、玉山 UBear (3.0% 網購) 或 國泰 CUBE 玩數位 (3.0%)',
    cubeScheme: '玩數位',
    taishinScheme: '數趣刷 (3.3%)',
    ubearRate: 3.0,
    megaRate: 1.0
  },

  // ==========================================
  // 4. 百貨商場、OUTLET、生活藥妝 (國泰【樂饗購】/ 台新【大筆刷/好饗刷】)
  // ==========================================
  {
    name: '新光三越 (Shin Kong Mitsukoshi)',
    aliases: ['新光三越', 'Shin Kong Mitsukoshi', 'SKM', '三越百貨', '信義新天地', '南西三越', '台中三越', '台南新天地'],
    categoryName: '百貨商場',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🛍️ 推薦 國泰 CUBE 樂饗購 (3.0%~3.3%) 或 台新大筆刷 (3.3%)，skm pay 亦適用',
    cubeScheme: '樂饗購',
    taishinScheme: '大筆刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 3.0
  },
  {
    name: '遠東 SOGO 百貨 (SOGO)',
    aliases: ['遠東 SOGO 百貨', 'SOGO', 'Sogo', '忠孝SOGO', '復興SOGO', '天母SOGO', '中壢SOGO', '新竹SOGO', '高雄SOGO'],
    categoryName: '百貨商場',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🛍️ 推薦 國泰 CUBE 樂饗購 (3.0%~3.3%) 或 台新大筆刷 (3.3%)',
    cubeScheme: '樂饗購',
    taishinScheme: '大筆刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 3.0
  },
  {
    name: '遠東百貨 (遠百 / 大遠百 / Far Eastern)',
    aliases: ['遠東百貨', '大遠百', '遠百', 'Far Eastern', '板橋大遠百', '信義A13', '台中大遠百', '竹北大遠百'],
    categoryName: '百貨商場',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🛍️ 推薦 國泰 CUBE 樂饗購 (3.0%~3.3%) 或 台新大筆刷 (3.3%)',
    cubeScheme: '樂饗購',
    taishinScheme: '大筆刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 3.0
  },
  {
    name: '微風廣場 (Breeze / 微風信義 / 微風南山)',
    aliases: ['微風廣場', 'Breeze', '微風信義', '微風南山', '微風台北車站', '微風南京', '微風松高'],
    categoryName: '百貨商場',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🛍️ 推薦 國泰 CUBE 樂饗購 (3.0%~3.3%) 或 台新大筆刷 (3.3%)',
    cubeScheme: '樂饗購',
    taishinScheme: '大筆刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 3.0
  },
  {
    name: '台北 101 購物中心 (TAIPEI 101)',
    aliases: ['台北 101 購物中心', '台北101', 'TAIPEI 101', '101購物中心', '101觀景台'],
    categoryName: '百貨商場',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🛍️ 推薦 國泰 CUBE 樂饗購 (3.0%~3.3%) 或 台新大筆刷 (3.3%)',
    cubeScheme: '樂饗購',
    taishinScheme: '大筆刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 3.0
  },
  {
    name: '三井 OUTLET (MITSUI OUTLET PARK / LaLaport)',
    aliases: ['三井 OUTLET', 'MITSUI OUTLET PARK', '三井Outlet', '林口三井', '台中港三井', '台南三井', 'LaLaport', '台中LaLaport', '南港LaLaport'],
    categoryName: '百貨商場',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🛍️ 推薦 國泰 CUBE 樂饗購 (3.0%~3.3%) 或 台新大筆刷 (3.3%)',
    cubeScheme: '樂饗購',
    taishinScheme: '大筆刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 3.0
  },
  {
    name: '華泰名品城 (GLORIA OUTLETS)',
    aliases: ['華泰名品城', 'GLORIA OUTLETS', '華泰Outlet', '桃園華泰', 'Outlet名品城'],
    categoryName: '百貨商場',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🛍️ 推薦 國泰 CUBE 樂饗購 (3.0%~3.3%) 或 台新大筆刷 (3.3%)',
    cubeScheme: '樂饗購',
    taishinScheme: '大筆刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 3.0
  },
  {
    name: '康是美 (COSMED)',
    aliases: ['康是美', 'COSMED', 'Cosmed', '藥妝', '保健品', '美妝'],
    categoryName: '藥妝美妝',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '💄 推薦 國泰 CUBE 樂饗購 (3.0%~3.3%) 或 兆豐 BT21 (LINE Pay/Apple Pay 3.0%)',
    cubeScheme: '樂饗購',
    taishinScheme: '天天刷 (3.3%)',
    ubearRate: 3.0,
    megaRate: 3.0
  },
  {
    name: '屈臣氏 (Watsons)',
    aliases: ['屈臣氏', 'Watsons', 'watsons', '藥妝店', '小屈', '保養品'],
    categoryName: '藥妝美妝',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '💄 推薦 國泰 CUBE 樂饗購 (3.0%~3.3%) 或 兆豐 BT21 (LINE Pay/Apple Pay 3.0%)',
    cubeScheme: '樂饗購',
    taishinScheme: '天天刷 (3.3%)',
    ubearRate: 3.0,
    megaRate: 3.0
  },
  {
    name: '寶雅 (POYA)',
    aliases: ['寶雅', 'POYA', 'poya', '寶雅生活館', '美妝生活', 'POYA寶雅'],
    categoryName: '生活百貨',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🛍️ 推薦 國泰 CUBE 樂饗購 (3.0%~3.3%) 或 兆豐 BT21 (LINE Pay 3.0%)',
    cubeScheme: '樂饗購',
    taishinScheme: '天天刷 (3.3%)',
    ubearRate: 3.0,
    megaRate: 3.0
  },
  {
    name: '唐吉訶德 (DON DON DONKI 台灣門市)',
    aliases: ['唐吉訶德', 'DON DON DONKI', 'DONKI', '唐吉軻德', '驚安殿堂', '日本超市', '西門唐吉訶德', '忠孝新生唐吉訶德'],
    categoryName: '生活百貨',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🐧 推薦 國泰 CUBE 樂饗購 (3.0%~3.3%) 或 兆豐 BT21 (3.0%)；若在日本當地門市請切換【日本賞 3.5%】',
    cubeScheme: '樂饗購',
    taishinScheme: '大筆刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 3.0
  },

  // ==========================================
  // 5. 家電家居與 3C (國泰【來買電】/ 台新【大筆刷】)
  // ==========================================
  {
    name: 'IKEA (宜家家居)',
    aliases: ['IKEA', '宜家家居', 'ikea', '宜家', '家具', '居家用品', 'IKEA餐廳', '瑞典餐廳'],
    categoryName: '居家生活',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🛋️ 推薦 國泰 CUBE 來買電 (3.0%) 或 台新大筆刷 (3.3%)',
    cubeScheme: '來買電',
    taishinScheme: '大筆刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 1.0
  },
  {
    name: '特力屋 / HOLA 和樂家居',
    aliases: ['特力屋', 'HOLA', '和樂家居', '特力集團', '居家修繕', '五金', '家具'],
    categoryName: '居家生活',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🔨 推薦 國泰 CUBE 來買電 (3.0%) 或 台新大筆刷 (3.3%)',
    cubeScheme: '來買電',
    taishinScheme: '大筆刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 1.0
  },
  {
    name: '宜得利家居 (NITORI)',
    aliases: ['宜得利家居', '宜得利', 'NITORI', 'nitori', '日本家具', '生活用品'],
    categoryName: '居家生活',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🛏️ 推薦 國泰 CUBE 來買電 (3.0%) 或 台新大筆刷 (3.3%)',
    cubeScheme: '來買電',
    taishinScheme: '大筆刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 1.0
  },
  {
    name: '全國電子 / 燦坤 3C / 集雅社',
    aliases: ['全國電子', '燦坤', '燦坤3C', '集雅社', '家電', '3C賣場', '冷氣', '冰箱', '電視'],
    categoryName: '居家生活',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '🔌 推薦 國泰 CUBE 來買電 (3.0%) 或 台新大筆刷 (3.3%)',
    cubeScheme: '來買電',
    taishinScheme: '大筆刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 1.0
  },

  // ==========================================
  // 6. 加油與充電 (國泰【集精選/趣旅行】/ 台新【天天刷】)
  // ==========================================
  {
    name: '台灣中油 (直營加油站)',
    aliases: ['台灣中油 (直營加油站)', '台灣中油', '中油', '中油直營', '中油加油站', '中油Pay', 'CPC', '加油'],
    categoryName: '加油充電',
    isPitfall: true,
    pitfallWarning: '⚠️ 國泰 CUBE【集精選 2.0%】與台新【天天刷 3.3%】僅限「中油直營門市」（招牌有標示【台灣中油股份有限公司】）；加盟站不適用。',
    paymentAdvice: '⛽ 推薦 台新天天刷 (3.3%) 或 CUBE 集精選 (2.0%)，中油 Pay 綁台新/CUBE 同享優惠',
    cubeScheme: '集精選',
    taishinScheme: '天天刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 1.0
  },
  {
    name: '台塑加油站 / 全國加油站 / 福懋加油站',
    aliases: ['台塑加油站', '台塑', '全國加油站', '福懋加油站', '全國加油', '加油站', '台亞加油站'],
    categoryName: '加油充電',
    isPitfall: false,
    pitfallWarning: '',
    paymentAdvice: '⛽ 推薦 台新天天刷 (3.3%) 或 國泰 CUBE 台塑聯名/指定方案 (2.0%)',
    cubeScheme: '台塑家',
    taishinScheme: '天天刷 (3.3%)',
    ubearRate: 1.0,
    megaRate: 1.0
  }
];

async function updateAllMerchants() {
  try {
    console.log('🔄 正在同步並擴充完整 2026 官方特約通路至 Notion 資料庫...');

    // 1. 先抓取 Notion 內現有通路名稱
    let existingPages = [];
    let hasMore = true;
    let nextCursor = undefined;

    while (hasMore) {
      const resp = await notion.databases.query({
        database_id: databaseId.replace(/-/g, ''),
        start_cursor: nextCursor,
        page_size: 100
      });
      existingPages = existingPages.concat(resp.results);
      hasMore = resp.has_more;
      nextCursor = resp.next_cursor;
    }

    const existingNames = new Set(
      existingPages.map((p) => {
        const titleProp = p.properties['店家名稱'] || p.properties['Name'];
        return titleProp?.title?.[0]?.plain_text || '';
      }).filter(Boolean)
    );

    console.log(`📋 Notion 目前已有 ${existingNames.size} 個特約通路紀錄`);

    // 2. 檢查並寫入缺漏的特約通路
    let addedCount = 0;
    for (let i = 0; i < comprehensiveMerchants.length; i++) {
      const m = comprehensiveMerchants[i];
      if (existingNames.has(m.name)) {
        continue;
      }

      await notion.pages.create({
        parent: { database_id: databaseId.replace(/-/g, '') },
        properties: {
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
        }
      });

      addedCount++;
      console.log(`✨ [${addedCount}] 已將【${m.name}】寫入 Notion 資料庫！`);
      await new Promise((r) => setTimeout(r, 350));
    }

    console.log(`🎉 成功補充 ${addedCount} 筆官方特約通路至 Notion！`);
  } catch (err) {
    console.error('❌ 更新錯誤:', err);
  }
}

updateAllMerchants();
