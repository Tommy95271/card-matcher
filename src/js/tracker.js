/**
 * 刷卡記帳與點數漏給查核中心 (Reward Point Tracker & Auditor)
 */

const STORAGE_KEY = 'card_matcher_expenses_v1';

export class Tracker {
  constructor() {
    this.expenses = this.loadExpenses();
  }

  loadExpenses() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load expenses from localStorage', e);
      return [];
    }
  }

  saveExpenses() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.expenses));
    } catch (e) {
      console.error('Failed to save expenses to localStorage', e);
    }
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
      // 國泰小樹點通常採四捨五入計算
      roundedReward = Math.round(rawReward);
    } else if (cardId === 'taishin_richart') {
      unit = '點';
      rewardName = '台新Point';
      // 台新Point 通常採四捨五入計算
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
  addExpense({
    date,
    merchantName,
    amount,
    cardId,
    cardName,
    bank,
    schemeName,
    rate,
    notes = ''
  }) {
    const numAmount = parseFloat(amount) || 0;
    const { expectedPoints, unit, rewardName } = this.calculateReward(numAmount, rate, cardId);

    const newEntry = {
      id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      date: date || new Date().toISOString().slice(0, 10),
      merchantName: merchantName.trim(),
      amount: numAmount,
      cardId,
      cardName,
      bank,
      schemeName,
      rate: parseFloat(rate) || 0,
      expectedPoints,
      actualPoints: null,
      unit,
      rewardName,
      status: 'pending', // 'pending' | 'verified' | 'discrepancy'
      notes: notes.trim(),
      disputeResolved: false,
      createdAt: new Date().toISOString()
    };

    this.expenses.unshift(newEntry);
    this.saveExpenses();
    return newEntry;
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
    return expense;
  }

  /**
   * 刪除一筆消費紀錄
   */
  deleteExpense(expenseId) {
    this.expenses = this.expenses.filter((e) => e.id !== expenseId);
    this.saveExpenses();
  }

  /**
   * 取得月度統計資訊
   */
  getMonthlyStats(yearMonth) {
    const targetYM = yearMonth || new Date().toISOString().slice(0, 7); // e.g. '2026-09'

    const monthExpenses = this.expenses.filter((e) => e.date.startsWith(targetYM));

    const totalAmount = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpectedPoints = monthExpenses.reduce((sum, e) => sum + e.expectedPoints, 0);
    const pendingCount = monthExpenses.filter((e) => e.status === 'pending').length;
    const verifiedCount = monthExpenses.filter((e) => e.status === 'verified').length;
    const discrepancyCount = monthExpenses.filter((e) => e.status === 'discrepancy').length;

    return {
      yearMonth: targetYM,
      totalCount: monthExpenses.length,
      totalAmount,
      totalExpectedPoints,
      pendingCount,
      verifiedCount,
      discrepancyCount,
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
