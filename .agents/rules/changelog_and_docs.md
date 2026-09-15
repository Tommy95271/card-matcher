# 專案開發與版本同步規範 (Changelog & Documentation Rules)

每一次對本專案進行功能新增 (feat)、錯誤修復 (fix)、UI 重構 (ui/style) 或架構調整時，**必須一律同步執行以下更新**：

1. **更新開發與版本日誌 (`src/data/changelog.js`)**：
   - 在 `CHANGELOG_DATA` 陣列最上方新增或更新版本項目（遵循語意化版本如 `v2026.X.Y`）。
   - 包含發布日期 `date`、標題 `title` 以及亮點分類標籤：
     - `feat`: ✨ 新增功能
     - `fix`: 🐞 錯誤修復
     - `ui`: 🎨 介面與互動優化
     - `perf`: ⚡ 效能與速度躍升

2. **同步專案主說明文件 (`README.md`)**：
   - 若有重大功能增修、UI 變更或架構演進，同步更新 `README.md` 的「核心功能亮點」與「專案目錄結構」。

3. **同步架構決策演進史 (`docs/development-journey.md`)**：
   - 若涉及重要設計決策或架構取捨，記錄新增對應的 ADR (Architecture Decision Record)。

4. **嚴格遵循 Conventional Commits 1.0.0 規範**：
   - Git Commit 訊息必須採用 `type(scope): description` 格式。
