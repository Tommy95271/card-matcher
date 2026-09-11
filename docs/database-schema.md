# 資料庫欄位結構定義 (Notion & JSON Schema)

本文件定義 Notion Database 與本地 JSON 資料集的欄位規格。

---

## 1. Notion Database 欄位定義表

| 欄位名稱 (Property Name) | Notion 欄位型態 | 說明與範例 |
| :--- | :--- | :--- |
| **店家名稱** (Title) | `title` | 店家主名稱（例：`全家便利商店 (FamilyMart)`） |
| **搜尋別名** (Aliases) | `rich_text` | 以逗號分隔的關鍵字（例：`全家, FamilyMart, 全家超商`） |
| **消費分類** (Category) | `select` | `四大超商` / `量販超市` / `網購電商` / `美食餐飲` / `外送平台` / `百貨商場` / `交通旅遊` / `海外消費` / `影音娛樂` / `生活繳費` |
| **國泰 CUBE 方案** | `select` | `玩數位` / `樂饗購` / `趣旅行` / `集精選 (2%)` / `全支付 (2%)` / `一般消費 (0.3%)` |
| **台新 Richart 方案** | `select` | `Chill 刷 (10%)` / `Pay 著刷 (3.8%)` / `天天刷 (3.3%)` / `大筆刷 (3.3%)` / `好饗刷 (3.3%)` / `數趣刷 (3.3%)` / `玩旅刷 (3.3%)` / `假日刷 (2.0%)` |
| **玉山 UBear 回饋%** | `number` | 數值（例：`3.0` 或 `10.0` 或 `1.0` 或 `0.0`） |
| **兆豐 BT21 回饋%** | `number` | 數值（例：`3.0` 或 `2.0` 或 `1.0` 或 `0.0`） |
| **最佳支付管道建議** | `rich_text` | 最佳付款方式提示（例：`📱 優先使用 台新 Pay (3.8%) 或 LINE Pay 綁兆豐 BT21 (3.0%)`） |
| **避坑雷區警語** | `rich_text` | 排除一般消費或特殊條件（例：`⚠️ 超商門市直接刷實體卡多數銀行不回饋！`） |
| **是否為雷區通路** | `checkbox` | `true` (全聯、超商、水電、醫院等) / `false` |
| **資料狀態** | `status` / `select` | `有效 (Active)` / `已過期歷史存檔 (Archived)` / `草稿 (Draft)` |

---

## 2. 前端 JSON Schema (`src/data/merchants.json`)

```typescript
interface Merchant {
  id: string;                      // 唯一識別碼，如 "m_familymart"
  name: string;                    // 店家名稱
  aliases: string[];               // 搜尋別名與關鍵字清單
  categories: string[];            // 英文分類 ID
  categoryName: string;            // 中文分類名稱
  isPitfall: boolean;              // 是否為排除回饋雷區
  pitfallWarning?: string;         // 避坑警語提示
  paymentAdvice: string;           // 最佳支付方式建議
  schemes: {
    cathay_cube?: {
      schemeId: string;
      schemeName: string;
      rate: number;                // 基準方案趴數 (依用戶 Level 計算)
      notes?: string;
    };
    taishin_richart?: {
      schemeId: string;
      schemeName: string;
      rate: number;                // 基準方案趴數
      notes?: string;
    };
    esun_ubear?: {
      schemeId: string;
      schemeName: string;
      rate: number;
      notes?: string;
    };
    mega_bt21?: {
      schemeId: string;
      schemeName: string;
      rate: number;
      notes?: string;
    };
  };
}
```
