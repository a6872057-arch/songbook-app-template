# 歌本 App 範本 · Songbook App Template

用自己的歌詞、錄音和樂譜，建立 Android 歌本 App。附繁體中文介面、接手指南，以及供 AI 使用的 **songbook-app-starter Skill**。

## 取得你自己的副本

在 GitHub 按 **Use this template → Create a new repository**，或用 **Code → Download ZIP** 下載原始碼。

這是可以繼續開發的原始碼範本，不是已簽署的手機安裝檔。

## 已有功能

- 數字鍵盤選歌、搜尋編號／歌名／文字。
- 分節歌詞、可調字體、手機內編輯文字。
- 收藏、播放清單與本機保存。
- 匯入單首 MP3 或依編號批次配對 MP3。
- 為歌曲更換 MP3、M4A、AAC、WAV、OGG 音檔。
- 可接入自有樂譜圖片，支援放大至 400%。範本未附樂譜。
- 第 001 首附 1.5 秒合成測試音；第 002、003 首供閱讀及匯入練習。

目前不含 Firebase、管理後台、帳號登入、跨手機同步、背景播放或自動連播。歌單目前是選歌清單。匯入內容留在各自手機，移除 App 可能移除資料。

## 在電腦啟動

先安裝 Node.js 22.13 以上（建議 Node.js 24 LTS）與 Git，然後在專案資料夾執行：

```bash
npm ci
npm start
```

使用支援本專案 Expo SDK 的 Expo Go 掃描 QR Code。電腦與手機需能互相連線；若 Expo Go 版本不相容，請依 Expo 官方說明使用開發建置。

本範本主要針對 Android。保留 iOS 設定入口，但未完成 iPhone 實機驗證；尚未安裝 Web 平台相依套件。

## 做成自己的 App

1. 修改 app.json 的 App 名稱、slug、Android package、iOS bundleIdentifier。
2. 修改 catalog.json 的歌曲內容，保留穩定且唯一的 id。
3. 在 bundledAudio.ts 或 scoreSources.ts 加入自己有權使用的音檔／圖片。
4. 使用自己的 Expo 帳號建立 EAS 專案，再產生 APK。

範本沒有任何原作者的 EAS projectId、Firebase 設定或帳號憑證。完整步驟見 [客製化與 Android 建置](docs/CUSTOMIZE.md)。

## 交給 AI 接手

把此倉庫連結交給 Codex 或 Claude Code，說明想做的 App 名稱及歌曲來源，請它先讀 [Skill](skills/songbook-app-starter/SKILL.md) 與 [AGENTS.md](AGENTS.md)。

若想安裝成可重複使用的技能，複製整個 `skills/songbook-app-starter` 資料夾到你的 Agent 技能目錄。Codex 可使用 `~/.agents/skills/`，Claude Code 可使用 `~/.claude/skills/`；重新載入技能後，以 `songbook-app-starter` 名稱呼叫。Skill 是操作指南，實際程式碼在此倉庫。

## 開發檢查

```bash
npm run lint
npm run typecheck
npm run test:library
npm run check:template
npx expo export --platform android
```

Android 匯出用來檢查 JavaScript 與資產能否打包，不等於產生 APK 或完成手機實測。`check:template` 用於這份未客製化範本；接手後綁定自己的服務或加入素材時，按新專案需求調整檢查。

## 授權與素材

程式、範本新編示範文字及合成測試音以 MIT 授權提供，保留原有 Expo 授權聲明。第三方套件適用各自授權。此範本沒有收錄私人歌本、原始錄音或使用者資料；你新增的歌曲與樂譜仍需有相應使用及分享授權。

素材清單見 [assets/README.md](assets/README.md)。
