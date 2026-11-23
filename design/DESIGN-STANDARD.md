# 專案設計規範

適用於 SM6351_FinalProject 的頁面、圖表、互動控制與資料視窗。後續新增與修改介面時沿用本規範。字體規範以使用者最後提供的 `613.PNG` 為準，參考圖已保存在 [typography.png](reference/typography.png)。

## 色彩

採用使用者提供的 Abyssal Bloom 八色色盤。

| 色彩 | 色碼 | 用途 | 現有樣式變數 |
| --- | --- | --- | --- |
| 深淵黑 | `#010206` | 主背景、動畫畫布 | `--dv-bg` |
| 深海藍 | `#042156` | 內容區、卡片與選中區背景 | `--dv-surface`、`--dv-soft` |
| 岩灰藍 | `#3A5362` | 分隔線、邊框、輔助圖形 | `--dv-line` |
| 鈷藍 | `#1745A4` | 主要按鈕、主要操作 | `--dv-primary` |
| 海洋藍 | `#06619B` | 次級圖形、完整年份曲線 | `--dv-secondary` |
| 亮青藍 | `#1899C5` | 已探索曲線、資料點、互動高亮 | `--dv-accent` |
| 霧銀白 | `#C9CCD1` | 標題、重要文字 | `--dv-ink` |
| 暖銅棕 | `#9F705D` | 少量特殊類別與政策標記 | `--dv-copper` |

現有介面另使用正文色 `#CED6E1`（`--dv-text`）及次要文字色 `#9AAEBE`（`--dv-muted`），用於深色背景上的閱讀層級。這兩項為實作補充，並非原始八色色盤的一部分。銅色以裝飾標記為主；正文、註釋及控制文字應維持至少 4.5:1 的對比度。

## 字體與排版

| 使用場景 | 字體 | 字重 | 電腦字號 | 手機字號 | 行高 | 字距 |
| --- | --- | --- | --- | --- | --- | --- |
| 首頁大標題 H1 | Manrope Medium | 500 | 96px | 44px | 1.05 | -0.04em |
| 章節標題 H2 | Manrope Medium | 500 | 48px | 32px | 1.15 | -0.025em |
| 小標題 H3 | Manrope Medium | 500 | 28px | 24px | 1.25 | -0.015em |
| 首頁介紹 | Inter Regular | 400 | 20px | 18px | 1.6 | normal |
| 正文 | Inter Regular | 400 | 18px | 16px | 1.65 | normal |
| 來源／註釋 | Inter Regular | 400 | 14px | 14px | 1.5 | normal |
| 按鈕 | Inter Medium | 500 | 16px | 16px | 1.25 | 0.01em |

- 標題使用 Manrope；介紹、說明、資料標籤與按鈕使用 Inter。學名使用斜體。
- 正文閱讀寬度以 65ch 為上限，介紹以 52ch 為參考。
- 原始規範沒有指定手機斷點；現有專案以 700px 以下套用手機字級。
- 超大年份與交易量為資料展示字級，不屬於 H1–H3。現有年份動畫保留獨立尺寸與行高；新增此類展示字級時應明確區分其用途，不改動上表。
- 「Policy context」等介面分類標籤可使用輔助標籤樣式，不作為章節標題的視覺尺寸依據。

## 字體檔案

指定字體已隨專案保存，頁面不依賴外部字體服務：

- [Manrope Medium 500](../ten-years/dist/fonts/manrope-500.ttf)
- [Inter Regular 400](../ten-years/dist/fonts/inter-400.ttf)
- [Inter Medium 500](../ten-years/dist/fonts/inter-500.ttf)
- [Manrope 授權](../ten-years/dist/fonts/manrope-OFL.txt)
- [Inter 授權](../ten-years/dist/fonts/inter-OFL.txt)

新增頁面應重用這些檔案，並保留授權。字體無法載入時才使用系統 sans-serif 備援。

## 實作約定

- 現有樣式入口為 [ten-years/dist/style.css](../ten-years/dist/style.css)。色彩與字級集中在 `.dv-shell` 的 CSS 變數，新增樣式優先重用。
- 樣式維持 `.dv-shell` 範圍，避免影響嵌入頁面的其他內容。
- 圖表、按鈕、資料／政策視窗使用相同的字體與色彩規範。選中狀態同時提供形狀、底色、底線或文字等可辨識線索。
- 字體放大後應調整版面與間距，避免裁切內容。年度交易量與產品形式各用一個章節畫面，依序捲動，並共用所選年份。年度圖顯示 FIN、DFN 和 FFN 的每年申報重量合計，以等重量的魚形堆疊，圖例標出每個魚形代表的重量，柱頂刻線標出實際數值位置。產品圖用三張魚鰭圖片辨認類別，橫條使用共用公斤刻度。滑過柱形或切換年份時同步更新產品圖。產品圖的三種魚鰭形態各自顯示重量。資料畫面以觸控及鍵盤操作作為替代方式，詳細資料彈窗可獨立捲動。
- 開場沿用使用者提供的全螢幕水下場景，使用本機字體。物種介紹與資料章節共用同一層海水背景，圖表直接置於海水背景上。
- 保留可見鍵盤焦點、控制項名稱與減少動態效果設定。
- 視覺調整不得改變 CITES 資料、篩選含義、缺值處理或政策事件的適用範圍。

## 原始參考

以下為先前從使用者提供的設計壓縮檔解出的原始參考，保留以供查閱；實際頁面使用上述本機字體和專案樣式入口。

- [八色色盤 CSS](reference/abyssal-bloom-palette.css)
- [色盤及用途 HTML](reference/abyssal-bloom-palette.html)
- [原始字體參考 CSS](reference/standar.css)
- [使用者確認的字體規範圖](reference/typography.png)
