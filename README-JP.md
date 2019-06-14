# Ingestly JavaScript Client 

[英語ドキュメントはこちら / English Document available here](./README.md)

## Ingestlyって?

**Ingestly** はビーコンをGoogle BigQueryに投入するためのシンプルなツールです。デジタルマーケターやフロントエンド開発者はサービス上でのユーザーの動きを、制約やサンプリングせず、リアルタイムに、データの所有権を持ち、合理的なコストの範囲内で計測したいと考えます。市場には多種多様なツールがありますが、いずれも高額で、動作が重く、柔軟性に乏しく、専用のUIで、`document.write`のような昔っぽい技術を含むSDKを利用することを強いられます。

Ingestlyは、Fastlyを活用してフロントエンドからGoogle BigQueryへのデータ投入することにフォーカスしています。
また、Ingestlyは同じFastlyのserviceの中で既存のウェブサイトに対してシームレスに導入でき、自分自身のアナリティクスツールを保有できITPは問題にはなりません。


**Ingestlyが提供するのは:**

- 完全にサーバーレス。IngestlyのインフラはFastlyとGoogleが管理するので、運用リソースは必要ありません。
- ほぼリアルタイムのデータがGoogle BigQueryに。ユーザーの動きから数秒以内に最新のデータを得ることができます。
- ビーコンに対する最速のレスポンスタイム。エンドポイントにバックエンドはなく、Fastlyのグローバルなエッジノードが応答、レスポンスはHTTP 204でSDKは非同期リクエストを用います。
- BigQueryに直接連携。複雑な連携設定をする必要はなく、データをバッチでエクスポート・インポートする必要もありません。
- 簡単に始められます。既にFastlyとGCPのトライアルアカウントをお持ちでしたら、2分以内にIngestlyを使い始められます。
- WebKitのITPとの親和性。エンドポイントはセキュアフラグ類付きのファーストパーティCookieを発行します。

## 導入

### 前提条件
- [Ingestly Endpoint](https://github.com/ingestly/ingestly-endpoint) が動いている必要があります
- ビルド済みSDKを使う場合、 `./dist` ディレクトリ下のファイルを利用できます
- SDKをビルドしたい場合、node.jsが必要です
- SDKはサブドメインレベルの固有のIDを保存するため、 localStorage と Cookie で 1つずつキーを利用します

### SDKのビルド

```sh
# 必要なnode_modulesのインストール（ビルド処理用。SDKに依存関係はありません。）
npm install

# ./src 以下に対する ESLINT
npm run lint

# ./dist の中にSDKをビルドします
npm run build
```

### ウェブサイトへの導入

#### 構成

1. `./dist/page_code.js` を開きます
2. 7行目から33行目の設定変数を変更します：
    - `endpoint` : 構成した Ingestly Endpoint のホスト名
    - `apiKey` : エンドポイント用のAPIキー。IngestlyのFastly用Custom VCLの中で `true` としてリストされている必要があります
    - `eventName` : SDKはrequestAnimationFrameのタイミングに基づいて再帰的にイベントを発生させます。ここで発生させるイベント名を指定できます
    - `eventFrequency` : 再帰的イベントはここでミリ秒で指定した間隔でスロットリングされます。SDKの検知精度を上げる場合は小さい値にします
    - `prefix` : localStorage と Cookie で使うキー名の定義に用いられます
    - `targetWindow` : ターゲットとするウィンドウのプロパティ名。 `self`、 `parent` または `top` が利用可能です
3. ファイルを保存します

#### .js ファイルの設置

1. コアライブラリ `ingestly.js` と設定ファイル `page_code.js` をウェブサイトにアップロードします
2. Ingestly計測メソッドを発火させるため、全てのページに以下のような `<script>` を追加します


```html
<script src="./dist/ingestly.js"></script>
<script src="./dist/page_code.js"></script>
```

## オプション

追加の計測機能を有効化できます。


### ページ上での滞在時間 (アンロード)

- アンロード計測はページがアンロードされる際に利用可能なイベントの一つにイベントリスナーをセットします
- ユーザーが特定のページビューの間に割いた正確な時間が得られます
- `config()` の中で、 `options.unlaod.enable` に対して `true` を設定します

### data-trackable によるクリック計測

- クリック計測はクリックされた要素（またはその親要素）が、指定した `data-*` 属性を持っている場合に発動します
- `config()` の中で、 `options.clicks.enable` に対して `true` を設定し、設定値を調整します：

|変数|例|説明|
|:---|:---|:---|
|targetAttr|`data-trackable`|対象となる要素を特定するための属性名|

- もし `targetAttr` に `data-trackable` がセットされている場合、計測したい全ての要素に `data-trackable` 属性を追加する必要があります
- 理想的には、全てのブロック要素が階層のように構造化されていて、それぞれのブロック要素が `data-trackable` に意味のある値を持っているべきです

### スクロール深度

- 高さ固定のページと無限スクロール（遅延読み込み）に対応するスクロール深度計測
- `config()` の中で、 `options.scroll.enable` に対して `true` を設定し、設定値を調整します：

|変数|例|説明|
|:---|:---|:---|
|threshold|`2`|ユーザーが Xパーセント/ピクセル 地点で、ここで指定した T秒以上とどまった場合、スクロール深度が計測されます|
|granularity|`20`|ここで指定した Xパーセント/ピクセル 深度が増加するごとに計測されます|
|unit|`percent`|高さ固定のページの場合、`percent` が使えます。ページが無限スクロールの場合、代わりに `pixels` を指定します|

### 読了率

- 読了率はユーザーによってコンテンツのどれくらいの範囲が消費されたかを表す指標です
- `config()` の中で、 `options.read.enable` に対して `true` を設定し、設定値を調整します：

|変数|例|説明|
|:---|:---|:---|
|threshold|`4`|ユーザーが読了率X以上を、何秒以上維持したら計測するかの閾値です|
|granularity|`10`|ここで指定した割合で読了率が変化する度に計測されます|
|target|`percent`|コンテンツ本体を含むブロック要素のエレメントを1つ指定します|

### メディア計測

- このオプションを有効にすると、VIDEOまたはAUDIOの全てのメディアが自動計測されます
- このオプションは、 `play`, `pause` そして `eneded` イベントに加え、ハードビートをサポートします
- `config()` の中で、 `options.media.enable` に対して `true` を設定し、設定値を調整します：

|変数|例|説明|
|:---|:---|:---|
|heartbeat|`5`|ここで指定した X秒 ごとにハートビート計測が発動します|


## API instructions

- SDKは基本的に グローバル名前空間 `Ingestly` を利用します
- カスタムイベント `ingestlyRecurringEvent` （または指定した名前）を要素の周期的な観測に利用できます

### Ingestly.config(config)

### Ingestly.init(dataModel)

### Ingestly.trackPage(eventContext)

### Ingestly.trackAction(action, category, eventContext)

### Ingestly.getQueryVal(keyName)