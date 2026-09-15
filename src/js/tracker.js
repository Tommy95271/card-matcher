import { store, DEFAULT_PUBLIC_GAS_WEBHOOK } from './store.js';
import { firebaseService } from './firebase.js';
import { syncLogger } from './logger.js';

const STORAGE_KEY = 'card_matcher_expenses_v1';

export class Tracker {
  constructor() {
    this.expenses = this.loadExpenses();
    this.syncListeners = [];
    this.firebaseUser = null;

    // 監聽 Firebase 登入狀態
    firebaseService.onAuthChange((user) => {
      this.handleAuthChange(user);
    });
  }

  onSyncUpdate(callback) {
    this.syncListeners.push(callback);
  }

  notifySyncUpdate(data) {
    this.syncListeners.forEach((cb) => cb(data));
  }

  async handleAuthChange(user) {
    this.firebaseUser = user;
    if (user) {
      syncLogger.log({
        type: 'firestore',
        action: 'auth',
        status: 'success',
        message: `Google 帳號已登入 (${user.email || user.displayName})`
      });

      // 1. 自動將本機未登入前的記帳紀錄合併上傳至 Firestore 雲端
      if (this.expenses.length > 0) {
        try {
          await firebaseService.batchMigrateLocalExpenses(user.uid, this.expenses);
          syncLogger.log({
            type: 'firestore',
            action: 'add',
            status: 'success',
            message: `成功將本機 ${this.expenses.length} 筆紀錄遷移至 Firestore`
          });
        } catch (e) {
          syncLogger.log({
            type: 'firestore',
            action: 'add',
            status: 'error',
            message: '本機紀錄遷移至 Firestore 失敗',
            details: e.message
          });
          console.warn('本機紀錄遷移至 Firestore 失敗:', e);
        }
      }

      // 2. 開啟 Firestore 即時雙向監聽 (Live Sync)
      firebaseService.subscribeUserExpenses(user.uid, (cloudList) => {
        // 保留本機已知但雲端尚未及時寫入的 notionPageId
        this.expenses = cloudList.map((cloudItem) => {
          const localItem = this.expenses.find((e) => e.id === cloudItem.id);
          if (localItem && localItem.notionPageId && !cloudItem.notionPageId) {
            cloudItem.notionPageId = localItem.notionPageId;
            cloudItem.syncStatus = localItem.syncStatus;
          }
          return cloudItem;
        });
        this.saveExpenses();
        this.notifySyncUpdate({ type: 'firebase_sync', user, count: this.expenses.length });
      });
    } else {
      // 登出時載入本機 LocalStorage
      this.expenses = this.loadExpenses();
      syncLogger.log({
        type: 'firestore',
        action: 'auth',
        status: 'info',
        message: 'Google 帳號已登出，切換至本機離線模式'
      });
      this.notifySyncUpdate({ type: 'firebase_logout' });
    }
  }

  loadExpenses() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('載入消費紀錄失敗:', e);
      return [];
    }
  }

  saveExpenses() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.expenses));
    } catch (e) {
      console.warn('儲存消費紀錄失敗:', e);
    }
  }

  /**
   * 輔助解析 GAS Webhook 回應 (自動識別 JSON 與 Google HTML 錯誤頁面)
   */
  async parseWebhookResponse(response) {
    const text = await response.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // 若回傳 HTML 錯誤頁面 (如 PERMISSION_DENIED 或 Google 登入轉址)
      if (text.includes('PERMISSION_DENIED') || text.includes('很抱歉，目前無法開啟這個檔案')) {
        throw new Error('Google Apps Script 權限不足 (PERMISSION_DENIED)：請至 GAS 部署設定將存取權限設為「所有人 (Anyone)」');
      }
      if (text.includes('<html') || text.includes('<!DOCTYPE')) {
        throw new Error('GAS Webhook 回傳非預期的 HTML 網頁 (可能是網址錯誤或未授權公開存取)');
      }
      throw new Error(`GAS 回傳格式錯誤: ${text.substring(0, 150)}`);
    }
    return data;
  }

  /**
   * 計算預期回饋點數/金額
   */
  calculateReward(amount, rate, cardId) {
    const numAmount = parseFloat(amount) || 0;
    const numRate = parseFloat(rate) || 0;
    const rawReward = (numAmount * numRate) / 100;

    let unit = '點';
    let rewardName = '點數';
    let roundedReward = Math.round(rawReward);

    if (cardId === 'cathay_cube') {
      unit = '點';
      rewardName = '小樹點';
      roundedReward = Math.round(rawReward);
    } else if (cardId === 'taishin_richart') {
      unit = '點';
      rewardName = '台新Point';
      roundedReward = Math.round(rawReward);
    } else if (cardId === 'esun_ubear') {
      unit = '元';
      rewardName = '折抵帳單';
      roundedReward = Math.floor(rawReward);
    } else if (cardId === 'mega_bt21') {
      unit = '元';
      rewardName = '現金回饋';
      roundedReward = Math.floor(rawReward);
    }

    return {
      rawReward,
      expectedPoints: roundedReward,
      unit,
      rewardName
    };
  }

  /**
   * 新增一筆消費紀錄
   */
  logExpense({
    merchantName,
    cardName,
    schemeName,
    rate,
    amount,
    date = null,
    cardId = '',
    bank = '',
    notes = ''
  }) {
    const parsedAmount = parseFloat(amount) || 0;
    const parsedRate = parseFloat(rate) || 0;
    const { expectedPoints, unit, rewardName } = this.calculateReward(parsedAmount, parsedRate, cardId);

    const newEntry = {
      id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      merchantName: (merchantName || '').trim(),
      cardName: (cardName || '').trim(),
      schemeName: (schemeName || '').trim(),
      rate: parsedRate,
      amount: parsedAmount,
      expectedPoints: expectedPoints,
      actualPoints: null,
      unit,
      rewardName,
      date: date || new Date().toISOString().split('T')[0],
      notes: (notes || '').trim(),
      status: 'pending',
      cardId,
      bank,
      notionPageId: null,
      syncStatus: 'local',
      createdAt: new Date().toISOString()
    };

    this.expenses.unshift(newEntry);
    this.saveExpenses();

    // 如果使用者有 Google 登入，同步寫入 Firestore
    if (this.firebaseUser) {
      firebaseService.saveExpense(this.firebaseUser.uid, newEntry)
        .then(() => {
          syncLogger.log({
            type: 'firestore',
            action: 'add',
            status: 'success',
            message: `Firestore 記帳同步成功【${newEntry.merchantName}】NT$ ${newEntry.amount}`
          });
        })
        .catch((e) => {
          syncLogger.log({
            type: 'firestore',
            action: 'add',
            status: 'error',
            message: `Firestore 寫入失敗【${newEntry.merchantName}】`,
            details: e.message
          });
          console.warn('Firestore 寫入失敗:', e);
        });
    }

    // 背景觸發 GAS 同步
    this.syncExpenseToCloud(newEntry);

    return newEntry;
  }

  /**
   * 取得具辨識度之記帳人識別標籤 (登入姓名/Email 或持久化訪客裝置代碼)
   */
  getUserIdentifier() {
    if (this.firebaseUser) {
      const name = this.firebaseUser.displayName || '';
      const email = this.firebaseUser.email || '';
      if (name && email) return `${name} (${email})`;
      if (email) return email;
      if (name) return name;
    }

    // 訪客模式：產生或取得持久化裝置識別碼
    let deviceId = localStorage.getItem('card_matcher_device_id_v1');
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2, 6).toUpperCase();
      try { localStorage.setItem('card_matcher_device_id_v1', deviceId); } catch (e) {}
    }
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
    const clientType = isMobile ? '行動裝置' : '電腦端';
    return `訪客 (裝置 #${deviceId} • ${clientType})`;
  }

  addExpense(params) {
    return this.logExpense(params);
  }

  /**
   * 背景非同步同步單筆消費至 Google Apps Script 中央 Notion
   */
  async syncExpenseToCloud(entry) {
    const profile = store.getProfile();
    const webhookUrl = (profile.gasWebhookUrl || DEFAULT_PUBLIC_GAS_WEBHOOK || '').trim();
    if (!webhookUrl) return;

    entry.syncStatus = 'syncing';
    this.saveExpenses();
    this.notifySyncUpdate({ type: 'syncing', expenseId: entry.id });

    const userIdentifier = this.getUserIdentifier();
    const payloadData = {
      ...entry,
      userIdentifier,
      userEmail: this.firebaseUser?.email || '',
      userName: this.firebaseUser?.displayName || '',
      userId: this.firebaseUser?.uid || ''
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'add_expense',
          notionApiKey: profile.notionApiKey || '',
          notionDbId: profile.notionDatabaseId || '',
          userIdentifier,
          data: payloadData
        })
      });

      const result = await this.parseWebhookResponse(response);
      if (result && result.success && result.result && result.result.notionPageId) {
        entry.notionPageId = result.result.notionPageId;
        entry.syncStatus = 'synced';
        this.saveExpenses();
        // 若有 Google 登入，將 notionPageId 回寫至 Firestore
        if (this.firebaseUser) {
          firebaseService.saveExpense(this.firebaseUser.uid, entry).catch((e) => console.warn('Firestore 保存 notionPageId 失敗:', e));
        }
        syncLogger.log({
          type: 'notion',
          action: 'add',
          status: 'success',
          message: `Notion 新增記帳成功【${entry.merchantName}】NT$ ${entry.amount}`,
          details: { notionPageId: entry.notionPageId }
        });
        this.notifySyncUpdate({ type: 'synced', expenseId: entry.id, notionPageId: entry.notionPageId });
      } else {
        const errMsg = (result && result.error) || 'Notion 同步失敗';
        entry.syncStatus = 'error';
        this.saveExpenses();
        syncLogger.log({
          type: 'notion',
          action: 'add',
          status: 'error',
          message: `Notion 新增記帳失敗【${entry.merchantName}】: ${errMsg}`,
          details: result
        });
        this.notifySyncUpdate({ type: 'error', expenseId: entry.id, error: errMsg });
      }
    } catch (err) {
      console.warn('背景同步至 Notion 失敗:', err);
      entry.syncStatus = 'error';
      this.saveExpenses();
      syncLogger.log({
        type: 'notion',
        action: 'add',
        status: 'error',
        message: `Notion 新增連線異常【${entry.merchantName}】: ${err.message}`,
        details: err.stack || err.message
      });
      this.notifySyncUpdate({ type: 'error', expenseId: entry.id, error: err.message });
    }
  }

  /**
   * 更新紀錄狀態 (verified / pending / discrepancy)
   */
  updateStatus(expenseId, status, actualPoints = null) {
    const expense = this.expenses.find((e) => e.id === expenseId);
    if (!expense) return null;

    expense.status = status;
    if (actualPoints !== null) {
      expense.actualPoints = parseFloat(actualPoints);
    } else if (status === 'verified') {
      expense.actualPoints = expense.expectedPoints;
    }
    this.saveExpenses();

    // 若有 Google 登入，即時同步更新 Firestore
    if (this.firebaseUser) {
      firebaseService.updateExpenseStatus(this.firebaseUser.uid, expenseId, expense.status, expense.actualPoints)
        .then(() => {
          syncLogger.log({
            type: 'firestore',
            action: 'update',
            status: 'success',
            message: `Firestore 狀態更新成功【${expense.merchantName}】➔ ${status}`
          });
        })
        .catch((e) => {
          syncLogger.log({
            type: 'firestore',
            action: 'update',
            status: 'error',
            message: `Firestore 狀態更新失敗【${expense.merchantName}】`,
            details: e.message
          });
          console.warn('Firestore 狀態更新失敗:', e);
        });
    }

    // 若該紀錄已存在 Notion Page ID，即時背景同步更新狀態；若無，嘗試重新新增同步
    if (expense.notionPageId) {
      this.updateStatusInCloud(expense);
    } else {
      this.syncExpenseToCloud(expense);
    }

    return expense;
  }

  async updateStatusInCloud(expense) {
    const profile = store.getProfile();
    const webhookUrl = (profile.gasWebhookUrl || DEFAULT_PUBLIC_GAS_WEBHOOK || '').trim();
    if (!webhookUrl || !expense.notionPageId) return;

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'update_status',
          notionApiKey: profile.notionApiKey || '',
          notionDbId: profile.notionDatabaseId || '',
          notionPageId: expense.notionPageId,
          status: expense.status,
          actualPoints: expense.actualPoints
        })
      });
      const data = await this.parseWebhookResponse(response);
      if (data && data.success) {
        syncLogger.log({
          type: 'notion',
          action: 'update',
          status: 'success',
          message: `Notion 狀態更新成功【${expense.merchantName}】➔ ${expense.status}`,
          details: { notionPageId: expense.notionPageId, status: expense.status, actualPoints: expense.actualPoints }
        });
      } else {
        const errMsg = (data && data.error) || '未知錯誤';
        syncLogger.log({
          type: 'notion',
          action: 'update',
          status: 'error',
          message: `Notion 狀態更新失敗【${expense.merchantName}】: ${errMsg}`,
          details: data
        });
        console.warn('更新 Notion 狀態失敗:', errMsg);
      }
    } catch (err) {
      syncLogger.log({
        type: 'notion',
        action: 'update',
        status: 'error',
        message: `Notion 狀態更新連線失敗【${expense.merchantName}】: ${err.message}`,
        details: err.stack || err.message
      });
      console.warn('更新 Notion 狀態失敗:', err);
    }
  }

  /**
   * 刪除一筆消費紀錄
   */
  deleteExpense(expenseId) {
    const expense = this.expenses.find((e) => e.id === expenseId);
    if (expense && expense.notionPageId) {
      this.deleteExpenseInCloud(expense.notionPageId, expense.merchantName);
    }
    if (this.firebaseUser) {
      firebaseService.deleteExpense(this.firebaseUser.uid, expenseId)
        .then(() => {
          syncLogger.log({
            type: 'firestore',
            action: 'delete',
            status: 'success',
            message: `Firestore 紀錄已刪除`
          });
        })
        .catch((e) => {
          syncLogger.log({
            type: 'firestore',
            action: 'delete',
            status: 'error',
            message: `Firestore 刪除失敗`,
            details: e.message
          });
          console.warn('Firestore 刪除失敗:', e);
        });
    }
    this.expenses = this.expenses.filter((e) => e.id !== expenseId);
    this.saveExpenses();
  }

  async deleteExpenseInCloud(notionPageId, merchantName = '') {
    const profile = store.getProfile();
    const webhookUrl = (profile.gasWebhookUrl || DEFAULT_PUBLIC_GAS_WEBHOOK || '').trim();
    if (!webhookUrl || !notionPageId) return;

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'delete_expense',
          notionApiKey: profile.notionApiKey || '',
          notionDbId: profile.notionDatabaseId || '',
          notionPageId
        })
      });
      const data = await this.parseWebhookResponse(response);
      if (data && data.success) {
        syncLogger.log({
          type: 'notion',
          action: 'delete',
          status: 'success',
          message: `Notion 紀錄已封存【${merchantName || notionPageId}】`,
          details: { notionPageId }
        });
      } else {
        const errMsg = (data && data.error) || '刪除失敗';
        syncLogger.log({
          type: 'notion',
          action: 'delete',
          status: 'error',
          message: `Notion 刪除失敗: ${errMsg}`,
          details: data
        });
        console.warn('刪除 Notion 紀錄失敗:', errMsg);
      }
    } catch (err) {
      syncLogger.log({
        type: 'notion',
        action: 'delete',
        status: 'error',
        message: `Notion 刪除連線異常: ${err.message}`,
        details: err.stack || err.message
      });
      console.warn('刪除 Notion 紀錄失敗:', err);
    }
  }

  /**
   * 從 Notion 雲端拉取最新記帳清單 (多裝置同步)
   */
  async pullFromCloud() {
    const profile = store.getProfile();
    const webhookUrl = (profile.gasWebhookUrl || DEFAULT_PUBLIC_GAS_WEBHOOK || '').trim();
    if (!webhookUrl) throw new Error('尚未設定 Google Apps Script Webhook 網址');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'fetch_expenses',
        notionApiKey: profile.notionApiKey || '',
        notionDbId: profile.notionDatabaseId || ''
      })
    });
    const result = await this.parseWebhookResponse(response);

    if (!result.success || !Array.isArray(result.expenses)) {
      throw new Error(result.error || '拉取資料失敗');
    }

    // 保留尚未同步至雲端的本機紀錄，並合併雲端資料
    const unsyncedLocals = this.expenses.filter((e) => !e.notionPageId);
    const cloudExpenses = result.expenses;

    // 建立新陣列：未同步的本機紀錄在最上方，接著是雲端紀錄
    this.expenses = [...unsyncedLocals, ...cloudExpenses];
    this.saveExpenses();
    return this.expenses;
  }

  /**
   * 測試 GAS Webhook 連線狀態
   */
  async testConnection(url, apiKey, dbId) {
    const profile = store.getProfile();
    const targetUrl = (url || profile.gasWebhookUrl || DEFAULT_PUBLIC_GAS_WEBHOOK || '').trim();
    if (!targetUrl) throw new Error('請輸入 Google Apps Script 網頁應用程式網址');

    const targetApiKey = (apiKey !== undefined ? apiKey : profile.notionApiKey) || '';
    const targetDbId = (dbId !== undefined ? dbId : profile.notionDatabaseId) || '';

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'test_connection',
        notionApiKey: targetApiKey,
        notionDbId: targetDbId
      })
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || '連線測試失敗');
    }
    return result.result || { connected: true, message: '連線成功！' };
  }

  /**
   * 取得月度統計資訊 (包含各銀行刷卡額與點數佔比分組)
   */
  getMonthlyStats(yearMonth) {
    const targetYM = yearMonth || new Date().toISOString().slice(0, 7); // e.g. '2026-09'

    const monthExpenses = this.expenses.filter((e) => e.date && e.date.startsWith(targetYM));

    const totalAmount = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalExpectedPoints = monthExpenses.reduce((sum, e) => sum + (e.expectedPoints || 0), 0);
    const pendingCount = monthExpenses.filter((e) => e.status === 'pending').length;
    const verifiedCount = monthExpenses.filter((e) => e.status === 'verified').length;
    const discrepancyCount = monthExpenses.filter((e) => e.status === 'discrepancy').length;

    // 計算各銀行 / 卡別分組統計
    const bankGroups = {};
    monthExpenses.forEach((e) => {
      const bankName = e.bank || '其他銀行';
      const cardName = e.cardName || '信用卡';
      const cardId = e.cardId || 'custom';
      const key = `${bankName}__${cardName}`;

      if (!bankGroups[key]) {
        bankGroups[key] = {
          bank: bankName,
          cardName: cardName,
          cardId: cardId,
          totalAmount: 0,
          totalPoints: 0,
          unit: e.unit || '點',
          rewardName: e.rewardName || '點數',
          count: 0
        };
      }
      bankGroups[key].totalAmount += (e.amount || 0);
      bankGroups[key].totalPoints += (e.expectedPoints || 0);
      bankGroups[key].count += 1;
    });

    const bankBreakdown = Object.values(bankGroups).map((item) => {
      const percentage = totalAmount > 0 ? ((item.totalAmount / totalAmount) * 100).toFixed(1) : 0;
      return {
        ...item,
        percentage: parseFloat(percentage)
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      yearMonth: targetYM,
      totalCount: monthExpenses.length,
      totalAmount,
      totalExpectedPoints,
      pendingCount,
      verifiedCount,
      discrepancyCount,
      bankBreakdown,
      expenses: monthExpenses
    };
  }

  /**
   * 自動產生銀行客服申訴話術
   */
  generateDisputeScript(expense) {
    const diff = (expense.expectedPoints - (expense.actualPoints || 0));
    const cardTitle = `${expense.bank} ${expense.cardName}`;
    const dateFormatted = expense.date;

    return `您好，我在 ${dateFormatted} 於【${expense.merchantName}】消費 NT$${expense.amount.toLocaleString()}，使用【${cardTitle}】，當時已切換為【${expense.schemeName} (${expense.rate}%)】。\n\n依據貴行官方權益公告，該通路預期應回饋 ${expense.expectedPoints} ${expense.unit}${expense.rewardName}，但帳單/點數明細中僅給予 ${expense.actualPoints !== null ? expense.actualPoints : '0'} ${expense.unit}。\n\n經核對該通路完全符合方案加碼範圍，敬請協助人工核實並補發短少的 ${diff > 0 ? diff : expense.expectedPoints} ${expense.unit}${expense.rewardName}，感謝！`;
  }

  /**
   * 匯出備份 JSON
   */
  exportData() {
    return JSON.stringify(this.expenses, null, 2);
  }

  /**
   * 匯入備份 JSON
   */
  importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        this.expenses = parsed;
        this.saveExpenses();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import error', e);
      return false;
    }
  }
}

export const tracker = new Tracker();
