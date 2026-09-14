import { store } from './store.js';

export class UI {
  constructor(engine) {
    this.engine = engine;
    this.currentCategory = 'all';
    this.currentQuery = '';

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

    // 今日狀態選擇器
    this.cubeTodaySelect = document.getElementById('cube-today-scheme');
    this.taishinTodaySelect = document.getElementById('taishin-today-scheme');

    this.init();
  }

  init() {
    this.applyTheme(store.getProfile().theme);
    this.bindEvents();
    this.renderTodaySelectors();
    this.render();
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
            ${bestCard.officialUrl ? `<a href="${bestCard.officialUrl}" target="_blank" rel="noopener noreferrer" class="official-link-btn" title="查看 ${bestCard.bank} ${bestCard.cardName} 官方權益公告">🔗 官方權益 ↗</a>` : ''}
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

  openSettingsModal() {
    const profile = store.getProfile();
    const cards = this.engine.cards;

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
