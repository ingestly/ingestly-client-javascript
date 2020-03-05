let managedEvents = {},
    handlerKey = 0;

/**
 * @ignore
 */
export default class {
    constructor(config) {
        let event, timer;
        if (config.en && config.ef > 0) {
            try {
                event = new CustomEvent(config.en);
            } catch (e) {
                event = window[config.tw].document.createEvent('CustomEvent');
                event.initCustomEvent(config.en, false, false, {});
            }

            window[config.tw].requestAnimationFrame =
                window[config.tw].requestAnimationFrame ||
                window[config.tw].mozRequestAnimationFrame ||
                window[config.tw].webkitRequestAnimationFrame;

            (function recurringEvent() {
                window[config.tw].requestAnimationFrame(recurringEvent);
                if (timer) {
                    return false;
                }
                timer = setTimeout(() => {
                    window[config.tw].dispatchEvent(event);
                    timer = null;
                }, config.ef);
            })();
        }
    }

    addListener(element, type, listener, capture) {
        element.addEventListener(type, listener, capture);
        managedEvents[handlerKey] = {
            element: element,
            type: type,
            listener: listener,
            capture: capture,
        };
        return handlerKey++;
    }

    removeListener(handlerKey) {
        if (handlerKey in managedEvents) {
            let event = managedEvents[handlerKey];
            event.element.removeEventListener(event.type, event.listener, event.capture);
        }
    }
}
