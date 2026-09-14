import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.NOTION_API_KEY;
const hubPageId = '3dbdc85d-79dc-81df-a095-d0f8947d33a1'; // 剛剛建立的 💳 2026 信用卡權益方案與活動總覽 頁面 ID

if (!apiKey) {
  console.error('❌ 錯誤：請先在 .env 中設定 NOTION_API_KEY！');
  process.exit(1);
}

const notion = new Client({ auth: apiKey });

// 輔助函式：建立 Notion 區塊
function heading2(text) {
  return {
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: text } }]
    }
  };
}

function heading3(text) {
  return {
    object: 'block',
    type: 'heading_3',
    heading_3: {
      rich_text: [{ type: 'text', text: { content: text } }]
    }
  };
}

function paragraph(text) {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{ type: 'text', text: { content: text } }]
    }
  };
}

function bullet(text) {
  return {
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: [{ type: 'text', text: { content: text } }]
    }
  };
}

function callout(text, emoji = '💡') {
  return {
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [{ type: 'text', text: { content: text } }],
      icon: { type: 'emoji', emoji }
    }
  };
}

async function seedCardPages() {
  try {
    console.log('🚀 開始在 Notion 內建立 4 大信用卡 2026 年度權益與方案詳情子頁面...');

    // 1. 國泰世華 CUBE 卡
    console.log('📝 正在建立：國泰世華 CUBE 卡 (2026 活動與 9 大方案)...');
    await notion.pages.create({
      parent: { page_id: hubPageId },
      icon: { type: 'emoji', emoji: '🌳' },
      properties: {
        title: [{ text: { content: '國泰世華 CUBE 卡【2026 年度活動與 9 大權益方案】' } }]
      },
      children: [
        callout('國泰 CUBE 卡主打每日切換方案，小樹點（信用卡）1點 = 1元，可即時折抵未出帳消費。切換方案需於「台灣時間當日 23:59 前」完成，回溯計算全日消費。', '📌'),
        heading2('🎯 2026 卡友等級與加碼門檻'),
        bullet('Level 1 (基礎持卡)：未設定帳戶扣繳，加碼通路享 2.0% 回饋，一般消費 0.3%'),
        bullet('Level 2 (自動扣繳加碼)：設定國泰世華帳戶自動扣繳卡款，加碼通路享 3.0% 回饋無上限'),
        bullet('Level 3 (財富管理貴賓)：國泰世華財富管理貴賓 (往來資產 300 萬以上)，加碼通路享 3.3% 回饋無上限'),
        
        heading2('📋 2026 官方 9 大權益方案明細'),
        heading3('1. 【玩數位】(3.0% ~ 3.3%)'),
        bullet('指定網購電商：蝦皮購物、momo購物網、PChome 24h、Yahoo奇摩購物、Coupang 酷澎'),
        bullet('串流影音：Netflix、Disney+、YouTube Premium、Spotify、KKBOX'),
        bullet('遊戲平台：Apple App Store、Google Play、PlayStation、Nintendo'),
        callout('⚠️ 避坑提醒：博客來、淘寶網、東森購物「非」玩數位加碼通路，在博客來刷 CUBE 僅享一般消費 0.3%！', '⚠️'),

        heading3('2. 【樂饗購】(3.0% ~ 3.3%)'),
        bullet('全台各大百貨：新光三越、SOGO、遠東百貨、微風、台北101、統一時代(台北/高雄/夢時代)、誠品生活、京站、宏匯廣場、南紡、台茂、大江、新竹巨城、裕隆城、三井Outlet、LaLaport、華泰名品城、漢神巨蛋、義享天地等'),
        bullet('餐飲美食：全台獨立餐廳與飯店餐飲（王品、瓦城、饗賓、壽司郎、藏壽司、鼎泰豐等）'),
        bullet('外送平台：Uber Eats、foodpanda'),
        bullet('生活藥妝：康是美、屈臣氏'),

        heading3('3. 【趣旅行】(3.0% ~ 3.3%)'),
        bullet('海外實體消費：日本、韓國、新加坡、泰國、歐美等所有海外實體門市刷卡'),
        bullet('指定航空：中華航空、長榮航空、星宇航空、台灣虎航、國泰航空官網購票'),
        bullet('訂房旅遊：Agoda、Booking.com、Trip.com、Klook、KKday、雄獅旅遊、易遊網'),
        bullet('交通出行：台灣高鐵、台灣大車隊 (55688)、Uber (乘車)、LINE Taxi、yoxi、iRent'),

        heading3('4. 【集精選】(2.0% 固定)'),
        bullet('指定超商：7-ELEVEN、全家便利商店 (限實體門市或指定錢包綁定)'),
        bullet('超市量販：家樂福 (量販/超市/線上)、LOPIA 台灣、全聯福利中心 實體門市'),
        bullet('加油充電：台灣中油 (直營加油站)、EVOASIS、U-POWER、EVALUE、TAIL'),
        bullet('停車生活：車麻吉、uTagGo、IKEA 宜家家居'),

        heading3('5. 【全支付】(2.0% 固定)'),
        bullet('全聯福利中心、大全聯 (原大潤發) 及全支付特約合作店家，需透過全支付 App 綁定消費。'),

        heading3('6. 【台塑家】(專屬油價優惠及回饋)'),
        bullet('指定加油站：台塑石油、台亞加油站、福懋加油站、統一速邁樂 (限本島)'),
        bullet('生醫生活：台塑生醫、長庚生技、台塑蔬菜、台塑購物網、7-11/全家/萊爾富'),

        heading3('7. 【慶生月】(壽星專屬 3.5% ~ 10%)'),
        bullet('10%：指定精選燒肉/火鍋/餐廳、日本指定樂園 (迪士尼/環球影城)、KTV (錢櫃/好樂迪)'),
        bullet('3.5%：新光三越、Uber Eats、Klook、FunNow'),

        heading3('8. 【童樂匯】(親子專屬 1% / 5% / 10%)'),
        bullet('10%：雲門舞集舞蹈教室、Yamaha音樂教室、TutorABC Junior、iSKI滑雪俱樂部'),
        bullet('5%：親子餐廳 (壽司郎、雞湯大叔、陶板屋)、飯店樂園 (Xpark、麗寶、六福村、喜來登)'),
        bullet('1%：國內各大壽/產險保費、指定私校學費 (i繳費)'),

        heading3('9. 【固定回饋】(1.2% / 2.5%)'),
        bullet('一般消費 (不含保費) 享 1.2%、指定海外實體消費享 2.5%（免手動切換防呆方案）。'),

        heading2('🔗 官方權益連結'),
        paragraph('官方活動網站：https://www.cathay-cube.com.tw/cathaybk/personal/product/credit-card/cards/cube-list')
      ]
    });

    // 2. 台新銀行 Richart 卡
    console.log('📝 正在建立：台新銀行 Richart 卡 (2026 活動與 7+1 大刷方案)...');
    await notion.pages.create({
      parent: { page_id: hubPageId },
      icon: { type: 'emoji', emoji: '🐶' },
      properties: {
        title: [{ text: { content: '台新銀行 Richart 卡【2026 年度活動與 7+1 大刷方案】' } }]
      },
      children: [
        callout('台新 Richart 卡主打 Richart Life App 每日自由切換方案，台新 Point 1點 = 1元，可即時 100% 折抵帳單。切換方案於當日 23:59 前生效並回溯計算當日消費。', '📌'),
        heading2('🎯 2026 卡友等級與扣繳加碼門檻'),
        bullet('LEVEL 1 (一般卡友)：未設定自動扣繳，指定加碼通路享 1.3%，一般消費 0.3%'),
        bullet('LEVEL 2 (自動扣繳加碼)：設定台新/Richart 帳戶自動扣繳信用卡帳款，指定加碼通路享 3.3% ~ 10% 回饋'),
        bullet('新戶優惠：新核卡 60 天內直接適用 LEVEL 2 權益'),
        bullet('加碼上限：每期帳單加碼上限為「持卡人永久信用額度 + 30 萬元」，超額部分享 0.3%'),

        heading2('📋 2026 官方 7+1 大刷方案明細'),
        heading3('1. 【Chill 刷】(最高 10%)'),
        bullet('歡樂微醺 (10%)：詹記、萬客什鍋、海底撈、屋馬燒肉、茶六、碳佐麻里、雞湯大叔、貳樓、樂子、臺虎精釀等'),
        bullet('日常續命 (10%)：50嵐、得正、五桐號、龜記、UG TEA、叮哥茶飲、CAFE!N、%Arabica'),
        bullet('約會犒賞 (5%)：饗饗 INPARADISE、NAGOMI'),
        bullet('沉浸娛樂 (5%)：Netflix、Disney+、巴哈姆特、BOOK WALKER、WEVERSE'),
        bullet('數位外掛 (3.3%)：Apple 直營/官網、Studio A、DJI、蝦皮、淘寶、酷澎、Uber Eats'),
        bullet('運動健身 (5%)：健身工廠、World Gym、Anytime Fitness、Nike、Adidas、lululemon'),

        heading3('2. 【Pay 著刷】(3.8% / 2.3%)'),
        bullet('3.8% 回饋：台新 Pay、台新 Pay+（含 TWQR 台灣 Pay 與日韓特店免 1.5% 手續費）'),
        bullet('2.3% 回饋：LINE Pay、全盈+Pay'),

        heading3('3. 【天天刷】(3.3%)'),
        bullet('日常採買：家樂福、大買家、唐吉訶德、LOPIA、智生活、全家 / 7-11（⚠️ 兩大超商限用台新 Pay）'),
        bullet('通勤交通：台灣高鐵、臺鐵、台灣大車隊、yoxi、Uber、LINE GO、台灣 Bolt'),
        bullet('加油充電：中油直營、全國加油、EVOASIS、華城電能 EVALUE、車麻吉 (Autopass)、USPACE'),
        bullet('生活藥妝：寶雅、康是美、屈臣氏、大樹藥局、杏一醫療、丁丁藥局'),
        callout('⚠️ 超商避坑：7-11 與全家直接刷實體卡或一般 LINE Pay 為 0% 回饋！必須綁定「台新 Pay」支付！', '⚠️'),

        heading3('4. 【大筆刷】(3.3%)'),
        bullet('各大百貨：新光三越 (含 skm pay)、遠東百貨、SOGO、微風、台北101、巨城、南紡、誠品生活、京站、統一時代、LaLaport、漢神巨蛋'),
        bullet('指定 Outlet：三井 Outlet (林口/台中港/台南)、華泰名品城、SKM Park'),
        bullet('居家大型：IKEA、特力屋、HOLA、宜得利家居、瑪黑家居'),
        bullet('時尚名品：UNIQLO、GU、ZARA、NET、lululemon 獨立門市/官網'),

        heading3('5. 【好饗刷】(3.3%)'),
        bullet('全臺餐飲：全臺獨立餐廳（MCC Code 5811~5814）'),
        bullet('外送平台：Uber Eats、foodpanda'),
        bullet('餐飲娛樂：王品瘋 Pay、錢櫃、好樂迪、ONCOR、享溫馨'),
        bullet('購票娛樂：拓元售票、KKTIX、年代、寬宏、OPENTIX、FunNow'),
        bullet('指定飯店：晶華、萬豪旗下、煙波、老爺、福華、漢來、君悅、洲際'),

        heading3('6. 【數趣刷】(3.3%)'),
        bullet('網購電商：博客來、蝦皮購物、momo購物網、酷澎 (Coupang)、PChome 24h、淘寶/天貓、Amazon、東森、iHerb、Olive Young'),
        bullet('線上課程：知識衛星、Hahow、AmazingTalker、TutorABC、PressPlay'),
        bullet('電玩影音：Steam、PlayStation、Nintendo、Netflix、Disney+、MyCard'),
        bullet('AI 科技：ChatGPT、Notion、Canva、Perplexity、Claude'),
        callout('✨ 亮點：博客來、淘寶網、AI 工具訂閱 (ChatGPT / Claude / Notion) 均正式納入 3.3% 加碼！', '💡'),

        heading3('7. 【玩旅刷】(3.3%)'),
        bullet('海外消費：全球海外實體門市與海外線上交易（含歐洲實體）'),
        bullet('交通票券：海外 Uber、Grab、SUICA、ICOCA、PASMO、WOWPASS'),
        bullet('航空公司：華航、長榮、星宇、台灣虎航、國泰航空、樂桃、酷航、日航、星航官網'),
        bullet('訂房平台：Klook、KKday、Agoda、Booking.com、Trip.com、Airbnb、Hotels.com'),
        bullet('旅行社：雄獅旅遊、易遊網、可樂旅遊、東南旅遊、五福、加利利'),

        heading3('8. 【+1 假日刷】(2.0%)'),
        bullet('節假日全通路：國定例假日國內全通路享 2.0%（支援實體卡、LINE Pay、全盈+Pay、台新Pay、Apple Pay，亦包含手動繳保費）。'),

        heading2('🔗 官方權益連結'),
        paragraph('官方活動網站：https://www.taishinbank.com.tw/TSB/personal/credit/intro/overview/future/ab46dfa7-5d88-11f1-b50f-0050568c09e3')
      ]
    });

    // 3. 玉山銀行 UBear 信用卡
    console.log('📝 正在建立：玉山銀行 UBear 信用卡 (2026 活動與 3% / 10% 方案)...');
    await notion.pages.create({
      parent: { page_id: hubPageId },
      icon: { type: 'emoji', emoji: '🐻' },
      properties: {
        title: [{ text: { content: '玉山銀行 UBear 信用卡【2026 年度活動與 3% / 10% 方案】' } }]
      },
      children: [
        callout('玉山 UBear 信用卡主打網購與行動支付 3% 現金回饋、指定影音娛樂 10%，直接折抵次期帳單。免切換方案，適合無腦線上消費。', '📌'),
        heading2('🎯 2026 卡友等級與扣繳門檻'),
        bullet('Level 1 (未扣繳)：未設定玉山帳戶扣繳，網購享 2.5% 回饋，一般消費 0.5%'),
        bullet('Level 2 (e化帳單+扣繳)：申請 e 化帳單 + 設定玉山帳戶自動扣繳，網購享 3.0% 回饋，一般消費 1.0%'),

        heading2('📋 2026 官方特約加碼方案明細'),
        heading3('1. 【網路消費 / 行動支付 3.0%】'),
        bullet('網購電商：momo購物網、蝦皮購物、PChome、博客來、酷澎 (Coupang)、淘寶網、Apple 官網、Google Store 等線上交易'),
        bullet('指定行動支付：LINE Pay、街口支付、全支付、OPEN 錢包、icash Pay 綁定消費'),
        bullet('回饋上限：每期加碼上限 150 元（每月刷滿 NT$7,500 達上限）'),

        heading3('2. 【指定影音/遊戲/AI 平台 10.0%】'),
        bullet('影音娛樂：Netflix、Spotify、Disney+、YouTube Premium、KKBOX'),
        bullet('遊戲平台：Nintendo、PlayStation、Steam、Google Play'),
        bullet('AI 科技：ChatGPT / OpenAI、Gemini、Claude、Google One'),
        bullet('回饋上限：每期加碼上限 100 元（每月刷滿 NT$1,000 達上限）'),

        heading2('🔗 官方權益連結'),
        paragraph('官方活動網站：https://www.esunbank.com/zh-tw/personal/credit-card/intro/bank-card/ubear')
      ]
    });

    // 4. 兆豐銀行 宇宙明星 BT21 信用卡
    console.log('📝 正在建立：兆豐銀行 宇宙明星 BT21 信用卡 (2026 活動與行動支付 3%~4% 方案)...');
    await notion.pages.create({
      parent: { page_id: hubPageId },
      icon: { type: 'emoji', emoji: '⭐' },
      properties: {
        title: [{ text: { content: '兆豐銀行 宇宙明星 BT21 信用卡【2026 年度活動與行動支付 3%~4% 方案】' } }]
      },
      children: [
        callout('兆豐 BT21 信用卡主打指定行動支付（Apple Pay、LINE Pay 等）加碼 2% 回饋，國內最高 3%、國外最高 4%，申辦電子帳單免年費。', '📌'),
        heading2('🎯 2026 卡友等級與加碼門檻'),
        bullet('Level 1 (紙本帳單)：一般消費 0.3%，指定行動支付 2.3%'),
        bullet('Level 2 (電子帳單+自動扣繳)：申請電子帳單並設定帳戶扣繳，一般消費 1.0%，指定行動支付享 3.0% ~ 4.0%'),

        heading2('📋 2026 官方特約加碼方案明細'),
        heading3('1. 【指定行動支付加碼 2.0%（國內 3% / 國外 4%）】'),
        bullet('適用行動支付：Apple Pay、Google Pay、LINE Pay、街口支付、台灣 Pay、Samsung Pay'),
        bullet('國內回饋：基礎 1.0% + 行動支付加碼 2.0% = 3.0% 現金回饋'),
        bullet('國外回饋：基礎 2.0% + 行動支付加碼 2.0% = 4.0% 現金回饋（排除歐盟實體交易）'),
        bullet('回饋上限：每期加碼上限 200 元（每月刷滿 NT$10,000 達上限）'),

        heading3('2. 【台灣 Pay 掃碼加碼 1.5%（最高 4.5%）】'),
        bullet('使用「台灣 Pay APP」或兆豐行動銀行 QR Code 掃碼消費再享登錄加碼 1.5%'),
        bullet('回饋上限：每月登錄加碼上限 100 元（每月刷滿 NT$6,666 達上限）'),

        heading2('🔗 官方權益連結'),
        paragraph('官方活動網站：https://www.megabank.com.tw/personal/credit-card/card/overview/bt21creditcard')
      ]
    });

    console.log('🎉 所有 4 大信用卡 2026 活動與內層方案頁面已全數建立完畢！');
  } catch (err) {
    console.error('❌ 建立子頁面過程發生錯誤:', err);
  }
}

seedCardPages();
