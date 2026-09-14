# ☁️ Google Apps Script (GAS) Notion API 中繼後端部署教學

透過 Google Apps Script (GAS) 部署一個完全免費、永久運行的 Serverless API，讓您在手機或電腦上「⚡ 記一筆」時，**1 秒內即時同步至 Notion【💳 2026 刷卡記帳與點數對帳庫】**！

---

## 🚀 3 步驟快速部署 (只需 1 分鐘)

### 步驟 1：建立 Google Apps Script 專案
1. 開啟瀏覽器進入 [Google Apps Script 官網 (script.google.com)](https://script.google.com/)。
2. 點擊左上角 **「＋ 新專案」**。
3. 將專案名稱修改為：`CardMatcher-Notion-Relay`（或您喜歡的名稱）。

### 步驟 2：貼上程式碼
1. 將編輯器內原本的 `function myFunction() {}` 全部刪除。
2. 開啟本專案中的 [`gas-backend/Code.gs`](./Code.gs)，將全部程式碼複製並貼上到 GAS 編輯器中。
3. 設定 Notion API 金鑰（二選一）：
   - **方式 A（推薦最安全）**：點擊左側齒輪 ⚙️「專案設定」➜ 滑至下方「指令碼屬性」➜ 點擊「新增指令碼屬性」，名稱填 `NOTION_API_KEY`，值填您的 Notion API Key（`ntn_...`），再新增 `NOTION_EXPENSES_DB_ID` 填 `3dbdc85d79dc817e823dd77bcdb424e2`。
   - **方式 B（最快速）**：直接在 `Code.gs` 第 14 行將 `YOUR_NOTION_API_KEY` 替換為您的 Notion API Key。
4. 點擊上方的 **「💾 儲存」** 圖示（或按 `Ctrl + S`）。

### 步驟 3：部署為網頁應用程式 (Web App)
1. 點擊右上角的 **「部署」 ➜ 「新增部署作業」**。
2. 點擊左側齒輪圖示 ⚙️，選擇 **「網頁應用程式 (Web App)」**。
3. 設定以下欄位：
   - **說明**：`v1.0 即時同步`
   - **以何人身分執行 (Execute as)**：選擇 **「我 (您的 Google 帳號)」**
   - **誰可以存取 (Who has access)**：選擇 **「所有人 (Anyone)」** 👈 *（重要！必須選所有人，前端才能免登入呼叫）*
4. 點擊 **「部署」**。
5. （首次部署會跳出授權視窗）：
   - 點擊「審查權限 (Review Permissions)」➜ 選擇您的 Google 帳號 ➜ 點擊「進階 (Advanced)」➜ 點擊「前往 CardMatcher-Notion-Relay (不安全)」➜ 點擊「允許 (Allow)」。
6. 部署完成後，複製 **「網頁應用程式網址 (Web App URL)」**（格式如：`https://script.google.com/macros/s/AKfycb.../exec`）。

---

## 📱 在前端 App 啟用即時雲端同步

1. 開啟 [2026 信用卡回饋與點數查核中心 (網頁或手機 PWA)](https://tommy95271.github.io/card-matcher/)。
2. 點擊右上角 **「⚙️ 設定」** 按鈕。
3. 在 **「☁️ Notion 即時雲端同步」** 區塊中，貼上剛剛複製的 **GAS 網頁應用程式網址**。
4. 點擊 **「🧪 測試連線」**，顯示 `連線成功！` 即代表完成設定！
5. 現在只要在任何通路點擊「⚡ 記一筆」，資料就會同時存入手機 LocalStorage 並於 1 秒內寫入 Notion 資料庫！

---

## 🛠️ API 規格說明

### 1. `POST /`
- **新增消費 (add_expense)**:
  ```json
  {
    "action": "add_expense",
    "data": {
      "date": "2026-09-14",
      "merchantName": "星巴克",
      "amount": 165,
      "cardId": "cathay_cube",
      "cardName": "國泰世華 CUBE 卡",
      "bank": "國泰世華",
      "schemeName": "樂饗購",
      "rate": 3.0,
      "expectedPoints": 5,
      "notes": "冰美式咖啡"
    }
  }
  ```
- **更新核對狀態 (update_status)**:
  ```json
  {
    "action": "update_status",
    "notionPageId": "3dbdc85d-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "status": "verified",
    "actualPoints": 5
  }
  ```
- **刪除紀錄 (delete_expense)**:
  ```json
  {
    "action": "delete_expense",
    "notionPageId": "3dbdc85d-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
  ```

### 2. `GET /?action=fetch_expenses`
- 回傳 Notion【💳 2026 刷卡記帳與點數對帳庫】最近 100 筆消費紀錄，供多裝置資料同步。
