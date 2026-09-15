/**
 * =========================================================================
 * 2026 信用卡最佳方案與點數查核中心 (Card Matcher)
 * 同步日誌與即時診斷模組 (Sync Logger & Diagnostics Service)
 * =========================================================================
 */

const STORAGE_KEY = 'card_matcher_sync_logs_v1';
const MAX_LOGS = 50;

class SyncLogger {
  constructor() {
    this.listeners = [];
    this.logs = this.loadLogs();
  }

  loadLogs() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('載入同步日誌失敗:', e);
      return [];
    }
  }

  saveLogs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    } catch (e) {
      console.warn('儲存同步日誌失敗:', e);
    }
  }

  /**
   * 記錄一筆同步事件
   * @param {Object} param0 
   * @param {'notion'|'firestore'|'system'} param0.type - 服務類型
   * @param {'add'|'update'|'delete'|'fetch'|'connect'|'auth'} param0.action - 操作動作
   * @param {'success'|'error'|'warning'|'info'} param0.status - 狀態
   * @param {string} param0.message - 摘要說明
   * @param {Object} [param0.details] - 詳細資料 (Payload, Error, Code 等)
   */
  log({ type = 'system', action = 'info', status = 'info', message = '', details = null }) {
    const now = new Date();
    const entry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type,
      action,
      status,
      message,
      details: details ? (typeof details === 'object' ? details : { raw: String(details) }) : null,
      timestamp: now.toISOString(),
      timeFormatted: now.toLocaleTimeString('zh-TW', { hour12: false })
    };

    this.logs.unshift(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(0, MAX_LOGS);
    }
    this.saveLogs();
    this.notifyListeners(entry);
    return entry;
  }

  /**
   * 取得所有日誌
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * 清除所有日誌
   */
  clearLogs() {
    this.logs = [];
    this.saveLogs();
    this.notifyListeners({ type: 'system', action: 'clear', status: 'info', message: '日誌已清空' });
  }

  /**
   * 訂閱日誌更新
   */
  onLog(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== callback);
    };
  }

  notifyListeners(entry) {
    this.listeners.forEach((fn) => {
      try {
        fn(entry, this.logs);
      } catch (e) {
        console.error('執行日誌監聽器錯誤:', e);
      }
    });
  }

  /**
   * 取得健康診斷統計
   */
  getHealthSummary() {
    const total = this.logs.length;
    const errors = this.logs.filter((l) => l.status === 'error').length;
    const warnings = this.logs.filter((l) => l.status === 'warning').length;
    const successes = this.logs.filter((l) => l.status === 'success').length;
    const lastError = this.logs.find((l) => l.status === 'error');

    return {
      total,
      errors,
      warnings,
      successes,
      hasError: errors > 0,
      lastError
    };
  }
}

export const syncLogger = new SyncLogger();
