# Notion 整合與自動資料庫設定教學 (Notion Setup Guide)

本系統支援**將 2026 年信用卡方案與店家回饋資料一鍵注入到您的 Notion 筆記**中，並可隨時在 Notion 增修店家、自動同步至前端網頁。

---

## 步驟 1：建立 Notion Integration (取得 API 金鑰)

1. 前往 [Notion Developers 整合管理頁面](https://www.notion.so/my-integrations)。
2. 點擊 **「+ New integration」**。
3. 填寫名稱（例如：`信用卡回饋資料同步器`），Associated workspace 選擇您的工作區。
4. 在 Capabilities 確保勾選：
   - ✅ Read content
   - ✅ Update content
   - ✅ Insert content
5. 點擊 **Save**，複製畫面上的 **Internal Integration Secret**（以 `ntn_...` 開頭）。

---

## 步驟 2：在 Notion 建立母頁面並授權 Integration

1. 在您的 Notion 中建立一個全新頁面（例如命名為：`💳 信用卡回饋管理庫`）。
2. 點擊該頁面右上角的 **`...` (三點選單)**。
3. 下拉找到 **Connections** (或 **Add connections**)。
4. 搜尋並選擇您剛才建立的 Integration（如 `信用卡回饋資料同步器`），點擊確認授權。
5. **複製該頁面的 PAGE_ID**：
   - 點擊右上角 **Share** ➔ **Copy link**。
   - 連結格式如：`https://www.notion.so/myworkspace/My-Cards-1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d?pvs=4`
   - 其中 `1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d`（32 碼英數字母）即為 `NOTION_PARENT_PAGE_ID`。

---

## 步驟 3：設定專案 `.env` 檔案

在專案根目錄建立或編輯 `.env` 檔案（可參考 `.env.example`）：

```env
NOTION_API_KEY=ntn_your_secret_key_here
NOTION_PARENT_PAGE_ID=your_parent_page_32_chars_id
```

---

## 步驟 4：一鍵自動注入資料至 Notion (`seed:notion`)

在終端機執行以下指令：

```bash
npm run seed:notion
```

執行後，腳本會自動：
1. 在您的 Notion 母頁面下建立名為 **「【2026 信用卡方案與通路回饋庫】」** 的 Database。
2. 自動建立所有欄位（店家名稱、別名、分類、國泰方案、台新方案、玉山回饋、兆豐回饋、避坑警語、最佳支付管道建議等）。
3. 批次將 2026 年整理好的所有卡片與店家資料寫入 Notion！
4. 自動將產生的 `NOTION_DATABASE_ID` 寫入您的 `.env`。

---

## 步驟 5：日常 Notion 編輯與雙向同步 (`sync:notion`)

日後您在 Notion 新增店家、修改方案趴數或切換狀態時：

```bash
npm run sync:notion
```

* 腳本會自動將當前舊版本備份至 `src/data/backups/data-YYYY-MM-DD_HHmmss.json`（保留歷史不遺失）。
* 自動將 Notion 最新資料轉換更新至 `src/data/merchants.json`。
* 前端網頁立即套用最新資料！
