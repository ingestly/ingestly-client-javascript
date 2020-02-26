let managedEvents = {},
    handlerKey = 0;

/**
 * @ignore
 */
export default class {
    constructor(config) {
        let event, timer;
        if (config.eventName && config.eventFrequency > 0) {
            try {
                event = new CustomEvent(config.eventName);
            } catch (e) {
                event = window.top.document.createEvent('CustomEvent');
                event.initCustomEvent(config.eventName, false, false, {});
            }

            window.top.requestAnimationFrame =
                window.top.requestAnimationFrame ||
                window.top.mozRequestAnimationFrame ||
                window.top.webkitRequestAnimationFrame;

            (function recurringEvent() {
                window.top.requestAnimationFrame(recurringEvent);
                if (timer) {
                    return false;
                }
                timer = setTimeout(() => {
                    window.top.dispatchEvent(event);
                    timer = null;
                }, config.eventFrequency);
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
