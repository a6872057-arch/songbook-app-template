---
name: songbook-app-starter
description: 以可分享的 Expo 歌本範本建立或客製化 Android 歌詞與音檔 App；適用於建立自己的歌本、替換曲庫、加入樂譜及準備 APK 建置。
---

# 歌本 App Starter

來源範本：https://github.com/a6872057-arch/songbook-app-template

## 取得專案

先確認是否已有使用者指定的歌本專案；若有，檢查其 README、AGENTS.md 與 package.json，在原專案範圍工作。若是新 App，將範本下載或 clone 到新的資料夾，避免覆寫既有專案。技能本身只有指引，完整程式碼由上述倉庫取得；無法取得時如實說明，不假裝已建立 App。

只在關鍵資訊缺少時詢問 App 名稱、目標資料夾、歌曲／錄音來源與是否要中央管理。不因啟用本 Skill 而自動建立帳號、雲端服務、公開倉庫或付費建置。

## 客製化

讀取範本 README.md 和 docs/CUSTOMIZE.md，依使用者選擇調整：

- app.json 的 name、slug、Android package 與 iOS bundleIdentifier；新 App 不沿用別人的 owner、EAS projectId、簽署金鑰或 Firebase 設定。既有已安裝 App 的 package 不隨意變更。
- catalog.json 的歌曲：id 穩定唯一，number 為三位數且不重複，lyrics 陣列代表分節；先用範本示範內容驗證，再加入有權使用的作品。
- bundledAudio.ts、scoreSources.ts 以歌曲 id 對應資產，Metro require 必須是靜態字串。不要把手機本機 file URI 當成可分享的內建音檔。
- 原範本資料只存本機，並允許使用者編輯歌詞。若使用者要中央管理多人歌庫，另行設計登入、發布流程及伺服器端寫入限制；不能把隱藏按鈕視為權限控制。

若 Skill 被獨立安裝，docs/CUSTOMIZE.md 是取得後的範本倉庫內檔案，不是技能目錄內檔案。

## 檢查與交接

依 package.json 安裝相依套件；改 Expo API 前讀取對應 SDK 版本官方文件，新增 Expo 模組使用 npx expo install。
修改後執行 lint、typecheck、test:library，並以 Expo Android export 檢查資產和 JavaScript 打包。check:template 專門檢查未客製化的公開範本；加入自己的素材或 EAS 設定後，按新專案需求調整，不能為通過檢查而刪掉使用者的有效設定。

APK 需由使用者自己的 EAS 專案建置。只有授權包含建置／部署／公開分享時才執行對應外部動作；否則交付可檢視的本機專案與步驟。
交付時清楚區分原始碼、成功匯出的 bundle、已建置 APK 與手機實測；寫明哪些已完成、哪些仍需使用者帳號或裝置操作。
