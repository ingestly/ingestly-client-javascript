# Ingestly JavaScript Client 

[Japanese Document available here / 日本語ドキュメントはこちら](./README-JP.md)

## What's Ingestly?

**Ingestly** is a simple tool for ingesting beacons to Google BigQuery. Digital Marketers and Front-end Developers often want to measure user's activities on their service without limitations and/or sampling, in real-time, having ownership of data, within reasonable cost. There are huge variety of web analytics tools in the market but those tools are expensive, large footprint, less flexibility, fixed UI, and you will be forced to use SDKs including legacy technologies like `document.write`.

Ingestly is focusing on Data Ingestion from the front-end to Google BigQuery by leveraging Fastly's features.
Also, Ingestly can be implemented seamlessly into your existing web site with in the same Fastly service, so you can own your analytics solution and ITP does not matter.

**Ingestly provides:**

- Completely server-less. Fastly and Google manages all of your infrastructure for Ingestly. No maintenance resource required.
- Near real-time data in Google BigQuery. You can get the latest data in less than seconds just after user's activity.
- Fastest response time for beacons. The endpoint is Fastly's global edge nodes, no backend, response is HTTP 204 and SDK uses ASYNC request.
- Direct ingestion into Google BigQuery. You don't need to configure any complicated integrations, no need to export/import by batches.
- Easy to start. You can start using Ingestly within 2 minutes for free if you already have a trial account on Fastly and GCP.
- WebKit's ITP friendly. The endpoint issues 1st party cookie with secure flags.

## Implementation

### Prerequisites
- [Ingestly Endpoint](https://github.com/ingestly/ingestly-endpoint) must be in operation.
- If you use the pre-build SDK, you can use files under `./dist` directory.
- If you wish to build the SDK by yourself, node.js is required.
- The SDK uses a localStorage key and a Cookie for storing sub-domain specific ID.

### Build the SDK

```sh
# Install required node_modules (only for build process. no dependencies.)
npm install

# ESLINT under ./src
npm run lint

# Build the SDK into ./dist
npm run build
```

### Install to your website

#### Configuration

1. Open `./dist/page_code.js`
2. Change configuration variables between line 7 and 12:
    - endpoint : a hostname of Ingestly Endpoint you provisioned.
    - apiKey : an API key for the endpoint. This value must be listed as `true` in Fastly's Custom VCL for Ingestly.
    - eventName : the SDK dispatches a recurring event based on a timing of requestAnimationFrame. You can specify a name of this event.
    - eventFrequency : the recurring event is throttled by this interval in millisecond. Set a small number if you want to make the SDK sensitive.
    - prefix : used for defining a key name of localStorage and Cookie.
    - cookieDomain : a domain name of your website. (generally you should remove a sub-domain to use the cookie across sites under the same domain name.)
3. Save the file.

#### Place .js files

1. Upload a core library `ingestly.js` and a config file `page_code.js` to your web site.
2. Add `<script>` tags into all pages like the below to fire Ingestly Tracking method.

```html
<script src="./dist/ingestly.js"></script>
<script src="./dist/page_code.js"></script>
```

## Options

You can enable optional tracking features.

### Scroll Depth

- Scroll depth tracking for both fixed page and infinity scroll (lazy-load) page.
- In `init()`, set `true` for `options.scroll.enable` and adjust values:

|variable|example|description|
|:---|:---|:---|
|enable|`true`|track scroll depth or not|
|threshold|`2`|track the depth when the user stay at/over X percent/pixels for more than T seconds specified here|
|granularity|`20`|track the depth every X percent/pixels increased|
|unit|`percent`|for the fixed height page, you can use `percent`. If the page is infinity scroll, use `pixels` instead|


### Clicks with data-trackable

- Click tracking is triggered if the clicked element (or its parent) has the specified `data-*` attribution. 
- In `init()`, set `true` for `options.clicks.enable` and adjust values:

|variable|example|description|
|:---|:---|:---|
|enable|`true`|track click events or not|
|targetAttr|`data-trackable`|attribution name for identifying the target element|

- If you set `data-trackable` for `targetAttr`, you need to add `data-trackable` attribution to every element you want to track clicks.
- Ideally, every block elements should be structured like hierarchy. and each block element should have `data-trackable` with meaningful value.


## API instructions

- Basically, SDK uses a global namespace `Ingestly`.
- A custom event `ingestlyRecurringEvent` (or your specified name) can be used for observing elements repeatedly.

### Ingestly.init(config, dataModel)


### Ingestly.trackPage(eventContext)

### Ingestly.trackAction(action, category, eventContext)

### Ingestly.getQueryVal(keyName)
