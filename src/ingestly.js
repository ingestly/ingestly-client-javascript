import Emitter from './emitter';
import Events from './events';
import IDM from './idm';
import Utils from './utils';

const
    sdkName = 'JS',
    sdkVersion = '0.1.0',
    initTimestamp = new Date();

let idm, emitter, events, utils,
    eventHandlerKeys = {},
    prevTimestamp = new Date();

export default class Ingestly {
    constructor() {
        this.dataModel = {};
        utils = new Utils();
    }

    init(config, dataModel = {}) {
        if (typeof idm === 'undefined') {
            idm = new IDM({
                prefix: config.prefix
            });
        }
        if (typeof emitter === 'undefined') {
            emitter = new Emitter({
                endpoint: config.endpoint,
                apiKey: config.apiKey,
                sdkName: sdkName,
                sdkVersion: sdkVersion,
                prefix: config.prefix,
                cookieDomain: config.cookieDomain,
                deviceId: idm.deviceId,
                rootId: idm.rootId
            });
        }

        this.dataModel = dataModel;

        if (config.eventName && config.eventFrequency && typeof events === 'undefined') {
            events = new Events({
                eventName: config.eventName,
                eventFrequency: config.eventFrequency
            });
        }

        if ('performance' in window.parent) {
            if (window.parent.document.readyState === "interactive" || window.parent.document.readyState === "complete") {
                this.trackAction('rum', 'page', {});
            } else {
                events.removeListener(eventHandlerKeys['performance']);
                eventHandlerKeys['performance'] = events.addListener(window.parent.document, 'DOMContentLoaded', () => {
                    this.trackAction('rum', 'page', {});
                }, false);
            }
        }

        if (config.options && config.options.scroll && config.options.scroll.enable) {
            const each = config.options.scroll.granularity || 20;
            const limit = config.options.scroll.threshold * 1000 || 2 * 1000;
            let result = {}, currentVal = 0, prevVal = 0, scrollUnit = 'percent';
            events.removeListener(eventHandlerKeys['scroll']);
            eventHandlerKeys['scroll'] = events.addListener(window.parent, config.eventName, () => {
                result = utils.getScrollDepth();
                if (result.dIsVisible !== 'hidden' && result.dIsVisible !== 'prerender') {
                    if (config.options.scroll.unit === 'percent') {
                        currentVal = Math.round(result.dScrollRate * 100 / each * 100) * each / 100;
                    } else {
                        currentVal = Math.round(result.dScrollUntil * 100) / 100;
                        scrollUnit = 'pixel';
                    }
                    if (currentVal > prevVal && currentVal >= 0) {
                        setTimeout(() => {
                            if (currentVal > prevVal) {
                                this.trackAction('scroll', 'page', {
                                    'pageHeight': result.dHeight,
                                    'scrollDepth': result.dScrollUntil,
                                    'scrollUnit': scrollUnit
                                });
                                prevVal = currentVal;
                            }
                        }, limit);
                    }
                }
            }, false);
        }

        if (config.options && config.options.clicks && config.options.clicks.enable) {
            events.removeListener(eventHandlerKeys['click']);
            eventHandlerKeys['click'] = events.addListener(window.parent.document.body, 'click', (clickEevent) => {
                const targetAttribute = config.options.clicks.targetAttr || 'data-trackable';
                const trackableElement = utils.queryMatch('a, button, input, [role="button"]', clickEevent.target, targetAttribute);
                let element = null;
                if (trackableElement) {
                    element = trackableElement.element;
                    this.trackAction('click', trackableElement.category, {
                        clickTag: element.tagName,
                        clickId: element.id || undefined,
                        clickClass: element.className || undefined,
                        clickPath: trackableElement.path || undefined,
                        clickLink: element.href || undefined,
                        clickAttr: element.dataset || undefined
                    });
                }
            }, false);
        }
    }

    trackAction(action = 'unknown', category = 'unknown', eventContext = {}) {
        const now = new Date();
        const record = utils.mergeObj([
            this.dataModel,
            eventContext,
            {
                action: action,
                category: category,
                client: utils.getClientInfo(),
                performance: utils.getPerformanceInfo(),
                sinceInitMs: now.getTime() - initTimestamp.getTime(),
                sincePrevMs: now.getTime() - prevTimestamp.getTime(),
                parsedUrl: utils.parseUrl(this.dataModel.pageUrl),
                parsedReferrer: utils.parseUrl(this.dataModel.pageReferrer)
            }
        ]);
        prevTimestamp = now;
        emitter.emit(record);

        if (idm.isNewId) {
            emitter.getDeviceId((result) => {
                idm.setDeviceId(result);
                idm.isNewId = false;
            });
        } else {
            idm.setDeviceId(idm.deviceId);
        }
    }

    trackPage(eventContext = {}) {
        this.trackAction('view', 'page', eventContext);
    }

    getQueryVal(key) {
        const search = window.parent.location.search.slice(1);
        let result = '';
        if (search !== '') {
            const q = search.split('&');
            const l = q.length;
            for (let i = 0; i < l; ++i) {
                const pair = q[i].split('=');
                if (decodeURIComponent(pair[0]) === key) {
                    result = decodeURIComponent(pair[1]);
                }
            }
        }
        return result;
    }
}
