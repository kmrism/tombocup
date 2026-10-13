# _tools（サイトには公開されない作業用スクリプト）

`_` で始まるフォルダーは GitHub Pages（Jekyll）が公開しない。

## パイロンマップ

座標・標高は `TonboCup_2024.wpt`／`TonboCupGeo_2024.wpt` を突き合わせて使い（1m以上ずれていたら止まる）、
名称・得点は `pylon-data.html` の表から取る。ウェイポイントや得点を変えたら両方作り直す。

### pylon-map.html（拡大できる地図のページ）

```bash
node _tools/gen_pylon_map_page.js
```

### Pylon_Map.jpg／Pylon_Map.pdf（A4縦の印刷用）

1. 印刷用 HTML を作る（出力先は任意の作業フォルダー）
   ```bash
   node _tools/gen_pylon_map_print.js 作業フォルダー/map.html
   ```
2. Chrome（ヘッドレス）で撮影する（2480×3508px＝A4 300dpi 相当）
   ```bash
   chrome --headless=new --hide-scrollbars --window-size=1240,1754 --force-device-scale-factor=2 \
          --virtual-time-budget=25000 --screenshot=作業フォルダー/map.png file:///作業フォルダー/map.html
   ```
3. PNG を JPEG（品質88程度）にして `Pylon_Map.jpg` とする
4. `pylon_map_pdf.html` を `Pylon_Map.jpg` と同じフォルダーに置き、PDF にする
   ```bash
   chrome --headless=new --no-pdf-header-footer --print-to-pdf=作業フォルダー/Pylon_Map.pdf file:///作業フォルダー/pylon_map_pdf.html
   ```

地図は OpenTopoMap（CC-BY-SA）。帰属表示
「Kartendaten: © OpenStreetMap-Mitwirkende, SRTM | Kartendarstellung: © OpenTopoMap (CC-BY-SA)」を
地図上に必ず見える形で入れる（端で切れないよう余白を取ってある）。
