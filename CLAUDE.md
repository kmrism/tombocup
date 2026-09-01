# CLAUDE.md — とんぼカップ2026 (TOMBO CUP) サイト

## プロジェクト概要
静岡県富士宮市のパラグライダークラブ「とんぼクラブ」主催、第33回 2026年度とんぼカップ
（2026年11月7日(土)、予備日11月8日(日)、猪之頭フライトパーク）の公式サイト。
GitHub Pagesで公開中：`https://kmrism.github.io/tombocup/`
リポジトリ：`https://github.com/kmrism/tombocup`

## 環境
- Windows。PowerShellでは `git` コマンドが認識されないことがあるため、git操作は **Git Bash** で行う
- ローカル作業フォルダ：`C:\Users\kimur\Desktop\Claude\Tombocup2026_site`
- リポジトリ直下にサイトの全ファイルを**フラットに配置**（サブフォルダに入れない）。
  `index.html` が最上位階層にないとGitHub Pagesが機能しない

## ファイル構成（すべてリポジトリ直下）
- `index.html`（トップページ）
- `taikai-yoko.html`（大会要綱）
- `kyogi-naiyou.html`（競技内容）
- `pylon-data.html`（パイロンデータ・ウェイポイントDL）
- `pylon-map.html`（パイロンマップ）
- `osusume-task.html`（おすすめタスク。クラス切替のため**JS使用**）
- `tonbo_task_builder.html`（タスクビルダー。**JS使用**）
- ダウンロード用アセット：`Pylon_Map.jpg` / `.pdf`、`TomboCup2026_Taikai_Yoko.pdf`、
  `TomboCup2026_Kyogi_Naiyou.pdf`、`TonboCup_2024.wpt` / `TonboCupGeo_2024.wpt` / `.cup` / `.gpx` / `.kml`

## コーディング規約（厳守）
- **インラインCSSのみ。** `<style>` タグの例外は次の3つだけ：
  - Google Fontsの `<link>`（Cinzel Decorative、TOMBOロゴ見出し用）
  - トップページのSVG写真スライドショーのkeyframesアニメーション
  - `osusume-task.html` / `tonbo_task_builder.html` のクラス選択リストボックス
    （`:hover` `.active` `[aria-selected]` など、style属性では書けない状態指定が必要）
- **`<script>` タグは `tonbo_task_builder.html` と `osusume-task.html` のみ。** 他は静的HTML
  - `osusume-task.html` はクラス切替のためだけにJSを使う。JS無効でも
    `<noscript>` で全クラスのタスクが並んで見えるようにしてある（機能を殺さない）
- 色・フォント・余白は全てstyle属性に直接指定する（外部CSSファイルなし）

## デザイントークン
- シアン `#0891B2`、ネイビー `#0C4A6E`、濃いシアン `#164E63`
- オレンジ `#F97316` は **エントリー関連ボタン専用**。他の用途（問い合わせボタン等）には使わない
- グレー階調：`#F8FAFC` `#F1F5F9` `#E2E8F0` `#94A3B8`
- 文字色：`#0F172A`（見出し）`#334155`（本文）`#64748B`（補足）
- TOMBOロゴ書体：サイトは **Cinzel Decorative**（weight 700）。ポスター（別ファイル）は **Kaushan Script**
- 大会情報・大会資料のカードグリッドは列幅を揃えること（`minmax(220px,1fr)` で統一。
  片方だけ違う値にすると列数がずれる — 実際に起きたバグ）

## テーブル実装のルール（pylon-data.html / kyogi-naiyou.html）
- 横スクロール時、一番左の列（パイロン記号）は `position:sticky;left:0` で固定し、
  境界に薄い box-shadow を入れる
- 名前列は `min-width:6.5em` 程度を指定し、日本語名が1文字ずつ縦書き状態に
  ならないよう最大2行に収める

## パイロンデータ — 最重要・絶対にでっち上げない
- 座標の正は `TonboCup_2024.wpt` / `TonboCupGeo_2024.wpt`。ページやマップ画像の記載と
  食い違ったら**必ずウェイポイントファイル側を正**として扱い、突き合わせて検証する
- パイロンマップ画像が更新されたら、OCR等で表の数値を読み取ってwptファイルと
  突き合わせてから差し替える（過去にK/Nの座標重複、H・Oの表記違いが実際にあった）
- 全16パイロン：A D E F G H J K M N O P Q R TO LD
  （E=怪鳥尾根は中央基点、TO=テイクオフ、LD=ランディング）
- 正しい名称：H=農道十字路、O=陣馬尾根先端ピーク（似た誤記に注意）

## タスクビルダー（tonbo_task_builder.html）の仕様
- 未使用パイロンは**タップで追加**（プラン末尾へ）、プラン内は**タップで削除**
- **長押しでつかんで移動**すると好きな位置へ挿入・順番の入れ替えができる（スマホ実機で動作確認済み）
- 誘導線（ドロップ位置の目印）は **Dの前には出さず、Eの前に出す**。TOの前／LDの後ろには出さない
- 「QRコードを表示」はXCTrack `.xctsk` 形式（QR形式2、`XCTSK:` + JSON）を生成
  - 座標はGoogle polyline整数エンコード（公式 `go-xctrack` のテストベクターと一致検証済み）
  - D=SSS（type 2）、最終地点=ESS（type 3）、TOは1番目のTP（XCTrackが自動でTAKEOFF扱いする仕様）
  - エラップスタイム、WGS-84（`e:0`）、ゴールはシリンダー、半径200m、QRの色は黒
  - **時刻はUTC固定**（`HH:MM:SSZ` の9文字。公式仕様書 Competition Interfaces に明記。
    ローカル時刻やオフセットは書けない）。`tod()` が日本時間をUTCに変換して出力する。
    スタート/テイクオフ開放 **9:00 JST**（=`00:00:00Z`）、
    タスク終了 **16:00 JST**（=`07:00:00Z`）。
    JSTのまま `09:00:00Z` と書くと18:00 JST扱いになる — 実際に起きたバグ
  - `cdnjs` の qrcodejs に依存 → オフラインでは表示不可（インターネット接続下で動作確認）

## 大会情報（事実関係）
- 第33回 2026年度とんぼカップ／2026年11月7日(土)・予備日8日(日)／
  猪之頭フライトパーク（とんぼクラブエリア）／静岡県富士宮市猪之頭2786
- 主催：とんぼカップ大会実行委員会／後援：静岡県フライヤー連盟／
  実行委員長：遠藤聡／競技委員長：阿知波広和
- 参加費：とんぼクラブ会員3,000円・ビジター6,000円（非課税）／申込締切：2026年10月16日(金)
- エントリー：とんぼ会員→`https://form.run/@tombocup-member`／ビジター→`https://form.run/@tombocup`
- 問い合わせフォーム（全ページのフッターに設置。シアングラデーションの目立つボタン）：
  `https://docs.google.com/forms/d/e/1FAIpQLSfoMTUH72hzGhfOlBiHGyojamJ6L9VttmLLAF4RAxQaVIwg_A/viewform`

## 編集後に必ず確認すること
1. `<div>` と `</div>` の数が一致しているか（div開閉の収支）
2. footerがbody直下（ネスト深度0）にあるか — ラッパーの中に閉じ込まれると横幅が
   制限される（実際に起きたバグ）
3. 実際にブラウザでレンダリングし、375px・768px・1440px程度でスクリーンショットを確認
   （崩れ・横スクロール・文字切れがないか）
4. スマホ幅で長い日本語名や矢印などのUIパーツが潰れていないか

## デプロイ
- GitHub Pages（`Settings → Pages → Deploy from a branch → main / (root)`）で公開中
- 編集後は次の手順でpushする：
  ```
  git add -A
  git commit -m "変更内容"
  git push
  ```
- 数分後に `https://kmrism.github.io/tombocup/` に反映される

## 応答スタイル
- やり取りは日本語。簡潔に、変更点を箇条書きで示す
- 外部フォーマットの仕様（QRコード形式など）を推測で実装しない。公式仕様を確認してから実装する
