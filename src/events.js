let managedEvents = {}, handlerKey = 0;

export default class {
    constructor(config) {
        let event, timer;

        try {
            event = new CustomEvent(config.eventName);
        } catch (e) {
            event = window.parent.document.createEvent('CustomEvent');
            event.initCustomEvent(config.eventName, false, false, {});
        }

        window.parent.requestAnimationFrame = window.parent.requestAnimationFrame
            || window.parent.mozRequestAnimationFrame
            || window.parent.webkitRequestAnimationFrame;

        (function recurringEvent() {
            window.parent.requestAnimationFrame(recurringEvent);
            if (timer) {
                return false;
            }
            timer = setTimeout( () => {
                window.parent.dispatchEvent(event);
                timer = null;
            }, config.eventFrequency);
        })();
    }

    addListener(element, type, listener, capture){
        element.addEventListener(type, listener, capture);
        managedEvents[handlerKey] = {
            element: element,
            type: type,
            listener: listener,
            capture: capture
        };
        return handlerKey++;
    }

    removeListener(handlerKey){
        if (handlerKey in managedEvents) {
            let event = managedEvents[handlerKey];
            event.element.removeEventListener(event.type, event.listener, event.capture);
        }
    }

}