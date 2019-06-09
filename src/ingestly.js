import Emitter from './emitter';
import Events from './events';
import IDM from './idm';
import Utils from './utils';

const
    sdkName = 'JS',
    sdkVersion = '0.2.0',
    initTimestamp = new Date();

let idm, emitter, events, utils, parsedUrl, parsedReferrer,
    eventHandlerKeys = {media: []},
    prevTimestamp = new Date();

export default class Ingestly {
    constructor() {
        this.dataModel = {};
        utils = new Utils();
        parsedUrl = utils.parseUrl(window.parent.document.location.href);
        parsedReferrer = utils.parseUrl(window.parent.document.referrer);
    }

    init(config, dataModel = {}) {
        idm = new IDM({
            prefix: config.prefix
        });
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

        this.dataModel = dataModel;
        this.dataModel['pur'] = parsedUrl;
        this.dataModel['prf'] = parsedReferrer;


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

        if (config.options && config.options.unload && config.options.unload.enable) {
            let unloadEvent;
            if ('onbeforeunload' in window.parent) {
                unloadEvent = 'beforeunload';
            } else if ('onpagehide' in window.parent) {
                unloadEvent = 'pagehide';
            } else {
                unloadEvent = 'unload';
            }
            events.removeListener(eventHandlerKeys['unload']);
            eventHandlerKeys['unload'] = events.addListener(window.parent, unloadEvent, () => {
                this.trackAction('unload', 'page', {});
            }, false);
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
                                    'pgH': result.dHeight,
                                    'srDepth': result.dScrollUntil,
                                    'srUnit': scrollUnit
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
                        clTag: element.tagName,
                        clId: element.id || undefined,
                        clClass: element.className || undefined,
                        clPath: trackableElement.path || undefined,
                        clLink: element.href || undefined,
                        clAttr: element.dataset || undefined
                    });
                }
            }, false);
        }

        if (config.options && config.options.media && config.options.media.enable) {
            const heartbeat = config.options.media.heartbeat || 5;
            const targetEvents = ['play', 'pause', 'ended'];
            let flags = {};
            for (let i = 0; i < targetEvents.length; i++) {
                events.removeListener(eventHandlerKeys['media'][targetEvents[i]]);
                eventHandlerKeys['media'][targetEvents[i]] = events.addListener(window.parent.document.body, targetEvents[i], (event) => {
                    this.trackAction(event.type, event.target.tagName.toLowerCase(), utils.getMediaInfo(event.target));
                }, {capture: true});
            }

            events.removeListener(eventHandlerKeys['media']['timeupdate']);
            eventHandlerKeys['media']['timeupdate'] = events.addListener(window.parent.document, 'timeupdate', (event) => {
                if (flags[event.target.src]) {
                    return false;
                }
                flags[event.target.src] = setTimeout(() => {
                    if (event.target.paused !== true && event.target.ended !== true) {
                        this.trackAction(event.type, event.target.tagName.toLowerCase(), utils.getMediaInfo(event.target));
                    }
                    flags[event.target.src] = false;
                }, heartbeat * 1000);
            }, {capture: true});
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
                pt: utils.getPerformanceInfo(),
                sinceInitMs: now.getTime() - initTimestamp.getTime(),
                sincePrevMs: now.getTime() - prevTimestamp.getTime()
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
        return parsedUrl.query[key] ? parsedUrl.query[key] : '';
    }
}
