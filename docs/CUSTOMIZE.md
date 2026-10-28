# 客製化與 Android 建置

## App 身分

編輯 app.json：

| 欄位 | 範本值／用途 |
| --- | --- |
| expo.name | 歌本 App 範本；手機顯示名稱，App 頁首也讀這個值 |
| expo.slug | songbook-app-template；改成你自己的小寫英文專案名稱 |
| expo.android.package | com.example.songbooktemplate；正式發布前改為你自己的唯一識別碼 |
| expo.ios.bundleIdentifier | com.example.songbooktemplate；若要發布 iOS，同樣改成自己的 |
| expo.version | 使用者看到的版本，初始 1.0.0 |
| expo.android.versionCode | Android 更新用整數，每次發布升高 |

請在首次提供安裝檔前決定識別碼。既有 App 若隨意更換 package，手機會把它視為另一個 App。相同 slug 在 Expo Go 中可能共用本機資料名稱，因此新專案請先改 slug。

## 歌曲資料

catalog.json 每筆資料使用以下格式：

```json
{
  "id": "my-song-001",
  "number": "001",
  "title": "我的歌曲",
  "category": "我的歌本",
  "lyrics": ["第一節第一行\n第一節第二行", "第二節"],
  "musicInfo": "可填調性、拍號或作者",
  "sourceNotes": "可填出處與授權說明"
}
```

id 必須唯一且保持穩定，收藏和歌單以它識別歌曲。number 使用 001–999 的三位數字，避免重複。編號鍵盤最多接受三位數；大量歌庫需同步擴充編號介面。

範本啟動時會合併內建歌目與使用者本機內容：保留本機編輯的文字和音檔，更新內建歌曲的名稱與編號；自訂歌曲撞號時重新編號，不刪除音檔或改變 id。這不是中央發布的唯讀歌庫。

## 音檔

開啟歌曲後，使用「從手機加入音檔」。批次匯入的 MP3 檔名格式為 `001 - 我的歌曲.mp3`。也可以透過「加入 MP3」新增歌曲。

若要內建音檔，將可分享的檔案放進 assets，並在 bundledAudio.ts 使用歌曲 id 對應靜態 require：

```ts
export const bundledAudio: Record<string, number> = {
  'my-song-001': require('./assets/my-song.mp3'),
};
```

音檔與文字不會自動對齊或轉錄，請自行加入相符內容。手機匯入檔案只存在 App 文件目錄，不會由 GitHub 原始碼備份保存。

## 樂譜

加入 PNG 或 JPG 後，編輯 scoreSources.ts：

```ts
export const scoreSources = {
  'my-song-001': require('./assets/scores/my-score.png'),
};
```

所有圖片應使用相同長寬比例；把 SCORE_ASPECT_RATIO 改成圖片的「寬 ÷ 高」。加入對應圖片後，歌曲頁會顯示完整樂譜／文字歌詞切換。Metro 的 require 路徑必須是靜態字串。

## 建立自己的 APK

先完成上面的名稱與識別碼設定，再使用自己的 Expo 帳號：

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

初始化時建立屬於自己帳號的新專案。EAS 會寫入你的 projectId；這份範本沒有預先綁定任何人的專案。preview 產生可供 Android 安裝的 APK，production 用於後續商店建置。

建置服務的額度與費用以自己的帳號方案為準；範本不會自動替你啟動付費建置或發布。參考 [Expo 官方建置說明](https://docs.expo.dev/build/setup/)。

## 延伸成中央管理歌庫

此範本沒有 Firebase、登入、伺服器或管理後台。若要只有管理員能修改，而所有人收到同一份內容，需要另外設計管理員身分、發布狀態、Firestore／音檔儲存及伺服器端存取規則，並調整目前可在手機編輯歌詞與匯入音檔的行為。

不要只隱藏按鈕就宣稱完成管理員權限。先用有權分享的測試內容驗證，再決定是否對外發布。
