import { store, extractNotionDatabaseId } from './store.js';
import { tracker } from './tracker.js';
import { firebaseService } from './firebase.js';
import { syncLogger } from './logger.js';

export class UI {
  constructor(engine) {
    this.engine = engine;
    this.currentCategory = 'all';
    this.currentQuery = '';
    this.currentTrackerFilter = 'all';
    this.currentLogFilter = 'all';
    this.selectedYearMonth = new Date().toISOString().slice(0, 7);

    // DOM 元素
    this.brandLogoBtn = document.getElementById('brand-logo-btn');
    this.aboutModal = document.getElementById('about-modal');
    this.aboutModalCloseBtn = document.getElementById('about-modal-close-btn');
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

    // Google Auth & Firebase DOM 元素
    this.googleLoginBtn = document.getElementById('google-login-btn');
    this.userProfileChip = document.getElementById('user-profile-chip');
    this.userAvatar = document.getElementById('user-avatar');
    this.userName = document.getElementById('user-name');
    this.userLogoutBtn = document.getElementById('user-logout-btn');
    this.settingsAuthStatus = document.getElementById('settings-auth-status');

    // Logout Confirmation Modal DOM 元素
    this.logoutModal = document.getElementById('logout-modal');
    this.logoutCancelBtn = document.getElementById('logout-cancel-btn');
    this.logoutConfirmBtn = document.getElementById('logout-confirm-btn');

    // 導覽列與記帳對帳按鈕
    this.quickLogBtn = document.getElementById('quick-log-btn');
    this.trackerBtn = document.getElementById('tracker-btn');
    this.trackerBadgeCount = document.getElementById('tracker-badge-count');

    // 記帳 Modal DOM 元素
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
    this.trackerPrevMonthBtn = document.getElementById('tracker-prev-month');
    this.trackerNextMonthBtn = document.getElementById('tracker-next-month');
    this.trackerMonthLabel = document.getElementById('tracker-month-label');
    this.bankBreakdownBadge = document.getElementById('bank-breakdown-badge');
    this.bankBreakdownContent = document.getElementById('bank-breakdown-content');
    this.trackerAddEntryBtn = document.getElementById('tracker-add-entry-btn');
    this.trackerPullBtn = document.getElementById('tracker-pull-btn');
    this.statTotalAmount = document.getElementById('stat-total-amount');
    this.statTotalPoints = document.getElementById('stat-total-points');
    this.statPendingCount = document.getElementById('stat-pending-count');
    this.statDiscrepancyCount = document.getElementById('stat-discrepancy-count');
    this.trackerLedgerList = document.getElementById('tracker-ledger-list');
    this.trackerOpenLogsBtn = document.getElementById('tracker-open-logs-btn');
    this.syncHealthIndicator = document.getElementById('sync-health-indicator');

    // Sync Logs Modal DOM 元素
    this.syncLogsModal = document.getElementById('sync-logs-modal');
    this.syncLogsCloseBtn = document.getElementById('sync-logs-close-btn');
    this.syncDiagBanner = document.getElementById('sync-diag-banner');
    this.diagStatusIcon = document.getElementById('diag-status-icon');
    this.diagStatusTitle = document.getElementById('diag-status-title');
    this.diagStatusDesc = document.getElementById('diag-status-desc');
    this.syncLogsList = document.getElementById('sync-logs-list');
    this.copySyncLogsBtn = document.getElementById('copy-sync-logs-btn');
    this.clearSyncLogsBtn = document.getElementById('clear-sync-logs-btn');

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

    // 監聽 Firebase Google 登入狀態
    firebaseService.onAuthChange((user) => {
      this.handleAuthState(user);
    });

    // 監聽背景雲端同步事件
    tracker.onSyncUpdate((event) => {
      if (this.trackerModal && this.trackerModal.classList.contains('open')) {
        this.renderTrackerLedger();
      }
      this.updateTrackerBadge();
    });

    // 監聽同步日誌事件
    syncLogger.onLog(() => {
      this.updateSyncHealth();
      if (this.syncLogsModal && this.syncLogsModal.classList.contains('open')) {
        this.renderSyncLogs();
      }
    });
    this.updateSyncHealth();
  }

  bindEvents() {
    // Sync Logs Modal 事件
    if (this.trackerOpenLogsBtn) {
      this.trackerOpenLogsBtn.addEventListener('click', () => this.openSyncLogsModal());
    }
    if (this.syncLogsCloseBtn) {
      this.syncLogsCloseBtn.addEventListener('click', () => this.closeSyncLogsModal());
    }
    if (this.syncLogsModal) {
      this.syncLogsModal.addEventListener('click', (e) => {
        if (e.target === this.syncLogsModal) this.closeSyncLogsModal();
      });
      this.syncLogsModal.querySelectorAll('.log-filter-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.syncLogsModal.querySelectorAll('.log-filter-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.currentLogFilter = btn.dataset.filter || 'all';
          this.renderSyncLogs();
        });
      });
    }
    if (this.copySyncLogsBtn) {
      this.copySyncLogsBtn.addEventListener('click', () => {
        const logs = syncLogger.getLogs();
        const text = JSON.stringify(logs, null, 2);
        navigator.clipboard.writeText(text).then(() => {
          this.showToast('📋 同步日誌已複製到剪貼簿！');
        });
      });
    }
    if (this.clearSyncLogsBtn) {
      this.clearSyncLogsBtn.addEventListener('click', () => {
        if (confirm('確定要清空所有同步日誌嗎？')) {
          syncLogger.clearLogs();
          this.renderSyncLogs();
          this.updateSyncHealth();
          this.showToast('🧹 已清空同步日誌');
        }
      });
    }
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

    // 關於專案與 2026 方案 Modal 開關
    if (this.brandLogoBtn) {
      this.brandLogoBtn.addEventListener('click', () => this.openAboutModal());
    }
    if (this.aboutModalCloseBtn) {
      this.aboutModalCloseBtn.addEventListener('click', () => this.closeAboutModal());
    }
    if (this.aboutModal) {
      this.aboutModal.addEventListener('click', (e) => {
        if (e.target === this.aboutModal) this.closeAboutModal();
      });
    }

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
    if (this.logExpenseModal) {
      this.logExpenseModal.addEventListener('click', (e) => {
        if (e.target === this.logExpenseModal) this.closeLogModal();
      });
    }

    // PWA 更新橫幅按鈕事件
    const pwaUpdateToast = document.getElementById('pwa-update-toast');
    const pwaReloadBtn = document.getElementById('pwa-reload-btn');
    const pwaDismissBtn = document.getElementById('pwa-dismiss-btn');

    if (pwaDismissBtn && pwaUpdateToast) {
      pwaDismissBtn.addEventListener('click', () => {
        pwaUpdateToast.classList.remove('show');
        pwaUpdateToast.style.display = 'none';
      });
    }

    if (pwaReloadBtn) {
      pwaReloadBtn.addEventListener('click', () => {
        pwaReloadBtn.disabled = true;
        pwaReloadBtn.textContent = '🔄 更新中...';
        if (pwaUpdateToast) pwaUpdateToast.style.opacity = '0.7';

        if (typeof this.pendingPwaReloadCallback === 'function') {
          try {
            this.pendingPwaReloadCallback();
          } catch (err) {
            console.warn('pendingPwaReloadCallback error:', err);
          }
        }

        setTimeout(() => {
          window.location.reload();
        }, 200);
      });
    }

    // 常用記帳快速範本 (Preset Chips) 點擊事件
    const presetChipsList = document.getElementById('preset-chips-list');
    if (presetChipsList) {
      presetChipsList.addEventListener('click', (e) => {
        const chip = e.target.closest('.preset-chip');
        if (!chip) return;
        const merchant = chip.dataset.merchant || '';
        const amount = chip.dataset.amount || '';
        const notes = chip.dataset.notes || '';
        const cardId = chip.dataset.cardId || '';
        const schemeName = chip.dataset.schemeName || '';
        const rate = chip.dataset.rate || '';

        this.logMerchantInput.value = merchant;
        this.logAmountInput.value = amount;
        if (notes) this.logNotesInput.value = notes;

        // 智慧帶入或比對該通路最優卡片與方案
        if (cardId && schemeName) {
          this.rebuildCardSelect({
            cardId,
            schemeName,
            rate
          });
        } else {
          const profile = store.getProfile();
          const results = this.engine.search(merchant, 'all', profile);
          if (results && results.length > 0 && results[0].bestCard) {
            const best = results[0].bestCard;
            this.rebuildCardSelect({
              cardId: best.cardId,
              schemeName: best.schemeName,
              rate: best.rate
            });
          }
        }
        this.updateLiveCalculation();
        this.logAmountInput.focus();
        this.logAmountInput.select();
      });
    }

    // 當在記帳視窗手動輸入店家名稱時，智慧動態比對推薦方案
    if (this.logMerchantInput) {
      this.logMerchantInput.addEventListener('input', (e) => {
        const merchant = (e.target.value || '').trim();
        if (!merchant) return;
        const profile = store.getProfile();
        const results = this.engine.search(merchant, 'all', profile);
        if (results && results.length > 0 && results[0].bestCard) {
          const best = results[0].bestCard;
          this.rebuildCardSelect({
            cardId: best.cardId,
            schemeName: best.schemeName,
            rate: best.rate
          });
          this.updateLiveCalculation();
        }
      });
    }

    // 全域鍵盤快捷鍵 (Power-User Shortcuts)
    document.addEventListener('keydown', (e) => {
      const target = e.target;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');

      // 按 Escape 鍵關閉所有開啟中的彈窗
      if (e.key === 'Escape') {
        if (this.logoutModal && this.logoutModal.classList.contains('open')) {
          this.closeLogoutModal();
          return;
        }
        if (this.disputeModal && this.disputeModal.classList.contains('open')) {
          this.closeDisputeModal();
          return;
        }
        if (this.syncLogsModal && this.syncLogsModal.classList.contains('open')) {
          this.closeSyncLogsModal();
          return;
        }
        if (this.logExpenseModal && this.logExpenseModal.classList.contains('open')) {
          this.closeLogModal();
          return;
        }
        if (this.trackerModal && this.trackerModal.classList.contains('open')) {
          this.closeTrackerModal();
          return;
        }
        if (this.settingsModal && this.settingsModal.classList.contains('open')) {
          this.closeSettingsModal();
          return;
        }
        if (this.aboutModal && this.aboutModal.classList.contains('open')) {
          this.closeAboutModal();
          return;
        }
        return;
      }

      // 若使用者正在表單輸入框內打字，不觸發字母快捷鍵
      if (isInput) return;

      // 按 '/' 聚焦搜尋框
      if (e.key === '/') {
        e.preventDefault();
        if (this.searchInput) {
          this.searchInput.focus();
          this.searchInput.select();
        }
      }

      // 按 'n' 或 'N' 開啟「⚡ 記一筆」
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        this.openLogModal();
      }

      // 按 't' / 'T' 或 'l' / 'L' 開啟「📊 點數對帳查核中心」
      if (e.key === 't' || e.key === 'T' || e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        this.openTrackerModal();
      }
    });

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

    if (this.trackerPrevMonthBtn) {
      this.trackerPrevMonthBtn.addEventListener('click', () => this.changeMonth(-1));
    }
    if (this.trackerNextMonthBtn) {
      this.trackerNextMonthBtn.addEventListener('click', () => this.changeMonth(1));
    }

    if (this.trackerMonthPicker) {
      this.trackerMonthPicker.value = this.selectedYearMonth;
      this.trackerMonthPicker.addEventListener('change', (e) => {
        this.selectedYearMonth = e.target.value;
        this.updateMonthLabel();
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

    // Cloud Sync & Notion 事件
    if (this.trackerPullBtn) {
      this.trackerPullBtn.addEventListener('click', async () => {
        const profile = store.getProfile();
        if (!profile.gasWebhookUrl && (!profile.notionApiKey || !profile.notionDatabaseId)) {
          this.showToast('ℹ️ 請先至「⚙️ 設定」填寫 Notion 授權或中繼站網址');
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

    // Google Auth 事件
    if (this.googleLoginBtn) {
      this.googleLoginBtn.addEventListener('click', () => this.handleGoogleLogin());
    }
    if (this.userLogoutBtn) {
      this.userLogoutBtn.addEventListener('click', () => this.openLogoutModal());
    }

    // Logout Confirmation Modal 事件
    if (this.logoutCancelBtn) {
      this.logoutCancelBtn.addEventListener('click', () => this.closeLogoutModal());
    }
    if (this.logoutConfirmBtn) {
      this.logoutConfirmBtn.addEventListener('click', () => this.confirmLogout());
    }
    if (this.logoutModal) {
      this.logoutModal.addEventListener('click', (e) => {
        if (e.target === this.logoutModal) this.closeLogoutModal();
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
    // 0ms 零延遲切換：短暫關閉全局 transition 避免重算重度模糊
    document.documentElement.classList.add('theme-switching');
    document.documentElement.setAttribute('data-theme', theme);
    if (document.body) {
      document.body.setAttribute('data-theme', theme);
    }
    // 依據標準 UX：深色模式下顯示 ☀️ (提示點擊切換為日間模式)；淺色模式下顯示 🌙 (提示點擊切換為夜間模式)
    this.themeToggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    this.themeToggleBtn.setAttribute('title', theme === 'dark' ? '切換為日間淺色模式' : '切換為夜間深色模式');

    // 同步更新行動裝置瀏覽器頂部狀態列 theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f1217' : '#f6f8fa');
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('theme-switching');
      });
    });
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
          <span style="display: flex; align-items: center; gap: 6px;">
            <span>📊</span>
            <span>查看其他 <strong>${otherCards.length}</strong> 張卡方案對照</span>
          </span>
          <span style="font-size: 0.75rem; opacity: 0.9;">展開對照 ▼</span>
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
  rebuildCardSelect(prefill = {}) {
    const cards = this.engine.cards;
    const profile = store.getProfile();
    let optionsHtml = '';

    cards.forEach((card) => {
      const userCard = profile.cards[card.id];
      if (userCard && !userCard.enabled) return;

      if (card.schemes && card.schemes.length) {
        card.schemes.forEach((s) => {
          const rate = s.rate || (s.fixedRate ? s.fixedRate : (userCard.tier === 'level3' ? 3.3 : (userCard.tier === 'level2' ? 3.0 : 0.3)));
          const isSelected = (prefill.cardId === card.id && prefill.schemeName && (prefill.schemeName.includes(s.name) || s.name.includes(prefill.schemeName)));
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
  }

  openLogModal(prefill = {}) {
    const todayStr = new Date().toISOString().slice(0, 10);
    this.logDateInput.value = prefill.date || todayStr;
    this.logMerchantInput.value = prefill.merchantName || '';
    this.logAmountInput.value = prefill.amount || '';
    this.logNotesInput.value = prefill.notes || '';

    // 動態計算並渲染使用者最常用的 5 筆預設 Chips
    this.renderDynamicPresetChips();

    // 建立卡片與方案選單
    this.rebuildCardSelect(prefill);
    this.updateLiveCalculation();
    this.logExpenseModal.classList.add('open');
    if (!prefill.merchantName) {
      this.logMerchantInput.focus();
    } else {
      this.logAmountInput.focus();
    }
  }

  renderDynamicPresetChips() {
    const presetListEl = document.getElementById('preset-chips-list');
    if (!presetListEl) return;

    // 1. 取得所有歷史消費紀錄
    const allExpenses = tracker.expenses || [];
    
    // 2. 統計各店家消費次數與最常出現的金額/卡片
    const merchantMap = {};
    allExpenses.forEach((exp) => {
      const name = (exp.merchantName || '').trim();
      if (!name) return;
      if (!merchantMap[name]) {
        merchantMap[name] = {
          merchantName: name,
          count: 0,
          amounts: {},
          cards: {},
          lastNotes: exp.notes || ''
        };
      }
      merchantMap[name].count += 1;
      
      const amt = String(exp.amount || '');
      if (amt) {
        merchantMap[name].amounts[amt] = (merchantMap[name].amounts[amt] || 0) + 1;
      }
      
      if (exp.cardId) {
        const key = `${exp.cardId}|${exp.schemeName || ''}|${exp.rate || ''}`;
        merchantMap[name].cards[key] = (merchantMap[name].cards[key] || 0) + 1;
      }
    });

    // 3. 依使用頻率排序
    const sortedMerchants = Object.values(merchantMap).sort((a, b) => b.count - a.count);

    // 4. 取出前 5 筆動態常用組合
    const topPresets = sortedMerchants.slice(0, 5).map((item) => {
      let topAmt = '';
      let maxAmtCount = 0;
      for (const [amt, cnt] of Object.entries(item.amounts)) {
        if (cnt > maxAmtCount) {
          maxAmtCount = cnt;
          topAmt = amt;
        }
      }

      let topCardKey = '';
      let maxCardCount = 0;
      for (const [cardKey, cnt] of Object.entries(item.cards)) {
        if (cnt > maxCardCount) {
          maxCardCount = cnt;
          topCardKey = cardKey;
        }
      }
      const [cardId, schemeName, rate] = topCardKey ? topCardKey.split('|') : ['', '', ''];

      let icon = '⚡';
      if (item.merchantName.includes('7-11') || item.merchantName.includes('7-ELEVEN') || item.merchantName.includes('全家') || item.merchantName.includes('超商')) icon = '🏪';
      else if (item.merchantName.includes('全聯') || item.merchantName.includes('家樂福') || item.merchantName.includes('超市')) icon = '🛒';
      else if (item.merchantName.includes('Uber') || item.merchantName.includes('foodpanda') || item.merchantName.includes('外送')) icon = '🍱';
      else if (item.merchantName.includes('星巴克') || item.merchantName.includes('咖啡') || item.merchantName.includes('茶')) icon = '☕';
      else if (item.merchantName.includes('油') || item.merchantName.includes('中油')) icon = '⛽';
      else if (item.merchantName.includes('蝦皮') || item.merchantName.includes('momo') || item.merchantName.includes('PChome')) icon = '📦';
      else if (item.merchantName.includes('博客來') || item.merchantName.includes('書')) icon = '📚';
      else if (item.merchantName.includes('日本') || item.merchantName.includes('日幣') || item.merchantName.includes('機票')) icon = '🛫';

      return {
        merchantName: item.merchantName,
        amount: topAmt || '',
        notes: item.lastNotes,
        cardId,
        schemeName,
        rate,
        label: `${icon} ${item.merchantName}${topAmt ? ' $' + topAmt : ''}`
      };
    });

    // 5. 若不足 5 筆，使用精選預設補足 5 筆
    const defaultFallbacks = [
      { merchantName: 'Uber Eats', amount: '250', notes: '午餐外送', label: '🍱 Uber Eats $250' },
      { merchantName: '全聯福利中心', amount: '500', notes: '日常採買', label: '🛒 全聯 $500' },
      { merchantName: '7-ELEVEN', amount: '120', notes: '超商消費', label: '🏪 7-11 $120' },
      { merchantName: '星巴克', amount: '165', notes: '咖啡下午茶', label: '☕ 星巴克 $165' },
      { merchantName: '台灣中油', amount: '1000', notes: '汽車加油', label: '⛽ 中油 $1000' }
    ];

    const finalPresets = [...topPresets];
    for (const fb of defaultFallbacks) {
      if (finalPresets.length >= 5) break;
      if (!finalPresets.some((p) => p.merchantName === fb.merchantName)) {
        finalPresets.push(fb);
      }
    }

    // 6. 渲染 DOM
    presetListEl.innerHTML = finalPresets.map((p) => `
      <button 
        type="button" 
        class="preset-chip" 
        data-merchant="${p.merchantName}" 
        data-amount="${p.amount || ''}" 
        data-notes="${p.notes || ''}"
        data-card-id="${p.cardId || ''}"
        data-scheme-name="${p.schemeName || ''}"
        data-rate="${p.rate || ''}"
        title="快速帶入【${p.merchantName}】${p.amount ? 'NT$' + p.amount : ''}">
        ${p.label}
      </button>
    `).join('');
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
  changeMonth(delta) {
    const [yearStr, monthStr] = this.selectedYearMonth.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) + delta;

    if (month < 1) {
      month = 12;
      year -= 1;
    } else if (month > 12) {
      month = 1;
      year += 1;
    }

    const newYM = `${year}-${String(month).padStart(2, '0')}`;
    this.selectedYearMonth = newYM;
    if (this.trackerMonthPicker) {
      this.trackerMonthPicker.value = newYM;
    }
    this.updateMonthLabel();
    this.renderTrackerLedger();
  }

  updateMonthLabel() {
    if (this.trackerMonthLabel) {
      const [y, m] = this.selectedYearMonth.split('-');
      this.trackerMonthLabel.textContent = `${y}年${parseInt(m, 10)}月`;
    }
  }

  openTrackerModal() {
    if (this.trackerMonthPicker) {
      this.trackerMonthPicker.value = this.selectedYearMonth;
    }
    this.updateMonthLabel();
    this.renderTrackerLedger();
    this.trackerModal.classList.add('open');
  }

  closeTrackerModal() {
    this.trackerModal.classList.remove('open');
    this.updateTrackerBadge();
  }

  renderTrackerLedger() {
    this.updateMonthLabel();
    const stats = tracker.getMonthlyStats(this.selectedYearMonth);

    this.statTotalAmount.textContent = `NT$ ${stats.totalAmount.toLocaleString()}`;
    this.statTotalPoints.textContent = `${stats.totalExpectedPoints.toLocaleString()} 點`;
    this.statPendingCount.textContent = `${stats.pendingCount} 筆`;
    this.statDiscrepancyCount.textContent = `${stats.discrepancyCount} 筆`;

    // 渲染各銀行刷卡與點數分佈 (實作 1 方案 B)
    if (this.bankBreakdownContent) {
      const breakdown = stats.bankBreakdown || [];
      if (this.bankBreakdownBadge) {
        this.bankBreakdownBadge.textContent = `${breakdown.length} 家銀行/卡別`;
      }

      if (breakdown.length === 0) {
        this.bankBreakdownContent.innerHTML = `
          <div style="text-align: center; padding: 12px; color: var(--text-muted); font-size: 0.8rem;">
            本月尚無消費紀錄
          </div>
        `;
      } else {
        this.bankBreakdownContent.innerHTML = breakdown.map((item) => {
          let progressClass = 'default';
          let icon = '💳';
          if (item.cardId === 'cathay_cube' || (item.bank && item.bank.includes('國泰'))) {
            progressClass = 'cathay';
            icon = '🌲';
          } else if (item.cardId === 'taishin_richart' || (item.bank && item.bank.includes('台新'))) {
            progressClass = 'taishin';
            icon = '🟣';
          } else if (item.cardId === 'megabank_bt21' || (item.bank && item.bank.includes('兆豐'))) {
            progressClass = 'megabank';
            icon = '🐻';
          } else if (item.cardId === 'esun_ubear' || (item.bank && item.bank.includes('玉山'))) {
            progressClass = 'esun';
            icon = '💳';
          }

          return `
            <div class="bank-breakdown-item">
              <div class="bank-item-top">
                <div class="bank-item-name">
                  <span>${icon}</span>
                  <span>${item.bank} ${item.cardName}</span>
                </div>
                <div class="bank-item-amount">NT$ ${item.totalAmount.toLocaleString()}</div>
              </div>
              <div class="bank-progress-track">
                <div class="bank-progress-fill ${progressClass}" style="width: ${item.percentage}%;"></div>
              </div>
              <div class="bank-item-bottom">
                <span class="bank-points-badge">🎁 預期回饋：+${item.totalPoints.toLocaleString()} ${item.unit}${item.rewardName}</span>
                <span class="bank-percentage-badge">佔比 ${item.percentage}% (${item.count} 筆)</span>
              </div>
            </div>
          `;
        }).join('');
      }
    }

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
  // Google Auth & Firebase 即時同步方法
  // ==========================================
  handleAuthState(user) {
    if (user) {
      if (this.googleLoginBtn) this.googleLoginBtn.style.display = 'none';
      if (this.userProfileChip) {
        this.userProfileChip.style.display = 'inline-flex';
        if (this.userAvatar) {
          this.userAvatar.src = user.photoURL || 'https://www.gstatic.com/identity/boq/accountsettingsmobile/v1/avatar.svg';
        }
        if (this.userName) {
          this.userName.textContent = user.displayName || user.email.split('@')[0];
        }
      }
    } else {
      if (this.googleLoginBtn) this.googleLoginBtn.style.display = 'inline-flex';
      if (this.userProfileChip) this.userProfileChip.style.display = 'none';
    }

    if (this.settingsModal && this.settingsModal.classList.contains('open')) {
      this.renderSettingsAuthStatus(user);
    }
  }

  async handleGoogleLogin() {
    if (!firebaseService.isConfigured()) {
      this.showToast('ℹ️ 請先於設定中輸入 Firebase 專案金鑰');
      this.openSettingsModal();
      return;
    }
    try {
      this.showToast('⏳ 正在開啟 Google 登入視窗...');
      const user = await firebaseService.signInWithGoogle();
      this.showToast(`🎉 歡迎 ${user.displayName || user.email}！已啟動跨裝置秒同步`);
    } catch (err) {
      console.error('Google 登入失敗:', err);
      this.showToast(`❌ 登入失敗: ${err.message}`);
    }
  }

  handleLogout() {
    this.openLogoutModal();
  }

  openLogoutModal() {
    if (this.logoutModal) {
      this.logoutModal.classList.add('open');
    }
  }

  closeLogoutModal() {
    if (this.logoutModal) {
      this.logoutModal.classList.remove('open');
    }
  }

  async confirmLogout() {
    this.closeLogoutModal();
    try {
      await firebaseService.logout();
      this.showToast('👋 已安全登出 Google 帳號');
    } catch (err) {
      console.error('登出失敗:', err);
      this.showToast(`❌ 登出失敗: ${err.message}`);
    }
  }

  renderSettingsAuthStatus(user) {
    if (!this.settingsAuthStatus) return;

    if (user) {
      this.settingsAuthStatus.innerHTML = `
        <div class="settings-auth-info">
          <div class="settings-user-details">
            <img class="settings-user-avatar" src="${user.photoURL || 'https://www.gstatic.com/identity/boq/accountsettingsmobile/v1/avatar.svg'}" alt="Avatar" />
            <div>
              <div class="settings-user-name">${user.displayName || 'Google 使用者'}</div>
              <div class="settings-user-email">${user.email} • 🟢 雲端即時連線中</div>
            </div>
          </div>
          <button type="button" id="settings-logout-btn" class="btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;">🚪 登出</button>
        </div>
      `;
      const btn = document.getElementById('settings-logout-btn');
      if (btn) {
        btn.addEventListener('click', () => this.handleLogout());
      }
    } else {
      this.settingsAuthStatus.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">目前狀態：👤 本機訪客模式 (未登入)</span>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">登入後即可將消費與核對進度秒同步至所有手機與電腦</div>
          </div>
          <button type="button" id="settings-login-btn" class="btn-primary" style="padding: 6px 14px; font-size: 0.8rem;">
            🔑 Google 快速登入
          </button>
        </div>
      `;
      const btn = document.getElementById('settings-login-btn');
      if (btn) {
        btn.addEventListener('click', () => this.handleGoogleLogin());
      }
    }
  }

  // ==========================================
  // 設定 Modal
  // ==========================================
  openSettingsModal() {
    const profile = store.getProfile();
    const cards = this.engine.cards;

    // 載入 Firebase 登入狀態
    this.renderSettingsAuthStatus(firebaseService.currentUser);

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

  // ==========================================
  // 📋 同步日誌與即時診斷 Modal
  // ==========================================
  openSyncLogsModal() {
    if (!this.syncLogsModal) return;
    this.renderSyncLogs();
    this.syncLogsModal.classList.add('open');
  }

  closeSyncLogsModal() {
    if (!this.syncLogsModal) return;
    this.syncLogsModal.classList.remove('open');
  }

  updateSyncHealth() {
    const summary = syncLogger.getHealthSummary();
    if (this.syncHealthIndicator) {
      if (summary.hasError) {
        this.syncHealthIndicator.innerHTML = `🔴 異常 (${summary.errors} 筆失敗)`;
        this.syncHealthIndicator.style.color = '#ef4444';
      } else {
        this.syncHealthIndicator.innerHTML = '🟢 正常';
        this.syncHealthIndicator.style.color = '#10b981';
      }
    }
  }

  renderSyncLogs() {
    if (!this.syncLogsList) return;

    const summary = syncLogger.getHealthSummary();
    const logs = syncLogger.getLogs();

    // 更新診斷 Banner
    if (this.syncDiagBanner) {
      if (summary.hasError) {
        this.syncDiagBanner.className = 'sync-diag-banner has-error';
        this.diagStatusIcon.textContent = '🚨';
        this.diagStatusTitle.textContent = `偵測到 ${summary.errors} 個同步異常`;
        
        const lastErr = summary.lastError ? summary.lastError.message : '';
        if (lastErr.includes('PERMISSION_DENIED') || lastErr.includes('權限不足')) {
          this.diagStatusDesc.innerHTML = '<b>Google 存取權限異常</b>：請至 Google Apps Script 點擊「部署 ➔ 管理部署作業 ➔ 編輯 ➔ 誰可以存取設為 Anyone 所有人」。';
        } else if (lastErr.includes('401') || lastErr.includes('API Key')) {
          this.diagStatusDesc.innerHTML = '<b>Notion 授權金鑰無效</b>：請至「⚙️ 設定」檢查 Notion Internal Integration Secret 是否以 <code>ntn_</code> 開頭。';
        } else {
          this.diagStatusDesc.textContent = `最新錯誤：${lastErr.substring(0, 100)}`;
        }
      } else {
        this.syncDiagBanner.className = 'sync-diag-banner all-good';
        this.diagStatusIcon.textContent = '🟢';
        this.diagStatusTitle.textContent = '雙軌同步連線正常';
        this.diagStatusDesc.textContent = `最近 ${summary.total} 次連線請求皆順利完成，無異常報錯。`;
      }
    }

    // 篩選日誌
    let filteredLogs = logs;
    if (this.currentLogFilter === 'notion') {
      filteredLogs = logs.filter((l) => l.type === 'notion');
    } else if (this.currentLogFilter === 'firestore') {
      filteredLogs = logs.filter((l) => l.type === 'firestore');
    } else if (this.currentLogFilter === 'error') {
      filteredLogs = logs.filter((l) => l.status === 'error');
    }

    if (filteredLogs.length === 0) {
      this.syncLogsList.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); font-size: 0.85rem;">
          <div style="font-size: 2rem; margin-bottom: 8px;">📭</div>
          暫無符合條件的同步日誌
        </div>
      `;
      return;
    }

    this.syncLogsList.innerHTML = filteredLogs.map((log) => {
      const typeLabel = log.type === 'notion' ? '📝 Notion' : (log.type === 'firestore' ? '🔥 Firestore' : '⚙️ 系統');
      const typeClass = `type-${log.type}`;
      const statusPillClass = log.status === 'error' ? 'status-pill-error' : 'status-pill-success';
      const statusLabel = log.status === 'error' ? '🔴 失敗' : (log.status === 'warning' ? '🟡 警告' : '🟢 成功');

      let detailsHtml = '';
      if (log.details) {
        const detailsStr = typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2);
        detailsHtml = `
          <details class="log-details-collapsible">
            <summary>🔍 查看除錯詳情 (Details)</summary>
            <pre class="log-details-content">${detailsStr.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </details>
        `;
      }

      return `
        <div class="sync-log-item status-${log.status}">
          <div class="log-item-header">
            <div class="log-tag-group">
              <span class="log-badge ${typeClass}">${typeLabel}</span>
              <span class="log-badge ${statusPillClass}">${statusLabel}</span>
            </div>
            <span class="log-time">${log.timeFormatted || log.timestamp.substring(11, 19)}</span>
          </div>
          <div class="log-message">${log.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          ${detailsHtml}
        </div>
      `;
    }).join('');
  }

  // ==========================================
  // ℹ️ 關於專案與 2026 方案速查 Modal
  // ==========================================
  openAboutModal() {
    if (!this.aboutModal) return;
    this.aboutModal.classList.add('open');
  }

  closeAboutModal() {
    if (!this.aboutModal) return;
    this.aboutModal.classList.remove('open');
  }

  // ==========================================
  // 🚀 PWA 即時無感版本更新通知
  // ==========================================
  showPwaUpdatePrompt(onReload) {
    const toast = document.getElementById('pwa-update-toast');
    if (!toast) return;

    this.pendingPwaReloadCallback = onReload;
    toast.classList.add('show');
    toast.style.setProperty('display', 'flex', 'important');
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
