# 歌本 App 範本

先讀 README.md 與 docs/CUSTOMIZE.md。此範本為 Expo SDK 58、React Native、TypeScript 的本機歌本 App，入口是 App.tsx；目前使用單一畫面切換，未加入 Expo Router、登入或雲端同步。

- 先確認使用者要改既有專案或建立新 App，避免覆寫其原專案。
- 新 App 須使用自己的 name、slug、Android package、iOS bundleIdentifier 及 Expo/EAS 專案。
- catalog.json 是內建歌目；id 應穩定唯一，number 是三位數編號。更新資料不要擅自清除使用者收藏、歌單、個人歌詞或本機音檔。
- bundledAudio.ts 與 scoreSources.ts 使用歌曲 id 對應資產；Metro require 必須是靜態字串。
- 範本只含示範文字與合成測試音。加入新內容前確認可使用範圍，憑證不能放進原始碼。
- 修改 Expo API 前查閱套件版本與 https://docs.expo.dev/versions/v58.0.0/ 的官方文件。
- 用 npx expo install 安裝 Expo 原生模組。
- 修改後跑 npm run lint、npm run typecheck、npm run test:library；涉及初始範本打包時跑 npm run check:template 與 npx expo export --platform android。
- check:template 是乾淨範本檢查；建立自己的 EAS 專案或加入素材後，應按自己的發布需求調整此檢查。
- 實際建立付費服務、部署、發布 APK 或推送新倉庫，依使用者授權範圍執行。範本與 Skill 不提供額外授權。
