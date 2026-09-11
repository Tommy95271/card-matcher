export class Engine {
  constructor(cards, merchants) {
    this.cards = cards;
    this.merchants = merchants;
    this.cardsMap = new Map(cards.map((c) => [c.id, c]));
  }

  /**
   * 根據使用者的個人持卡、等級與今日鎖定方案，計算單一店家的所有卡片回饋與最優推薦
   */
  evaluateMerchant(merchant, profile) {
    const userCards = profile.cards;
    const evaluatedCards = [];

    for (const [cardId, cardConfig] of Object.entries(userCards)) {
      if (!cardConfig.enabled) continue;

      const cardDef = this.cardsMap.get(cardId);
      if (!cardDef) continue;

      const schemeInfo = merchant.schemes[cardId];
      if (!schemeInfo) continue;

      let effectiveRate = 0;
      let actualTodayRate = 0;
      let schemeName = schemeInfo.schemeName;
      let notes = schemeInfo.notes || '';
      let isTodayMatch = false;

      // 1. 國泰 CUBE 卡計算邏輯
      if (cardId === 'cathay_cube') {
        const tier = cardDef.tiers.find((t) => t.id === cardConfig.tier) || cardDef.tiers[1];
        const sName = schemeInfo.schemeName || '';
        const sId = schemeInfo.schemeId;
        
        let resolvedSchemeId = sId;
        if (sId === 'essentials' || sName.includes('集精選') || sId === 'pxpay' || sName.includes('全支付') || sId === 'formosa' || sName.includes('台塑家')) {
          effectiveRate = 2.0;
          resolvedSchemeId = (sId === 'custom' || !sId) ? (sName.includes('集精選') ? 'essentials' : (sName.includes('全支付') ? 'pxpay' : 'formosa')) : sId;
        } else if (sId === 'digital' || sName.includes('玩數位')) {
          effectiveRate = tier.schemeRate; // 3.0% / 3.3%
          resolvedSchemeId = 'digital';
        } else if (sId === 'dining' || sName.includes('樂饗購')) {
          effectiveRate = tier.schemeRate; // 3.0% / 3.3%
          resolvedSchemeId = 'dining';
        } else if (sId === 'travel' || sName.includes('趣旅行')) {
          effectiveRate = tier.schemeRate; // 3.0% / 3.3%
          resolvedSchemeId = 'travel';
        } else if (sId === 'birthday' || sName.includes('慶生月')) {
          effectiveRate = 10.0;
          resolvedSchemeId = 'birthday';
        } else {
          effectiveRate = tier.baseRate; // 0.3%
          resolvedSchemeId = 'general';
        }

        // 今日鎖定方案模擬
        isTodayMatch = (cardConfig.todayScheme === resolvedSchemeId);
        if (isTodayMatch) {
          actualTodayRate = effectiveRate;
        } else {
          actualTodayRate = (resolvedSchemeId === 'essentials') ? 2.0 : tier.baseRate;
        }
      }

      // 2. 台新 Richart 卡系列計算邏輯
      else if (cardId === 'taishin_richart') {
        const isLevel2 = (cardConfig.tier === 'level2');
        const sName = schemeInfo.schemeName || '';
        const sId = schemeInfo.schemeId;
        let resolvedSchemeId = sId;

        if (sId === 'chill' || sName.includes('Chill') || sName.includes('10%')) {
          effectiveRate = isLevel2 ? 10.0 : 0.3;
          resolvedSchemeId = 'chill';
        } else if (sId === 'pay' || sName.includes('Pay') || sName.includes('3.8%')) {
          effectiveRate = isLevel2 ? 3.8 : 0.3;
          resolvedSchemeId = 'pay';
        } else if (sId === 'holiday' || sName.includes('假日') || sName.includes('2%')) {
          effectiveRate = isLevel2 ? 2.0 : 0.3;
          resolvedSchemeId = 'holiday';
        } else if (sName.includes('一般消費') || sId === 'general') {
          effectiveRate = 0.3;
          resolvedSchemeId = 'general';
        } else {
          effectiveRate = isLevel2 ? 3.3 : 0.3; // 天天刷、大筆刷、好饗刷、數趣刷、玩旅刷
          if (sName.includes('天天')) resolvedSchemeId = 'daily';
          else if (sName.includes('大筆')) resolvedSchemeId = 'big_spending';
          else if (sName.includes('好饗')) resolvedSchemeId = 'gourmet';
          else if (sName.includes('數趣')) resolvedSchemeId = 'digital_fun';
          else if (sName.includes('玩旅')) resolvedSchemeId = 'travel_fun';
          else resolvedSchemeId = sId || 'daily';
        }

        // 今日鎖定方案模擬
        isTodayMatch = (cardConfig.todayScheme === resolvedSchemeId);
        if (isTodayMatch) {
          actualTodayRate = effectiveRate;
        } else {
          actualTodayRate = 0.3;
        }
      }

      // 3. 玉山 UBear
      else if (cardId === 'esun_ubear') {
        const isLevel2 = (cardConfig.tier === 'level2');
        if (schemeInfo.schemeId === 'entertainment_ai') {
          effectiveRate = 10.0;
        } else if (schemeInfo.schemeId === 'online_shopping') {
          effectiveRate = isLevel2 ? 3.0 : 2.5;
        } else {
          effectiveRate = isLevel2 ? 1.0 : 0.5;
        }
        actualTodayRate = effectiveRate;
        isTodayMatch = true;
      }

      // 4. 兆豐 BT21
      else if (cardId === 'mega_bt21') {
        const isLevel2 = (cardConfig.tier === 'level2');
        if (schemeInfo.schemeId === 'taiwan_pay') {
          effectiveRate = 4.5;
        } else if (schemeInfo.schemeId === 'mobile_pay') {
          effectiveRate = isLevel2 ? 3.0 : 2.3;
        } else if (schemeInfo.schemeId === 'overseas') {
          effectiveRate = 2.0;
        } else {
          effectiveRate = isLevel2 ? 1.0 : 0.3;
        }
        actualTodayRate = effectiveRate;
        isTodayMatch = true;
      }

      evaluatedCards.push({
        cardId,
        cardName: cardDef.name,
        bank: cardDef.bank,
        icon: cardDef.icon,
        color: cardDef.color,
        schemeId: schemeInfo.schemeId,
        schemeName,
        rate: effectiveRate,
        actualTodayRate,
        isTodayMatch,
        notes
      });
    }

    // 依最高回饋趴數排序
    evaluatedCards.sort((a, b) => b.rate - a.rate);

    const bestCard = evaluatedCards[0] || null;

    return {
      merchant,
      bestCard,
      allCards: evaluatedCards
    };
  }

  /**
   * 模糊搜尋與分類篩選
   */
  search(query, category, profile) {
    let list = this.merchants;

    // 1. 分類篩選
    if (category && category !== 'all') {
      list = list.filter((m) => m.categories.includes(category) || m.categoryName === category);
    }

    // 2. 關鍵字模糊比對與智慧語意推論
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();

      // 語意推論特徵庫 (Semantic Inference Keywords)
      const diningKeywords = ['壽司', '拉麵', '餐廳', '餐飲', '火鍋', '燒肉', '牛排', '義大利麵', '居酒屋', '咖啡', '甜點', '飲料', '手搖', '早午餐', '小吃', '便當', '排骨', '麵', '飯', '炸雞', '漢堡', '披薩', '吃到飽', '烤肉', '料理', '壽喜燒', '鐵板燒', '港式', '泰式', '日式', '韓式', '酒吧', '酒館'];
      const travelKeywords = ['飯店', '住宿', '民宿', '訂房', '旅館', '露營', '機票', '租車', '商旅', '溫泉'];
      const overseasKeywords = ['日幣', '韓幣', '美金', '日圓', '外幣', '免稅', '海外', '出國', '退稅'];

      const isDiningQuery = diningKeywords.some((k) => q.includes(k));
      const isTravelQuery = travelKeywords.some((k) => q.includes(k));
      const isOverseasQuery = overseasKeywords.some((k) => q.includes(k));

      list = list.filter((m) => {
        const nameMatch = m.name.toLowerCase().includes(q);
        const aliasMatch = m.aliases && m.aliases.some((a) => a.toLowerCase().includes(q));
        const catMatch = m.categoryName && m.categoryName.toLowerCase().includes(q);
        const adviceMatch = m.paymentAdvice && m.paymentAdvice.toLowerCase().includes(q);

        // 語意推論匹配 (Broad Semantic Fallback)
        const isGeneralDiningMatch = isDiningQuery && m.id === 'm_general_dining';
        const isGeneralTravelMatch = isTravelQuery && (m.id === 'm_agoda' || m.id === 'm_japan_overseas');
        const isGeneralOverseasMatch = isOverseasQuery && (m.id === 'm_japan_overseas' || m.id === 'm_korea_overseas');

        return nameMatch || aliasMatch || catMatch || adviceMatch || isGeneralDiningMatch || isGeneralTravelMatch || isGeneralOverseasMatch;
      });
    }

    // 3. 計算個人化回饋並排序
    const results = list.map((m) => this.evaluateMerchant(m, profile));

    // 依最佳回饋率從高到低排序，雷區適度排在合理位置
    results.sort((a, b) => {
      const rateA = a.bestCard ? a.bestCard.rate : 0;
      const rateB = b.bestCard ? b.bestCard.rate : 0;
      return rateB - rateA;
    });

    return results;
  }
}
