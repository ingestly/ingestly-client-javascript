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
- ビルド済みSDKを使う場合、 [GitHub Releases](https://github.com/ingestly/ingestly-client-javascript/releases) ページで配布しているファイルを利用できます
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
2. 7行目から44行目の設定変数を変更します：
    - `endpoint` : 構成した Ingestly Endpoint のホスト名
    - `apiKey` : エンドポイント用のAPIキー。IngestlyのFastly用Custom VCLの中で `true` としてリストされている必要があります
    - `eventName` : SDKはrequestAnimationFrameのタイミングに基づいて再帰的にイベントを発生させます。ここで発生させるイベント名を指定できます
    - `eventFrequency` : 再帰的イベントはここでミリ秒で指定した間隔でスロットリングされます。SDKの検知精度を上げる場合は小さい値にします
    - `prefix` : localStorage と Cookie で使うキー名の定義に用いられます
    - `targetWindow` : ターゲットとするウィンドウのプロパティ名。 `self`、 `parent` または `top` が利用可能です
3. ファイルを保存します

メモ： `eventName` と `eventFrequency` の一方またはいずれかを削除するか、 `eventFrequency` に `0` を指定すると、再帰イベントは無効は無効化されます。

#### .js ファイルの設置

1. コアライブラリ `ingestly.js` と設定ファイル `page_code.js` をウェブサイトにアップロードします
2. Ingestly計測メソッドを発火させるため、全てのページに以下のような `<script>` を追加します


```html
<script src="./dist/ingestly.js"></script>
<script src="./dist/page_code.js"></script>
```

## オプション

追加の計測機能を有効化できます。

### リアルユーザーモニタリング

- 各クライアントにおける実際のページロードの時間軸に基づくパフォーマンス情報、Real User Monitoringの計測ができます
- `config()` の中で、 `options.rum.enable` に対して `true` を設定します

### ページ上での滞在時間 (アンロード)

- アンロード計測はページがアンロードされる際に利用可能なイベントの一つにイベントリスナーをセットします
- ユーザーが特定のページビューの間に割いた正確な時間が得られます
- `config()` の中で、 `options.unlaod.enable` に対して `true` を設定します

### クリック計測

- クリック計測はクリックされた要素（またはその親要素）が、指定した `data-*` 属性を持っている場合に発動します
- `options.clicks.enable` に `true` がセットされていながら、 `options.clicks.targetAttr` を省略した場合、クリック計測は `data-*` 属性のない要素に対するクリックを計測します
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
|targets|`document.getElementsByTagName('article')`|nodeListまたは配列。読了計測の対象となるブロック要素を指定します|

### メディア計測

- このオプションを有効にすると、VIDEOまたはAUDIOの全てのメディアが自動計測されます
- このオプションは、 `play`, `pause` そして `eneded` イベントに加え、ハードビートをサポートします
- `config()` の中で、 `options.media.enable` に対して `true` を設定し、設定値を調整します：

|変数|例|説明|
|:---|:---|:---|
|heartbeat|`5`|ここで指定した X秒 ごとにハートビート計測が発動します|

### フォーム分析

- Form Analysisはフォームの完了についての統計情報を提供します。フォームのフィールドに入力された値は含みません
- この機能は、フォームo要素のリストを渡すことで、複数のフォームに対応します
- `config()` の中で、 `options.form.enable` に対して `true` を設定し、設定値を調整します：

|変数|例|説明|
|:---|:---|:---|
|targets|`document.getElementsByTagName('form')`|フォーム要素のリストを渡します|


## API instructions

- SDKは基本的に グローバル名前空間 `Ingestly` を利用します
- カスタムイベント `ingestlyRecurringEvent` （または `config()` で指定した名前）を要素の周期的な観測に利用できます

### Ingestly.config(config)

- 構成を行うメソッド。このページの「構成」と「オプション」を参照してください

### Ingestly.init(dataModel)

- ページに対する初期化
- メソッドは、URL、タイトル、リファラー等のページ単位の変数を定義します
- もしウェブサイトがSPAの場合、画面が更新される度にこのメソッドを呼び出すべきです
- 引数 `dataModel` はオブジェクトでなければなりません。BigQuery側のスキーマとFastly側のログフォーマットを定義すれば、任意の変数を追加することも可能です。

### Ingestly.trackPage(eventContext)

- ページビューイベントに対するビーコンを送信します
- 引数としてオブジェクトを渡すことで、任意の変数を追加計測することも、 `Init()` 時に渡した値を上書きすることもできます

### Ingestly.trackAction(action, category, eventContext)

- お好きなイベントに対してカスタムイベントを送信します

### Ingestly.getQueryVal(keyName)

- このメソッドはGETパラメータの キー-バリュー ペアから、指定したキー名に対応する値を返します
- もしURLが指定したキー名のペアを含まない場合、このメソッドは空文字 `''` を返します
- 注意として、このメソッドは呼び出す度にURLをパースするわけではありません。URLのGETパラメータは `init()` の時点でパースされオブジェクトが生成されます。このメソッドはそのオブジェクトからキーに対応する値を取り出すのみです。従って、もしウェブサイトがSPAでGETパラメータが更新され、その値を利用したい場合、都度 `init()` を呼び出すか、このメソッドを使わずに値を渡すべきです。