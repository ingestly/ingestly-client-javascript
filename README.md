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
- If you want to use the pre-build SDK, you can use files piblished in [GitHub Releases](https://github.com/ingestly/ingestly-client-javascript/releases).

- If you wish to build the SDK by yourself, node.js is required.
- This endpoint may use cookies named `ingestlyId`, `ingestlySes` and `ingestlyConsent` under your specified domain name.

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
2. Change configuration variables between line 7 and 44:
    - `endpoint` : a hostname of Ingestly Endpoint you provisioned.
    - `apiKey` : an API key for the endpoint. This value must be listed as `true` in Fastly's Custom VCL for Ingestly.
    - `eventName` : the SDK dispatches a recurring event based on a timing of requestAnimationFrame. You can specify a name of this event.
    - `eventFrequency` : the recurring event is throttled by this interval in millisecond. Set a small number if you want to make the SDK sensitive.
    - `targetWindow` : a property name of target window. you can use `self`, `parent` or `top`. 
    - `useCookie` : a default mode of device identification by Cookie. Set `true` to enable, set `false` to disable.
3. Save the file.

Note: If you remove `eventName` and/or `eventFrequency`, or set `0` for `eventFrequency`, the recurring event will be disabled.

#### Place .js files

1. Upload a core library `ingestly.js` and a config file `page_code.js` to your web site.
2. Add `<script>` tags into all pages like the below to fire Ingestly Tracking method.

```html
<script src="./dist/ingestly.js"></script>
<script src="./dist/page_code.js"></script>
```

## Options

You can enable optional tracking features.

### Real User Monitoring

- You can measure the Real User Monitoring data which is the performance information based on timeline of page loading on each client.
- In `config()`, set `true` for `options.rum.enable`.

### Time-spent on a page (unload)

- Unload tracking set an eventListener to one of available events when the page is being unloaded.
- You can get an exact time that user spent during the specific pageview.
- In `config()`, set `true` for `options.unload.enable`.

### Click Tracking

- Click tracking is triggered if the clicked element (or its parent) has the specified `data-*` attribution. 
- If you omit `options.clicks.targetAttr` but `options.clicks.enable` is `true`, Click tracking will measure clicks on elements without `data-*` attribution. 
- In `config()`, set `true` for `options.clicks.enable` and adjust values:

|variable|example|description|
|:---|:---|:---|
|targetAttr|`data-trackable`|attribution name for identifying the target element|

- If you set `data-trackable` for `targetAttr`, you need to add `data-trackable` attribution to every element you want to track clicks.
- Ideally, every block elements should be structured like hierarchy. and each block element should have `data-trackable` with meaningful value.


### Scroll Depth

- Scroll depth tracking for both fixed page and infinity scroll (lazy-load) page.
- In `config()`, set `true` for `options.scroll.enable` and adjust values:

|variable|example|description|
|:---|:---|:---|
|threshold|`2`|track the depth when the user stay at/over X percent/pixels for more than T seconds specified here|
|granularity|`20`|track the depth every X percent/pixels increased|
|unit|`percent`|for the fixed height page, you can use `percent`. If the page is infinity scroll, use `pixels` instead|

### Read-Through Rate

- Read-Through Rate means is a metrics that describes how much range of content is consumed by an user.
- In `config()`, set `true` for `options.read.enable` and adjust values:

|variable|example|description|
|:---|:---|:---|
|threshold|`4`|track the depth of content when the user stay at/over X percent|
|granularity|`10`|track the rate every X percent increased|
|targets|`document.getElementsByTagName('article')`|An array of elements. (nodeList or array) specify block elements to observed as a target of read-through. |

### Media Tracking

- Once you enabled this option, all media which is VIDEO or AUDIO will be tracked automatically.
- This option supports `play`, `pause` and `eneded` events plus the heart-beat.
- In `config()`, set `true` for `options.media.enable` and adjust values:

|variable|example|description|
|:---|:---|:---|
|heartbeat|`5`|the heart-beat tracker will be dispatched every X sec defined here|

### Form Analysis

- Form Analysis provides a statistics info regarding the form completion but not values of form fields.
- This feature accepts multiple forms by passing a list of target element of forms.
- In `config()`, set `true` for `options.form.enable` and adjust values:

|variable|example|description|
|:---|:---|:---|
|targets|`document.getElementsByTagName('form')`|A list of form elements.|


## API instructions

- Basically, SDK uses a global namespace `Ingestly`.
- A custom event `ingestlyRecurringEvent` (or your specified name in `config()`) can be used for observing elements repeatedly.

### Ingestly.config(config)

- A method for configuration. See Configuration and Options section in this page.

### Ingestly.init(dataModel)

- Initialization for the page.
- The method defines the page level variables such as page URL, title, referrer, etc...
- If your web site is SPA, you should call this method on each page update.
- A parameter `dataModel` must be an object. You can add custom variables if you define BigQuery's schema and Log Format for Fastly.

### Ingestly.trackPage(eventContext)

- Send a beacon for pageview event.
- You can pass the custom variables, or you can overwrite variables you passed at `Init()`.

### Ingestly.trackAction(action, category, eventContext)

- Send a custom beacon on your preferred events.

### Ingestly.setConsent(acceptance)

- Save the acceptance status for purpose of data use such as "cookie", "measurement", "analytics" or any other your own categorization.
- If you set `cookie` as Boolean type, you can control the SDK to use Cookie or not per a browser.
- If you set `false` to `measurement`, the SDK will not send beacons.
- Values will be set as a Cookie by the endpoint.

|key|description|
|:----|:----|
|cookie|reserved for Cookie control.|
|measurement|reserved to enable/disable data transmission.|
|analytics||
|personalization||
|advertisement||
|sharing||

### Ingestly.getQueryVal(keyName)

- This method retrieves a value from GET parameter of URL by specifying a key name.
- If the URL does not have a key-value pair for specified key name, the method returns an empty string `''`.
- Note that this method does not parse the URL each time. An object containing the parsed key-value pairs based on URL is generated on `init()`, and the method just returns the value from the object. So, if your SPA updates URL parameter, and you want to use it for measurement, you need to call `init()` or do not use this method.