# SM6351_FinalProject

## 專案目錄

| 位置 | 內容 |
| --- | --- |
| [ten-years/dist/](ten-years/dist/) | 直接部署的網站。[首頁](ten-years/dist/index.html)會進入[水下開場](ten-years/dist/opening/index.html)，[獨立圖表頁](ten-years/dist/project.html)保留原有連結入口。 |
| [ten-years/dist/opening/](ten-years/dist/opening/) | 開場場景、保育時間軸、交易概覽，以及最後兩章的樣式和入場動畫。 |
| [ten-years/dist/ocean/](ten-years/dist/ocean/) | 獨立頁面的水下開場，以及兩個入口共用的海水圖、雙髻鯊模型與渲染程式庫。 |
| [ten-years/data/](ten-years/data/) 和 [ten-years/scripts/](ten-years/scripts/) | CITES 原始資料、資料建置及驗證。網站讀取 [dist/data/](ten-years/dist/data/) 的發佈資料。 |
| [design/](design/) | [專案設計規範](design/DESIGN-STANDARD.md)與[原始參考](design/reference/)。 |

[互動與資料說明](ten-years/README.md) · [視覺資產](ten-years/ASSETS.md) · [CITES 管理事件](ten-years/EVENTS.md)

## 本機預覽

在專案根目錄執行以下指令，再開啟瀏覽器中的 [http://localhost:8765/](http://localhost:8765/)。

```sh
python3 -m http.server 8765 --directory ten-years/dist
```

首頁會依序呈現水下開場、雙髻鯊介紹、保育等級歷程、貿易概覽和 2015–2024 年 CITES 魚鰭貿易互動圖表。貿易概覽後繼續向下捲動即可進入圖表，也可選擇 **Explore annual trade data** 直接跳到圖表。

## GitHub Pages 部署

首次部署前，在 GitHub 儲存庫的 **Settings → Pages** 將 **Source** 設為 **GitHub Actions**，並將 `.github/workflows/deploy-pages.yml` 和 `ten-years/dist/` 一起提交並推送到 `main`。

之後每次推送到 `main` 都會自動發佈 `ten-years/dist/`。也可以在 **Actions → Deploy to GitHub Pages** 選擇 `main` 手動執行，部署完成後可在執行記錄中開啟網站。
