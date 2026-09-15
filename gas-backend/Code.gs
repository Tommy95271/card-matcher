/**
 * =========================================================================
 * 2026 信用卡最佳方案與點數查核中心 (Card Matcher)
 * Google Apps Script - Notion API Serverless 中繼後端 (GAS Relay)
 * =========================================================================
 * 
 * 說明：
 * 本程式負責接收前端 (GitHub Pages / PWA 手機端) 發出的記帳與核對請求，
 * 透過 Google Apps Script 伺服器端環境呼叫 Notion 官方 REST API，
 * 完美解決瀏覽器端 CORS 限制，並實現手機/電腦即時寫入 Notion 雲端資料庫。
 */

// 預設 Notion 設定 (請於 GAS「專案設定」>「指令碼屬性」中設定 NOTION_API_KEY 與 NOTION_EXPENSES_DB_ID，或直接填入您的金鑰)
const DEFAULT_CONFIG = {
  NOTION_API_KEY: 'YOUR_NOTION_API_KEY', // 請填入您的 Notion API 金鑰
  NOTION_EXPENSES_DB_ID: '3dbdc85d79dc817e823dd77bcdb424e2',
  NOTION_VERSION: '2022-06-28'
};

/**
 * 取得 Notion 認證金鑰與資料庫 ID (優先使用 Request Payload 傳入的個人金鑰，次之使用伺服器指令碼屬性)
 */
function getConfig(payload) {
  const props = PropertiesService.getScriptProperties();
  const apiKey = (payload && payload.notionApiKey) || props.getProperty('NOTION_API_KEY') || DEFAULT_CONFIG.NOTION_API_KEY;
  const rawDbId = (payload && (payload.notionDbId || payload.notionExpensesDbId)) || props.getProperty('NOTION_EXPENSES_DB_ID') || DEFAULT_CONFIG.NOTION_EXPENSES_DB_ID;
  const expenseDbId = (rawDbId || '').replace(/-/g, '').trim();

  if (!apiKey || apiKey === 'YOUR_NOTION_API_KEY') {
    throw new Error('缺少 Notion API Key (請輸入 ntn_ 開頭的授權金鑰)');
  }
  if (!expenseDbId) {
    throw new Error('缺少 Notion Database ID (請提供 Notion 資料庫網址或 ID)');
  }

  return {
    apiKey: apiKey.trim(),
    expenseDbId: expenseDbId,
    version: DEFAULT_CONFIG.NOTION_VERSION
  };
}

/**
 * 核心網路中繼器：呼叫 Notion API 並自動處理頻率限制 (HTTP 429) 與指數退避重試
 */
function fetchNotionWithRetry(url, options, maxRetries) {
  const retries = maxRetries || 3;
  let attempt = 0;

  while (attempt < retries) {
    attempt++;
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();

    // 成功回應 (HTTP 200~299)
    if (code >= 200 && code < 300) {
      return response;
    }

    // 遇到頻率限制 (HTTP 429 Too Many Requests) 或伺服器暫時波動 (502/503/504)
    if (code === 429 || (code >= 502 && code <= 504)) {
      if (attempt >= retries) {
        throw new Error(`Notion API 觸發頻率限制或伺服器異常 (${code})，已重試 ${retries} 次仍失敗: ${response.getContentText()}`);
      }

      // 嘗試讀取 Notion 回傳的 Retry-After Header (秒數)，若無則採用指數退避 (500ms -> 1000ms -> 2000ms)
      const headers = response.getAllHeaders();
      let delayMs = Math.pow(2, attempt - 1) * 500;
      if (headers['Retry-After'] || headers['retry-after']) {
        const retrySec = parseFloat(headers['Retry-After'] || headers['retry-after']) || 1;
        delayMs = Math.max(delayMs, retrySec * 1000);
      }

      console.warn(`[Notion Rate Limit] 觸發 HTTP ${code}，將於 ${delayMs}ms 後進行第 ${attempt} 次重試...`);
      Utilities.sleep(delayMs);
      continue;
    }

    // 其他不可重試的錯誤 (如 400 Bad Request, 401 Unauthorized, 404 Not Found)
    throw new Error(`Notion API 錯誤 (${code}): ${response.getContentText()}`);
  }
}

/**
 * 處理 POST 請求 (新增記帳、更新核對狀態、刪除紀錄、連線測試)
 */
function doPost(e) {
  try {
    const rawData = e.postData ? e.postData.contents : '{}';
    const payload = JSON.parse(rawData);
    const action = payload.action || 'add_expense';

    let result = null;

    switch (action) {
      case 'add_expense':
        result = handleAddExpense(payload.data, payload);
        break;

      case 'update_status':
        result = handleUpdateStatus(payload.notionPageId, payload.status, payload.actualPoints, payload);
        break;

      case 'delete_expense':
        result = handleDeleteExpense(payload.notionPageId, payload);
        break;

      case 'test_connection':
        result = handleTestConnection(payload);
        break;

      case 'fetch_expenses':
        result = handleFetchExpenses(payload);
        return createJsonResponse({ success: true, count: result.length, expenses: result });

      default:
        throw new Error('未知的 Action: ' + action);
    }

    return createJsonResponse({ success: true, action: action, result: result });
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.message || error.toString()
    });
  }
}

/**
 * 處理 GET 請求 (拉取最新記帳清單、健康檢查)
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || 'ping';

    if (action === 'fetch_expenses' || action === 'test_connection') {
      const payload = {
        notionApiKey: params.notionApiKey,
        notionDbId: params.notionDbId || params.notionExpensesDbId
      };
      if (action === 'test_connection') {
        const testRes = handleTestConnection(payload);
        return createJsonResponse({ success: true, result: testRes });
      }
      const expenses = handleFetchExpenses(payload);
      return createJsonResponse({ success: true, count: expenses.length, expenses: expenses });
    }

    return createJsonResponse({
      success: true,
      service: 'Card Matcher Universal Notion GAS Relay API',
      status: 'active',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.message || error.toString()
    });
  }
}

/**
 * 1. 新增消費紀錄至 Notion【💳 2026 刷卡記帳與點數對帳庫】
 */
function handleAddExpense(data, payload) {
  const config = getConfig(payload);

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

  // 取得記帳人標籤 (Google 登入姓名/Email 或具辨識度訪客標籤)
  const userTag = (data.userIdentifier || data.userName || data.userEmail || payload.userIdentifier || '訪客 (本機端)').trim().slice(0, 100);

  const body = {
    parent: { database_id: config.expenseDbId },
    properties: {
      '消費項目': {
        title: [{ text: { content: data.merchantName || '一般消費' } }]
      },
      '記帳人': {
        select: { name: userTag.replace(/,/g, '') }
      },
      '消費日期': {
        date: { start: data.date || Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd') }
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
        rich_text: [{ text: { content: data.id || '' } }]
      },
      '備註': {
        rich_text: [{ text: { content: data.notes || '' } }]
      }
    }
  };

  const response = fetchNotionWithRetry('https://api.notion.com/v1/pages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + config.apiKey,
      'Notion-Version': config.version
    },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });

  const resJson = JSON.parse(response.getContentText());
  return {
    notionPageId: resJson.id,
    createdTime: resJson.created_time
  };
}

/**
 * 2. 更新消費紀錄狀態 (已入帳 / 漏給 / 實收點數)
 */
function handleUpdateStatus(notionPageId, status, actualPoints, payload) {
  if (!notionPageId) throw new Error('缺少 notionPageId');
  const config = getConfig(payload);

  let statusInNotion = '🟡 待核對';
  if (status === 'verified') statusInNotion = '🟢 已入帳';
  else if (status === 'discrepancy') statusInNotion = '🔴 漏給需申訴';

  const properties = {
    '核對狀態': {
      select: { name: statusInNotion }
    }
  };

  if (actualPoints !== null && actualPoints !== undefined) {
    properties['實收回饋點數'] = {
      number: parseInt(actualPoints, 10) || 0
    };
  }

  fetchNotionWithRetry(`https://api.notion.com/v1/pages/${notionPageId}`, {
    method: 'patch',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + config.apiKey,
      'Notion-Version': config.version
    },
    payload: JSON.stringify({ properties: properties }),
    muteHttpExceptions: true
  });

  return { success: true, notionPageId: notionPageId };
}

/**
 * 3. 刪除紀錄 (封存 Notion Page)
 */
function handleDeleteExpense(notionPageId, payload) {
  if (!notionPageId) throw new Error('缺少 notionPageId');
  const config = getConfig(payload);

  fetchNotionWithRetry(`https://api.notion.com/v1/pages/${notionPageId}`, {
    method: 'patch',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + config.apiKey,
      'Notion-Version': config.version
    },
    payload: JSON.stringify({ archived: true }),
    muteHttpExceptions: true
  });

  return { success: true, deleted: true };
}

/**
 * 4. 拉取 Notion 最新記帳清單
 */
function handleFetchExpenses(payload) {
  const config = getConfig(payload);

  const response = fetchNotionWithRetry(`https://api.notion.com/v1/databases/${config.expenseDbId}/query`, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + config.apiKey,
      'Notion-Version': config.version
    },
    payload: JSON.stringify({
      page_size: 100,
      sorts: [{ property: '消費日期', direction: 'descending' }]
    }),
    muteHttpExceptions: true
  });

  const resJson = JSON.parse(response.getContentText());
  const results = resJson.results || [];

  return results.map(function(page) {
    const props = page.properties;
    
    // 輔助函式
    const getTitle = function(prop) {
      if (!prop || !prop.title || !prop.title.length) return '';
      return prop.title.map(function(t) { return t.plain_text; }).join('');
    };
    const getRichText = function(prop) {
      if (!prop || !prop.rich_text || !prop.rich_text.length) return '';
      return prop.rich_text.map(function(t) { return t.plain_text; }).join('');
    };

    const merchantName = getTitle(props['消費項目']);
    const date = (props['消費日期'] && props['消費日期'].date) ? props['消費日期'].date.start : '';
    const amount = (props['刷卡金額'] && props['刷卡金額'].number) ? props['刷卡金額'].number : 0;
    const cardName = (props['信用卡'] && props['信用卡'].select) ? props['信用卡'].select.name : '國泰世華 CUBE 卡';
    const schemeRaw = getRichText(props['適用方案']);
    const rate = (props['回饋率%'] && props['回饋率%'].number) ? props['回饋率%'].number : 0;
    const expectedPoints = (props['預期回饋點數'] && props['預期回饋點數'].number) ? props['預期回饋點數'].number : 0;
    const actualPoints = (props['實收回饋點數'] && props['實收回饋點數'].number !== null && props['實收回饋點數'].number !== undefined) ? props['實收回饋點數'].number : null;
    const statusRaw = (props['核對狀態'] && props['核對狀態'].select) ? props['核對狀態'].select.name : '🟡 待核對';
    const notes = getRichText(props['備註']);

    let status = 'pending';
    if (statusRaw.indexOf('已入帳') !== -1) status = 'verified';
    else if (statusRaw.indexOf('漏給') !== -1) status = 'discrepancy';

    let cardId = 'cathay_cube';
    let bank = '國泰世華';
    if (cardName.indexOf('台新') !== -1) {
      cardId = 'taishin_richart';
      bank = '台新銀行';
    } else if (cardName.indexOf('玉山') !== -1) {
      cardId = 'esun_ubear';
      bank = '玉山銀行';
    } else if (cardName.indexOf('兆豐') !== -1) {
      cardId = 'mega_bt21';
      bank = '兆豐銀行';
    }

    let schemeName = schemeRaw;
    if (schemeRaw && schemeRaw.indexOf(' (') !== -1) {
      schemeName = schemeRaw.split(' (')[0];
    }

    const userTag = (props['記帳人'] && props['記帳人'].select) ? props['記帳人'].select.name : '';
    const recordId = getRichText(props['紀錄 ID']);

    return {
      id: recordId || `exp_notion_${page.id.replace(/-/g, '').slice(0, 8)}`,
      notionPageId: page.id,
      clientRecordId: recordId,
      userIdentifier: userTag,
      date: date,
      merchantName: merchantName,
      amount: amount,
      cardId: cardId,
      cardName: cardName,
      bank: bank,
      schemeName: schemeName || '一般消費',
      rate: rate,
      expectedPoints: expectedPoints,
      actualPoints: actualPoints,
      unit: (cardId === 'esun_ubear' || cardId === 'mega_bt21') ? '元' : '點',
      rewardName: (cardId === 'cathay_cube') ? '小樹點' : (cardId === 'taishin_richart' ? '台新Point' : '現金折抵'),
      status: status,
      notes: notes,
      syncStatus: 'synced',
      createdAt: page.created_time
    };
  });
}

/**
 * 5. 連線測試
 */
function handleTestConnection(payload) {
  const config = getConfig(payload);
  const response = fetchNotionWithRetry(`https://api.notion.com/v1/databases/${config.expenseDbId}`, {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + config.apiKey,
      'Notion-Version': config.version
    },
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  if (code !== 200) {
    throw new Error(`連線失敗 (HTTP ${code}): ${response.getContentText()}`);
  }

  const resJson = JSON.parse(response.getContentText());
  const dbTitle = resJson.title && resJson.title[0] ? resJson.title[0].plain_text : 'Notion 資料庫';
  return {
    connected: true,
    databaseTitle: dbTitle,
    message: `成功連線至 Notion 資料庫【${dbTitle}】！`
  };
}

/**
 * 輔助函式：產生標準 JSON 回應 (含 CORS Header)
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
