import Emitter from './emitter';
import Events from './events';
import Utils from './utils';

const sdkVersion = '1.0.1',
    initTimestamp = +new Date();

let config,
    targetWindow,
    consent,
    emitter,
    events,
    utils,
    parsedUrl,
    parsedReferrer,
    unloadEvent,
    eventHandlerKeys = { media: [], form: [] },
    prevTimestamp = initTimestamp;

/**
 * @ignore
 */
export default class Ingestly {
    constructor() {
        this.dataModel = {};
        this.trackReadTargets = [];
        this.trackFormTargets = [];
    }

    /**
     * Configure Ingestly SDK.
     * @param  {Object} configObj Configuration variables.
     */
    config(configObj) {
        config = configObj;
        utils = new Utils();
        emitter = new Emitter(config.endpoint);
        targetWindow = config.targetWindow || 'self';
        parsedUrl = utils.parseUrl(window[targetWindow].document.location.href);
        parsedReferrer = utils.parseUrl(window[targetWindow].document.referrer);
        if ('onbeforeunload' in window[targetWindow]) {
            unloadEvent = 'beforeunload';
        } else if ('onpagehide' in window[targetWindow]) {
            unloadEvent = 'pagehide';
        } else {
            unloadEvent = 'unload';
        }
    }

    /**
     * Initialize a page level variables.
     * @param  {Object} dataModel Data model.
     */
    init(dataModel = {}) {
        this.dataModel = dataModel;
        this.dataModel['key'] = config.apiKey;
        this.dataModel['sdk'] = `JS-${sdkVersion}`;

        try {
            consent = JSON.parse(decodeURIComponent(utils.readCookie('ingestlyConsent')));
        } catch (e) {
            consent = {};
        }

        for (let key in parsedUrl) {
            this.dataModel[`ur${key}`] = parsedUrl[key];
        }
        for (let key in parsedReferrer) {
            this.dataModel[`rf${key}`] = parsedReferrer[key];
        }

        if (typeof events === 'undefined') {
            events = new Events({
                en: config.eventName,
                ef: config.eventFrequency,
                tw: targetWindow,
            });
        }

        if (config.options) {
            if (config.options.rum && config.options.rum.enable) {
                if (
                    window[targetWindow].document.readyState === 'interactive' ||
                    window[targetWindow].document.readyState === 'complete'
                ) {
                    this.trackAction('rum', 'page', {});
                } else {
                    this.trackPerformance();
                }
            }

            if (config.options.unload && config.options.unload.enable) {
                this.trackUnload();
            }

            if (config.options.scroll && config.options.scroll.enable) {
                this.trackScroll();
            }

            if (config.options.read && config.options.read.enable) {
                this.trackReadTargets = [].slice.call(config.options.read.targets);
                this.trackRead();
            }

            if (config.options.clicks && config.options.clicks.enable) {
                this.trackClicks();
            }

            if (config.options.media && config.options.media.enable) {
                this.trackMedia();
            }

            if (config.options.form && config.options.form.enable) {
                this.trackFormTargets = [].slice.call(config.options.form.targets);
                this.trackForm();
            }
        }
    }

    /**
     * Consent Management
     * @param  {Object} acceptance consent status for each purpose of data utilization.
     */
    setConsent(acceptance = {}) {
        let optOut = 0;
        if (acceptance['cookie'] === false) {
            optOut = 1;
            consent['cookie'] = false;
        } else {
            consent['cookie'] = acceptance['cookie'] ? acceptance['cookie'] : config.useCookie;
        }
        if (acceptance['measurement'] === false) {
            consent['measurement'] = false;
        } else {
            consent['measurement'] = true;
        }
        consent['measurement'] = !acceptance['measurement'];
        emitter.emit('consent', {
            key: config.apiKey,
            dc: optOut,
            ap: encodeURIComponent(JSON.stringify(acceptance)),
        });
    }

    /**
     * Track an event with additional data.
     * @param  {String} action Action name.
     * @param  {String} category Category name.
     * @param  {Object} eventContext Additional data.
     */
    trackAction(action = 'unknown', category = 'unknown', eventContext = {}) {
        const now = +new Date();
        const mandatory = {
            action: action,
            category: category,
            sinceInitMs: now - initTimestamp,
            sincePrevMs: now - prevTimestamp,
            consent: consent,
        };
        let payload = utils.mergeObj([
            this.dataModel,
            mandatory,
            eventContext,
            utils.getClientInfo(targetWindow),
            'performance' in window[targetWindow] ? utils.getPerformanceInfo(targetWindow) : {},
        ]);

        if (consent['cookie'] === true) {
            payload['ck'] = true;
        } else if (consent['cookie'] === false) {
            payload['ck'] = false;
        } else {
            payload['ck'] = config.useCookie ? true : false;
        }

        prevTimestamp = now;
        if (consent['measurement'] !== false) {
            emitter.emit('ingest', payload);
        }
    }

    /**
     * Track a pageview event.
     * @param  {Object} eventContext Additional data.
     */
    trackPage(eventContext = {}) {
        this.trackAction('view', 'page', eventContext);
    }

    /**
     * Add a tracker to the onload event.
     */
    trackPerformance(eventContext = {}) {
        events.removeListener(eventHandlerKeys['performance']);
        eventHandlerKeys['performance'] = events.addListener(
            window[targetWindow].document,
            'DOMContentLoaded',
            () => {
                this.trackAction('rum', 'page', eventContext);
            },
            false
        );
    }

    /**
     * Add a tracker to the unload event.
     */
    trackUnload(eventContext = {}) {
        events.removeListener(eventHandlerKeys['unload']);
        eventHandlerKeys['unload'] = events.addListener(
            window[targetWindow],
            unloadEvent,
            () => {
                this.trackAction('unload', 'page', eventContext);
            },
            false
        );
    }

    /**
     * Add a tracker to the click event.
     */
    trackClicks(eventContext = {}) {
        events.removeListener(eventHandlerKeys['click']);
        eventHandlerKeys['click'] = events.addListener(
            window[targetWindow].document.body,
            'click',
            clickEvent => {
                const targetAttribute = config.options.clicks.targetAttr || false;
                const trackableElement = utils.queryMatch(
                    'a, button, [role="button"]',
                    clickEvent.target,
                    targetAttribute,
                    targetWindow
                );
                let element = null;
                if (trackableElement) {
                    element = trackableElement.element;
                    let metaContext = {
                        clTag: element.tagName,
                        clId: element.id || undefined,
                        clClass: element.className || undefined,
                        clPath: trackableElement.path || undefined,
                        clLink: element.href || undefined,
                        clText: element.innerText || element.value || undefined,
                        clAttr: element.dataset || undefined,
                    };
                    this.trackAction('click', trackableElement.category, utils.mergeObj([metaContext, eventContext]));
                }
            },
            false
        );
    }

    /**
     * Start scroll observation by using custom event
     */
    trackScroll(eventContext = {}) {
        const each = config.options.scroll.granularity || 20;
        const steps = 100 / each;
        const limit = config.options.scroll.threshold * 1000 || 2 * 1000;
        let result = {},
            currentVal = 0,
            prevVal = 0,
            scrollUnit = 'percent';
        events.removeListener(eventHandlerKeys['scroll']);
        eventHandlerKeys['scroll'] = events.addListener(
            window[targetWindow],
            config.eventName,
            () => {
                result = utils.getVisibility(null, targetWindow);
                if (result.dIsVisible !== 'hidden' && result.dIsVisible !== 'prerender') {
                    if (config.options.scroll.unit === 'percent') {
                        currentVal = Math.floor(result.dScrollRate * steps) * each;
                    } else {
                        currentVal = result.dScrollUntil;
                        scrollUnit = 'pixel';
                    }

                    if (
                        (scrollUnit === 'percent' && currentVal > prevVal && currentVal >= 0 && currentVal <= 100) ||
                        (scrollUnit === 'pixel' && currentVal > prevVal && currentVal >= each)
                    ) {
                        setTimeout(() => {
                            if (currentVal > prevVal) {
                                let metaContext = {
                                    pgH: result.dHeight,
                                    srDepth: currentVal,
                                    srUnit: scrollUnit,
                                };
                                this.trackAction('scroll', 'page', utils.mergeObj([metaContext, eventContext]));
                                prevVal = scrollUnit === 'percent' ? currentVal : currentVal + each;
                            }
                        }, limit);
                    }
                }
            },
            false
        );
    }

    /**
     * Start Read-Through Rate observation by using custom event
     */
    trackRead(eventContext = {}) {
        if (!this.trackReadTargets || this.trackReadTargets.length === 0) {
            return;
        }
        const each = config.options.read.granularity || 20;
        const steps = 100 / each;
        const limit = config.options.read.threshold * 1000 || 2 * 1000;
        let results = [],
            currentVals = [],
            prevVals = [];
        events.removeListener(eventHandlerKeys['read']);
        eventHandlerKeys['read'] = events.addListener(
            window[targetWindow],
            config.eventName,
            () => {
                for (let i = 0; i < this.trackReadTargets.length; i++) {
                    currentVals[i] = currentVals[i] || 0;
                    prevVals[i] = prevVals[i] || 0;
                    results[i] = utils.getVisibility(this.trackReadTargets[i], targetWindow);
                    if (
                        results[i].dIsVisible !== 'hidden' &&
                        results[i].dIsVisible !== 'prerender' &&
                        results[i].tIsInView
                    ) {
                        currentVals[i] = Math.floor(results[i].tScrollRate * steps) * each;
                        if (currentVals[i] > prevVals[i] && currentVals[i] >= 0 && currentVals[i] <= 100) {
                            setTimeout(() => {
                                if (currentVals[i] > prevVals[i] && this.trackReadTargets[i]) {
                                    let metaContext = {
                                        rdIdx: i,
                                        rdId: this.trackReadTargets[i].id || undefined,
                                        rdTxS: this.trackReadTargets[i].innerText.substring(0, 12) || undefined,
                                        rdTgH: results[i].tHeight,
                                        rdTxL: results[i].tLength,
                                        rdRate: currentVals[i],
                                        rdAttr: this.trackReadTargets[i].dataset || undefined,
                                    };
                                    this.trackAction('read', 'content', utils.mergeObj([metaContext, eventContext]));
                                    if (currentVals[i] === 100) {
                                        this.trackReadTargets.splice(i, 1);
                                    }
                                    prevVals[i] = currentVals[i];
                                }
                            }, limit);
                        }
                    }
                }
            },
            false
        );
    }

    /**
     * Set eventListeners for Media Tracking
     */
    trackMedia(eventContext = {}) {
        const targetEvents = ['play', 'pause', 'ended'];
        const heartbeat = config.options.media.heartbeat || 5;
        let flags = {};
        for (let i = 0; i < targetEvents.length; i++) {
            events.removeListener(eventHandlerKeys['media'][targetEvents[i]]);
            eventHandlerKeys['media'][targetEvents[i]] = events.addListener(
                window[targetWindow].document.body,
                targetEvents[i],
                event => {
                    let metaContext = utils.getMediaInfo(event.target);
                    this.trackAction(
                        event.type,
                        event.target.tagName.toLowerCase(),
                        utils.mergeObj([metaContext, eventContext])
                    );
                },
                { capture: true }
            );
        }

        events.removeListener(eventHandlerKeys['media']['timeupdate']);
        eventHandlerKeys['media']['timeupdate'] = events.addListener(
            window[targetWindow].document,
            'timeupdate',
            event => {
                if (flags[event.target.src]) {
                    return false;
                }
                flags[event.target.src] = setTimeout(() => {
                    if (event.target.paused !== true && event.target.ended !== true) {
                        let metaContext = utils.getMediaInfo(event.target);
                        this.trackAction(
                            event.type,
                            event.target.tagName.toLowerCase(),
                            utils.mergeObj([metaContext, eventContext])
                        );
                    }
                    flags[event.target.src] = false;
                }, heartbeat * 1000);
            },
            { capture: true }
        );
    }

    /**
     * Measure stats for form completion
     */
    trackForm(eventContext = {}) {
        if (!this.trackFormTargets || this.trackFormTargets.length === 0) {
            return;
        }
        const targetEvents = ['focus', 'change'];
        for (let i = 0; i < this.trackFormTargets.length; i++) {
            let metaContext = {
                fmName: this.trackFormTargets[i].name || this.trackFormTargets[i].id || '-',
                fmAttr: this.trackFormTargets[i].dataset,
                fmItems: {},
            };
            for (let j = 0; j < targetEvents.length; j++) {
                events.removeListener(eventHandlerKeys['form'][targetEvents[j]]);
                eventHandlerKeys['form'][targetEvents[j]] = events.addListener(
                    this.trackFormTargets[i],
                    targetEvents[j],
                    event => {
                        metaContext = utils.getFormStats(metaContext, targetEvents[j], event.target, initTimestamp);
                    },
                    true
                );
            }
            events.removeListener(eventHandlerKeys['form_emit']);
            eventHandlerKeys['form_emit'] = events.addListener(
                window[targetWindow],
                unloadEvent,
                () => {
                    this.trackAction('stats', 'form', utils.mergeObj([metaContext, eventContext]));
                },
                false
            );
        }
    }

    /**
     * Get a value for specified key name in GET parameter.
     * @param  {String} key A key name.
     * @return {String} A value for the specified key.
     */
    getQueryVal(key) {
        return parsedUrl.Query[key] ? parsedUrl.Query[key] : '';
    }
}
