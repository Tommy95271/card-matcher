import { store } from './store.js';
import { tracker } from './tracker.js';

export class UI {
  constructor(engine) {
    this.engine = engine;
    this.currentCategory = 'all';
    this.currentQuery = '';
    this.currentTrackerFilter = 'all';
    this.selectedYearMonth = new Date().toISOString().slice(0, 7);

    // DOM 元素
    this.searchInput = document.getElementById('search-input');
    this.searchClearBtn = document.getElementById('search-clear-btn');
    this.categoryPillsContainer = document.getElementById('category-pills');
    this.resultsContainer = document.getElementById('results-container');
    this.resultsCountEl = document.getElementById('results-count');
    this.themeToggleBtn = document.getElementById('theme-toggle-btn');
    this.settingsBtn = document.getElementById('settings-btn');
    this.settingsModal = document.getElementById('settings-modal');
    this.modalCloseBtn = document.getElementById('modal-close-btn');
    this.cardsConfigList = document.getElementById('cards-config-list');

    // Tracker DOM 元素
    this.trackerBtn = document.getElementById('tracker-btn');
    this.trackerBadgeCount = document.getElementById('tracker-badge-count');
    this.quickLogBtn = document.getElementById('quick-log-btn');
    this.logExpenseModal = document.getElementById('log-expense-modal');
    this.logModalCloseBtn = document.getElementById('log-modal-close-btn');
    this.logCancelBtn = document.getElementById('log-cancel-btn');
    this.logExpenseForm = document.getElementById('log-expense-form');
    this.logDateInput = document.getElementById('log-date');
    this.logMerchantInput = document.getElementById('log-merchant');
    this.logAmountInput = document.getElementById('log-amount');
    this.logCardSelect = document.getElementById('log-card-select');
    this.logCalcDisplay = document.getElementById('log-calc-display');
    this.logNotesInput = document.getElementById('log-notes');

    // Tracker Ledger DOM 元素
    this.trackerModal = document.getElementById('tracker-modal');
    this.trackerCloseBtn = document.getElementById('tracker-close-btn');
    this.trackerMonthPicker = document.getElementById('tracker-month-picker');
    this.trackerAddEntryBtn = document.getElementById('tracker-add-entry-btn');
    this.trackerPullBtn = document.getElementById('tracker-pull-btn');
    this.statTotalAmount = document.getElementById('stat-total-amount');
    this.statTotalPoints = document.getElementById('stat-total-points');
    this.statPendingCount = document.getElementById('stat-pending-count');
    this.statDiscrepancyCount = document.getElementById('stat-discrepancy-count');
    this.trackerLedgerList = document.getElementById('tracker-ledger-list');

    // Cloud Sync DOM 元素
    this.gasWebhookInput = document.getElementById('gas-webhook-url');
    this.gasTestBtn = document.getElementById('gas-test-btn');
    this.gasStatusMsg = document.getElementById('gas-status-msg');

    // Dispute DOM 元素
    this.disputeModal = document.getElementById('dispute-modal');
    this.disputeCloseBtn = document.getElementById('dispute-close-btn');
    this.disputeCancelBtn = document.getElementById('dispute-cancel-btn');
    this.disputeCopyBtn = document.getElementById('dispute-copy-btn');
    this.disputeTextArea = document.getElementById('dispute-text-area');

    // 今日狀態選擇器
    this.cubeTodaySelect = document.getElementById('cube-today-scheme');
    this.taishinTodaySelect = document.getElementById('taishin-today-scheme');

    this.init();
  }

  init() {
    this.applyTheme(store.getProfile().theme);
    this.bindEvents();
    this.renderTodaySelectors();
    this.updateTrackerBadge();
    this.render();

    // 監聽背景雲端同步事件
    tracker.onSyncUpdate((event) => {
      if (this.trackerModal && this.trackerModal.classList.contains('open')) {
        this.renderTrackerLedger();
      }
      this.updateTrackerBadge();
    });
  }

  bindEvents() {
    // 搜尋事件
    this.searchInput.addEventListener('input', (e) => {
      this.currentQuery = e.target.value;
      this.searchClearBtn.style.display = this.currentQuery ? 'flex' : 'none';
      this.render();
    });

    this.searchClearBtn.addEventListener('click', () => {
      this.searchInput.value = '';
      this.currentQuery = '';
      this.searchClearBtn.style.display = 'none';
      this.searchInput.focus();
      this.render();
    });

    // 分類點擊
    this.categoryPillsContainer.addEventListener('click', (e) => {
      const pill = e.target.closest('.category-pill');
      if (!pill) return;

      document.querySelectorAll('.category-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');

      this.currentCategory = pill.dataset.category;
      this.render();
    });

    // 今日方案切換
    if (this.cubeTodaySelect) {
      this.cubeTodaySelect.addEventListener('change', (e) => {
        store.setTodayScheme('cathay_cube', e.target.value);
        this.showToast('已更新國泰 CUBE 今日方案');
        this.render();
      });
    }

    if (this.taishinTodaySelect) {
      this.taishinTodaySelect.addEventListener('change', (e) => {
        store.setTodayScheme('taishin_richart', e.target.value);
        this.showToast('已更新台新 Richart 今日方案');
        this.render();
      });
    }

    // 主題切換
    this.themeToggleBtn.addEventListener('click', () => {
      const profile = store.getProfile();
      const newTheme = profile.theme === 'dark' ? 'light' : 'dark';
      store.setTheme(newTheme);
      this.applyTheme(newTheme);
    });

    // 設定 Modal 開關
    this.settingsBtn.addEventListener('click', () => this.openSettingsModal());
    this.modalCloseBtn.addEventListener('click', () => this.closeSettingsModal());
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) this.closeSettingsModal();
    });

    // Tracker 模態視窗與記帳事件
    if (this.trackerBtn) {
      this.trackerBtn.addEventListener('click', () => this.openTrackerModal());
    }
    if (this.quickLogBtn) {
      this.quickLogBtn.addEventListener('click', () => this.openLogModal());
    }
    if (this.trackerAddEntryBtn) {
      this.trackerAddEntryBtn.addEventListener('click', () => {
        this.closeTrackerModal();
        this.openLogModal();
      });
    }
    if (this.logModalCloseBtn) {
      this.logModalCloseBtn.addEventListener('click', () => this.closeLogModal());
    }
    if (this.logCancelBtn) {
      this.logCancelBtn.addEventListener('click', () => this.closeLogModal());
    }
    if (this.logExpenseModal) {
      this.logExpenseModal.addEventListener('click', (e) => {
        if (e.target === this.logExpenseModal) this.closeLogModal();
      });
    }

    // 即時計算預期點數
    this.logAmountInput.addEventListener('input', () => this.updateLiveCalculation());
    this.logCardSelect.addEventListener('change', () => this.updateLiveCalculation());

    // 儲存記帳表單
    this.logExpenseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveExpense();
    });

    // Tracker 對帳面板事件
    if (this.trackerCloseBtn) {
      this.trackerCloseBtn.addEventListener('click', () => this.closeTrackerModal());
    }
    if (this.trackerModal) {
      this.trackerModal.addEventListener('click', (e) => {
        if (e.target === this.trackerModal) this.closeTrackerModal();
      });
    }

    if (this.trackerMonthPicker) {
      this.trackerMonthPicker.value = this.selectedYearMonth;
      this.trackerMonthPicker.addEventListener('change', (e) => {
        this.selectedYearMonth = e.target.value;
        this.renderTrackerLedger();
      });
    }

    // 對帳篩選 Tab
    document.querySelectorAll('.tracker-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.tracker-tab').forEach((t) => t.classList.remove('active'));
        e.target.classList.add('active');
        this.currentTrackerFilter = e.target.dataset.filter;
        this.renderTrackerLedger();
      });
    });

    // Cloud Sync & GAS 事件
    if (this.trackerPullBtn) {
      this.trackerPullBtn.addEventListener('click', async () => {
        const webhookUrl = store.getProfile().gasWebhookUrl;
        if (!webhookUrl) {
          this.showToast('ℹ️ 請先至「⚙️ 設定」填寫 Google Apps Script 網址');
          this.openSettingsModal();
          return;
        }

        this.showToast('🔄 正在從 Notion 雲端同步最新紀錄...');
        try {
          await tracker.pullFromCloud();
          this.renderTrackerLedger();
          this.updateTrackerBadge();
          this.showToast('🎉 已成功從 Notion 同步最新對帳資料！');
        } catch (err) {
          this.showToast(`❌ 同步失敗: ${err.message}`);
        }
      });
    }

    if (this.gasWebhookInput) {
      this.gasWebhookInput.addEventListener('change', (e) => {
        store.setGasWebhookUrl(e.target.value);
        this.showToast('💾 已儲存 GAS Webhook 網址設定');
      });
    }

    if (this.gasTestBtn) {
      this.gasTestBtn.addEventListener('click', async () => {
        const url = this.gasWebhookInput.value.trim();
        if (!url) {
          this.gasStatusMsg.className = 'cloud-sync-status-msg error';
          this.gasStatusMsg.textContent = '❌ 請先輸入 GAS 網頁應用程式網址！';
          return;
        }

        this.gasTestBtn.disabled = true;
        this.gasTestBtn.textContent = '⏳ 測試中...';
        this.gasStatusMsg.className = 'cloud-sync-status-msg';
        this.gasStatusMsg.style.display = 'none';

        try {
          store.setGasWebhookUrl(url);
          const res = await tracker.testConnection(url);
          this.gasStatusMsg.className = 'cloud-sync-status-msg success';
          this.gasStatusMsg.textContent = `✅ 連線成功！已連通【${res.databaseTitle || 'Notion 記帳庫'}】`;
          this.showToast('🎉 Google Apps Script 連線成功！');
        } catch (err) {
          this.gasStatusMsg.className = 'cloud-sync-status-msg error';
          this.gasStatusMsg.textContent = `❌ 連線失敗：${err.message}`;
          this.showToast('❌ 連線失敗，請檢查網址與權限');
        } finally {
          this.gasTestBtn.disabled = false;
          this.gasTestBtn.textContent = '🧪 測試連線';
        }
      });
    }

    // Dispute 申訴 Modal
    if (this.disputeCloseBtn) {
      this.disputeCloseBtn.addEventListener('click', () => this.closeDisputeModal());
    }
    if (this.disputeCancelBtn) {
      this.disputeCancelBtn.addEventListener('click', () => this.closeDisputeModal());
    }
    if (this.disputeModal) {
      this.disputeModal.addEventListener('click', (e) => {
        if (e.target === this.disputeModal) this.closeDisputeModal();
      });
    }
    if (this.disputeCopyBtn) {
      this.disputeCopyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(this.disputeTextArea.value).then(() => {
          this.showToast('📋 申訴話術已複製到剪貼簿！');
          this.closeDisputeModal();
        });
      });
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.themeToggleBtn.innerHTML = theme === 'dark' ? '🌙' : '☀️';
  }

  renderTodaySelectors() {
    const profile = store.getProfile();
    if (this.cubeTodaySelect && profile.cards.cathay_cube) {
      this.cubeTodaySelect.value = profile.cards.cathay_cube.todayScheme || 'digital';
    }
    if (this.taishinTodaySelect && profile.cards.taishin_richart) {
      this.taishinTodaySelect.value = profile.cards.taishin_richart.todayScheme || 'daily';
    }
  }

  updateTrackerBadge() {
    const stats = tracker.getMonthlyStats(this.selectedYearMonth);
    const unverifiedCount = stats.pendingCount + stats.discrepancyCount;
    if (this.trackerBadgeCount) {
      if (unverifiedCount > 0) {
        this.trackerBadgeCount.textContent = unverifiedCount;
        this.trackerBadgeCount.style.display = 'inline-block';
      } else {
        this.trackerBadgeCount.style.display = 'none';
      }
    }
  }

  render() {
    const profile = store.getProfile();
    const results = this.engine.search(this.currentQuery, this.currentCategory, profile);

    this.resultsCountEl.textContent = `共找到 ${results.length} 個適用通路`;

    if (results.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💡</div>
          <div class="empty-state-title">未找到名為「${this.currentQuery}」的專屬特約紀錄</div>
          <div class="empty-state-desc" style="max-width: 520px; margin: 0 auto 16px;">
            銀行許多方案採<strong>「大類別全通路認定 (MCC 特店類別)」</strong>（例如：全台實體餐廳只要有刷卡機一律適用【台新好饗刷 3.3%】或【國泰 CUBE 樂饗購 3.0%~3.3%】）。
          </div>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button class="category-pill" onclick="document.getElementById('search-input').value='餐飲'; document.getElementById('search-input').dispatchEvent(new Event('input'));">
              🍽️ 查看「全台實體餐飲」方案
            </button>
            <button class="category-pill" onclick="document.getElementById('search-input').value='海外'; document.getElementById('search-input').dispatchEvent(new Event('input'));">
              ✈️ 查看「海外消費」方案
            </button>
            <button class="category-pill" onclick="document.getElementById('search-input').value='網購'; document.getElementById('search-input').dispatchEvent(new Event('input'));">
              💻 查看「網購電商」方案
            </button>
          </div>
          <p style="margin-top: 14px; font-size: 0.8rem; color: var(--text-muted);">
            ✨ 您也可以隨時在您的 Notion 資料庫中新增「${this.currentQuery}」，執行同步後即會出現在此處！
          </p>
        </div>
      `;
      return;
    }

    this.resultsContainer.innerHTML = results.map((r) => this.renderMerchantCard(r, profile)).join('');

    // 綁定「⚡ 記一筆」按鈕事件
    this.resultsContainer.querySelectorAll('.quick-log-card-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const merchantName = btn.dataset.merchantName;
        const cardId = btn.dataset.cardId;
        const schemeName = btn.dataset.schemeName;
        const rate = btn.dataset.rate;
        this.openLogModal({
          merchantName,
          cardId,
          schemeName,
          rate
        });
      });
    });
  }

  renderMerchantCard(evalResult, profile) {
    const { merchant, bestCard, allCards } = evalResult;

    // 雷區警語 HTML
    const pitfallHtml = merchant.isPitfall && merchant.pitfallWarning ? `
      <div class="pitfall-banner">
        <span class="pitfall-icon">⚠️</span>
        <div>
          <strong>防呆避坑提示：</strong>
          ${merchant.pitfallWarning}
        </div>
      </div>
    ` : '';

    // 最優推薦卡片 HTML
    let bestHeroHtml = '';
    if (bestCard) {
      const isTodayMatch = bestCard.isTodayMatch;
      const todayDiffNote = (!isTodayMatch && (bestCard.cardId === 'cathay_cube' || bestCard.cardId === 'taishin_richart'))
        ? `<div class="simulation-note">⚡ 若維持今日鎖定方案實拿 <strong>${bestCard.actualTodayRate}%</strong>（切換至 <strong>${bestCard.schemeName}</strong> 享最高 <strong>${bestCard.rate}%</strong>）</div>`
        : '';

      bestHeroHtml = `
        <div class="best-card-banner">
          <div class="best-card-header-row">
            <div class="best-card-badge">👑 首選推薦卡片</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button 
                class="quick-log-card-btn" 
                data-merchant-name="${merchant.name}"
                data-card-id="${bestCard.cardId}"
                data-scheme-name="${bestCard.schemeName}"
                data-rate="${bestCard.rate}"
                title="以此方案快速記一筆">
                ⚡ 記一筆
              </button>
              ${bestCard.officialUrl ? `<a href="${bestCard.officialUrl}" target="_blank" rel="noopener noreferrer" class="official-link-btn" title="查看 ${bestCard.bank} ${bestCard.cardName} 官方權益公告">🔗 官方權益 ↗</a>` : ''}
            </div>
          </div>
          <div class="best-card-main">
            <div class="best-card-info">
              <span class="best-card-icon">${bestCard.icon}</span>
              <div>
                <div class="best-card-name">${bestCard.bank} ${bestCard.cardName}</div>
                <div class="best-scheme-name">🎯 適用方案：${bestCard.schemeName}</div>
              </div>
            </div>
            <div class="best-rate-badge">
              <span class="best-rate-num">${bestCard.rate}</span>
              <span class="best-rate-unit">%</span>
            </div>
          </div>
          ${todayDiffNote}
          ${merchant.paymentAdvice ? `<div class="best-payment-advice">${merchant.paymentAdvice}</div>` : ''}
        </div>
      `;
    }

    // 其他卡片方案明細 HTML
    const otherCards = allCards.filter((c) => !bestCard || c.cardId !== bestCard.cardId);
    const otherCardsHtml = otherCards.length > 0 ? `
      <details class="scheme-breakdown-details">
        <summary class="details-summary">
          <span>查看其他持卡方案對照 (${otherCards.length})</span>
          <span>▼</span>
        </summary>
        <div class="other-cards-list">
          ${otherCards.map((c) => `
            <div class="other-card-item">
              <div class="other-card-item-header">
                <span class="other-card-name">${c.icon || '💳'} ${c.bank} ${c.cardName}</span>
                <div class="other-card-header-right">
                  <button 
                    class="quick-log-card-btn" 
                    style="padding: 1px 6px; font-size: 0.7rem;"
                    data-merchant-name="${merchant.name}"
                    data-card-id="${c.cardId}"
                    data-scheme-name="${c.schemeName}"
                    data-rate="${c.rate}"
                    title="以此卡記一筆">
                    ⚡ 記
                  </button>
                  ${c.officialUrl ? `<a href="${c.officialUrl}" target="_blank" rel="noopener noreferrer" class="official-link-btn-small" title="查看官方權益公告">🔗 官方 ↗</a>` : ''}
                  <span class="other-card-rate">${c.rate}%</span>
                </div>
              </div>
              <div class="other-card-scheme">
                <span>適用：<strong>${c.schemeName}</strong></span>
                ${(!c.isTodayMatch && (c.cardId === 'cathay_cube' || c.cardId === 'taishin_richart')) ? `<span class="other-card-today-tag" style="color: var(--warning-color, #f59e0b); margin-left: 6px; font-size: 0.8rem;">(今日未切換: ${c.actualTodayRate}%)</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </details>
    ` : '';

    return `
      <div class="merchant-card">
        <div class="merchant-header">
          <div class="merchant-title-area">
            <h2 class="merchant-name">${merchant.name}</h2>
            <span class="category-tag">${merchant.categoryName}</span>
          </div>
        </div>
        ${pitfallHtml}
        ${bestHeroHtml}
        ${otherCardsHtml}
      </div>
    `;
  }

  // ==========================================
  // 記帳 Log Modal 相關方法
  // ==========================================
  openLogModal(prefill = {}) {
    const todayStr = new Date().toISOString().slice(0, 10);
    this.logDateInput.value = prefill.date || todayStr;
    this.logMerchantInput.value = prefill.merchantName || '';
    this.logAmountInput.value = prefill.amount || '';
    this.logNotesInput.value = prefill.notes || '';

    // 建立卡片與方案選單
    const cards = this.engine.cards;
    const profile = store.getProfile();
    let optionsHtml = '';

    cards.forEach((card) => {
      const userCard = profile.cards[card.id];
      if (userCard && !userCard.enabled) return;

      if (card.schemes && card.schemes.length) {
        card.schemes.forEach((s) => {
          const rate = s.rate || (s.fixedRate ? s.fixedRate : (userCard.tier === 'level3' ? 3.3 : (userCard.tier === 'level2' ? 3.0 : 0.3)));
          const isSelected = (prefill.cardId === card.id && prefill.schemeName && prefill.schemeName.includes(s.name));
          optionsHtml += `
            <option value="${card.id}|${s.name}|${rate}|${card.name}|${card.bank}" ${isSelected ? 'selected' : ''}>
              ${card.icon} ${card.bank} ${card.name} - ${s.name} (${rate}%)
            </option>
          `;
        });
      } else if (card.specialCategories) {
        card.specialCategories.forEach((sc) => {
          const isSelected = (prefill.cardId === card.id);
          optionsHtml += `
            <option value="${card.id}|${sc.name}|${sc.rate}|${card.name}|${card.bank}" ${isSelected ? 'selected' : ''}>
              ${card.icon} ${card.bank} ${card.name} - ${sc.name} (${sc.rate}%)
            </option>
          `;
        });
      }
    });

    this.logCardSelect.innerHTML = optionsHtml;
    this.updateLiveCalculation();
    this.logExpenseModal.classList.add('open');
    if (!prefill.merchantName) {
      this.logMerchantInput.focus();
    } else {
      this.logAmountInput.focus();
    }
  }

  closeLogModal() {
    this.logExpenseModal.classList.remove('open');
  }

  updateLiveCalculation() {
    const amount = parseFloat(this.logAmountInput.value) || 0;
    const selectedVal = this.logCardSelect.value;
    if (!selectedVal) return;

    const [cardId, schemeName, rateStr] = selectedVal.split('|');
    const rate = parseFloat(rateStr) || 0;

    const { expectedPoints, unit, rewardName } = tracker.calculateReward(amount, rate, cardId);

    this.logCalcDisplay.innerHTML = `
      <span class="calc-num">${expectedPoints}</span>
      <span class="calc-unit">${unit} ${rewardName}</span>
      <span class="calc-rate-tag">(${rate}%)</span>
    `;
  }

  handleSaveExpense() {
    const date = this.logDateInput.value;
    const merchantName = this.logMerchantInput.value;
    const amount = this.logAmountInput.value;
    const selectedVal = this.logCardSelect.value;
    const notes = this.logNotesInput.value;

    if (!selectedVal || !amount || !merchantName) return;

    const [cardId, schemeName, rate, cardName, bank] = selectedVal.split('|');

    tracker.addExpense({
      date,
      merchantName,
      amount,
      cardId,
      cardName,
      bank,
      schemeName,
      rate,
      notes
    });

    this.showToast(`✅ 已記錄【${merchantName}】，預期回饋已加入查核清單！`);
    this.closeLogModal();
    this.updateTrackerBadge();
    if (this.trackerModal.classList.contains('open')) {
      this.renderTrackerLedger();
    }
  }

  // ==========================================
  // 對帳查核面板 Tracker Ledger Modal
  // ==========================================
  openTrackerModal() {
    this.trackerMonthPicker.value = this.selectedYearMonth;
    this.renderTrackerLedger();
    this.trackerModal.classList.add('open');
  }

  closeTrackerModal() {
    this.trackerModal.classList.remove('open');
    this.updateTrackerBadge();
  }

  renderTrackerLedger() {
    const stats = tracker.getMonthlyStats(this.selectedYearMonth);

    this.statTotalAmount.textContent = `NT$ ${stats.totalAmount.toLocaleString()}`;
    this.statTotalPoints.textContent = `${stats.totalExpectedPoints.toLocaleString()} 點`;
    this.statPendingCount.textContent = `${stats.pendingCount} 筆`;
    this.statDiscrepancyCount.textContent = `${stats.discrepancyCount} 筆`;

    let filteredExpenses = stats.expenses;
    if (this.currentTrackerFilter !== 'all') {
      filteredExpenses = filteredExpenses.filter((e) => e.status === this.currentTrackerFilter);
    }

    if (filteredExpenses.length === 0) {
      this.trackerLedgerList.innerHTML = `
        <div class="empty-state" style="padding: 24px;">
          <div class="empty-state-icon">☕</div>
          <div class="empty-state-title">這個月份尚無 ${this.currentTrackerFilter === 'all' ? '' : '此狀態的'} 刷卡紀錄</div>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 6px;">
            在查詢結果中點擊「⚡ 記一筆」或上方「➕ 記一筆」即可快速追蹤小額點數回饋！
          </p>
        </div>
      `;
      return;
    }

    this.trackerLedgerList.innerHTML = filteredExpenses.map((exp) => {
      const statusClass = exp.status;
      let statusLabel = '🟡 待核對';
      if (exp.status === 'verified') statusLabel = '🟢 已入帳';
      else if (exp.status === 'discrepancy') statusLabel = `🔴 漏給 (實收: ${exp.actualPoints || 0}${exp.unit})`;

      let syncBadgeHtml = '';
      if (exp.syncStatus === 'synced' || exp.notionPageId) {
        syncBadgeHtml = `<span class="expense-sync-tag synced" title="已同步至 Notion">☁️ 已同步</span>`;
      } else if (exp.syncStatus === 'syncing') {
        syncBadgeHtml = `<span class="expense-sync-tag syncing" title="正在同步至 Notion...">⏳ 同步中</span>`;
      } else if (exp.syncStatus === 'error') {
        syncBadgeHtml = `<span class="expense-sync-tag error" title="同步至 Notion 失敗，點擊雲端同步重試">⚠️ 待同步</span>`;
      } else {
        syncBadgeHtml = `<span class="expense-sync-tag local" title="本機紀錄">📱 本機</span>`;
      }

      return `
        <div class="expense-item status-${statusClass}" data-expense-id="${exp.id}">
          <div class="expense-item-main">
            <div class="expense-merchant-info">
              <div style="display: flex; align-items: center;">
                <span class="expense-merchant-name">${exp.merchantName}</span>
                ${syncBadgeHtml}
              </div>
              <div class="expense-meta">
                📅 ${exp.date} • 💳 ${exp.bank} ${exp.cardName} (${exp.schemeName} ${exp.rate}%)
                ${exp.notes ? `• 📝 ${exp.notes}` : ''}
              </div>
            </div>
            <div class="expense-amount-area">
              <div class="expense-amount-num">NT$ ${exp.amount.toLocaleString()}</div>
              <div class="expense-points-expected">預期: +${exp.expectedPoints} ${exp.unit}${exp.rewardName}</div>
            </div>
          </div>
          <div class="expense-item-footer">
            <span class="expense-status-tag ${statusClass}">${statusLabel}</span>
            <div class="expense-actions">
              ${exp.status === 'pending' ? `
                <button class="expense-btn verify" data-action="verify" data-id="${exp.id}" title="確認點數已正確入帳">
                  ✅ 已入帳
                </button>
                <button class="expense-btn dispute" data-action="dispute-prompt" data-id="${exp.id}" title="點數漏給或未給">
                  ⚠️ 漏給/少給
                </button>
              ` : ''}
              ${exp.status === 'discrepancy' ? `
                <button class="expense-btn dispute" data-action="show-script" data-id="${exp.id}" title="產出客服申訴話術">
                  📋 申訴話術
                </button>
                <button class="expense-btn verify" data-action="verify" data-id="${exp.id}" title="客服已補發完畢">
                  ✅ 已補發
                </button>
              ` : ''}
              ${exp.status === 'verified' ? `
                <button class="expense-btn" data-action="reset" data-id="${exp.id}" title="重新設為待核對">
                  ↩ 重新核對
                </button>
              ` : ''}
              <button class="expense-btn" data-action="delete" data-id="${exp.id}" title="刪除紀錄" style="color: #ef4444;">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // 綁定條目內按鈕事件
    this.trackerLedgerList.querySelectorAll('.expense-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        const expense = tracker.expenses.find((item) => item.id === id);
        if (!expense) return;

        if (action === 'verify') {
          tracker.updateStatus(id, 'verified');
          this.showToast(`🎉 已核對！【${expense.merchantName}】點數確認入帳`);
          this.renderTrackerLedger();
          this.updateTrackerBadge();
        } else if (action === 'dispute-prompt') {
          const actual = prompt(`【${expense.merchantName}】預期應給 ${expense.expectedPoints} ${expense.unit}。\n請輸入銀行實際發放的點數（若完全未給請填 0）：`, '0');
          if (actual !== null) {
            tracker.updateStatus(id, 'discrepancy', actual);
            this.showToast(`🚨 已標記為漏給！已自動為您產出客服申訴文案`);
            this.renderTrackerLedger();
            this.updateTrackerBadge();
            this.openDisputeModal(expense);
          }
        } else if (action === 'show-script') {
          this.openDisputeModal(expense);
        } else if (action === 'reset') {
          tracker.updateStatus(id, 'pending');
          this.renderTrackerLedger();
          this.updateTrackerBadge();
        } else if (action === 'delete') {
          if (confirm(`確定要刪除【${expense.merchantName}】這筆刷卡紀錄嗎？`)) {
            tracker.deleteExpense(id);
            this.renderTrackerLedger();
            this.updateTrackerBadge();
          }
        }
      });
    });
  }

  // ==========================================
  // 客服申訴話術 Modal
  // ==========================================
  openDisputeModal(expense) {
    const script = tracker.generateDisputeScript(expense);
    this.disputeTextArea.value = script;
    this.disputeModal.classList.add('open');
  }

  closeDisputeModal() {
    this.disputeModal.classList.remove('open');
  }

  // ==========================================
  // 設定 Modal
  // ==========================================
  openSettingsModal() {
    const profile = store.getProfile();
    const cards = this.engine.cards;

    // 載入 GAS Webhook 網址
    if (this.gasWebhookInput) {
      this.gasWebhookInput.value = profile.gasWebhookUrl || '';
    }
    if (this.gasStatusMsg) {
      this.gasStatusMsg.className = 'cloud-sync-status-msg';
      this.gasStatusMsg.style.display = 'none';
      this.gasStatusMsg.textContent = '';
    }

    this.cardsConfigList.innerHTML = cards.map((card) => {
      const userCard = profile.cards[card.id] || { enabled: true, tier: card.defaultTier };
      
      const tiersOptions = card.tiers ? card.tiers.map((t) => `
        <option value="${t.id}" ${userCard.tier === t.id ? 'selected' : ''}>
          ${t.name} (${t.condition})
        </option>
      `).join('') : '';

      return `
        <div class="card-config-item" data-card-id="${card.id}">
          <div class="card-config-header">
            <label class="card-config-toggle">
              <input type="checkbox" class="card-enable-checkbox" ${userCard.enabled ? 'checked' : ''} />
              <span>${card.icon} ${card.bank} ${card.name}</span>
            </label>
            ${card.officialUrl ? `<a href="${card.officialUrl}" target="_blank" rel="noopener noreferrer" class="official-link-btn-small" title="查看官方公告">🔗 官方權益 ↗</a>` : ''}
          </div>
          ${tiersOptions ? `
            <div class="tier-select-wrapper">
              <label style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 4px;">所屬等級 / 扣繳設定：</label>
              <select class="tier-select">
                ${tiersOptions}
              </select>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // 綁定 Modal 內部事件
    this.cardsConfigList.querySelectorAll('.card-config-item').forEach((item) => {
      const cardId = item.dataset.cardId;
      const checkbox = item.querySelector('.card-enable-checkbox');
      const select = item.querySelector('.tier-select');

      checkbox.addEventListener('change', (e) => {
        store.setCardEnabled(cardId, e.target.checked);
        this.render();
      });

      if (select) {
        select.addEventListener('change', (e) => {
          store.setCardTier(cardId, e.target.value);
          this.render();
        });
      }
    });

    this.settingsModal.classList.add('open');
  }

  closeSettingsModal() {
    this.settingsModal.classList.remove('open');
    this.render();
  }

  showToast(msg) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✨</span><span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2500);
  }
}
