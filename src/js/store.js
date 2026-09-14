export function extractNotionDatabaseId(input) {
  if (!input) return '';
  const trimmed = input.trim();
  // 1. 匹配 32 位元 hex (如 3dbdc85d79dc817e823dd77bcdb424e2)
  const hex32Match = trimmed.match(/([a-f0-9]{32})/i);
  if (hex32Match) return hex32Match[1].toLowerCase();

  // 2. 匹配 UUID 格式 (如 3dbdc85d-79dc-817e-823d-d77bcdb424e2)
  const uuidMatch = trimmed.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  if (uuidMatch) return uuidMatch[1].replace(/-/g, '').toLowerCase();

  return trimmed;
}

const DEFAULT_PROFILE = {
  theme: 'dark',
  notionApiKey: '',
  notionDatabaseUrl: '',
  notionDatabaseId: '',
  gasWebhookUrl: '',
  cards: {
    cathay_cube: {
      enabled: true,
      tier: 'level2', // Level 2 (3%)
      todayScheme: 'digital' // 玩數位
    },
    taishin_richart: {
      enabled: true,
      tier: 'level2', // Level 2 (3.3% ~ 10%)
      todayScheme: 'daily' // 天天刷
    },
    esun_ubear: {
      enabled: true,
      tier: 'level2' // Level 2 (3.0%)
    },
    mega_bt21: {
      enabled: true,
      tier: 'level2' // Level 2 (3.0%)
    }
  }
};

class Store {
  constructor() {
    this.profile = this.loadProfile();
  }

  loadProfile() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('無法從 LocalStorage 讀取個人設定，使用預設值:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
  }

  saveProfile() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    } catch (e) {
      console.error('無法儲存設定至 LocalStorage:', e);
    }
  }

  getProfile() {
    return this.profile;
  }

  setNotionConfig(apiKey, urlOrId) {
    this.profile.notionApiKey = (apiKey || '').trim();
    this.profile.notionDatabaseUrl = (urlOrId || '').trim();
    this.profile.notionDatabaseId = extractNotionDatabaseId(urlOrId);
    this.saveProfile();
  }

  setGasWebhookUrl(url) {
    this.profile.gasWebhookUrl = (url || '').trim();
    this.saveProfile();
  }

  setCardEnabled(cardId, enabled) {
    if (this.profile.cards[cardId]) {
      this.profile.cards[cardId].enabled = enabled;
      this.saveProfile();
    }
  }

  setCardTier(cardId, tier) {
    if (this.profile.cards[cardId]) {
      this.profile.cards[cardId].tier = tier;
      this.saveProfile();
    }
  }

  setTodayScheme(cardId, schemeId) {
    if (this.profile.cards[cardId]) {
      this.profile.cards[cardId].todayScheme = schemeId;
      this.saveProfile();
    }
  }

  setTheme(theme) {
    this.profile.theme = theme;
    this.saveProfile();
  }
}

export const store = new Store();
