let targetWindow, managedEvents = {}, handlerKey = 0;

/**
 * @ignore
 */
export default class {
    constructor(config) {
        let event, timer;
        targetWindow = config.targetWindow;

        try {
            event = new CustomEvent(config.eventName);
        } catch (e) {
            event = targetWindow.document.createEvent('CustomEvent');
            event.initCustomEvent(config.eventName, false, false, {});
        }

        targetWindow.requestAnimationFrame = targetWindow.requestAnimationFrame
            || targetWindow.mozRequestAnimationFrame
            || targetWindow.webkitRequestAnimationFrame;

        (function recurringEvent() {
            targetWindow.requestAnimationFrame(recurringEvent);
            if (timer) {
                return false;
            }
            timer = setTimeout( () => {
                targetWindow.dispatchEvent(event);
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