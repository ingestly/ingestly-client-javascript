/**
 * @ignore
 */
export default class {
    getPerformanceInfo(targetWindow) {
        if ('navigation' in window[targetWindow].performance && 'timing' in window[targetWindow].performance) {
            const timing = window[targetWindow].performance.timing,
                nav = window[targetWindow].performance.navigation,
                tti = timing.domInteractive - timing.domLoading,
                dcl = timing.domContentLoadedEventStart - timing.domLoading,
                complete = timing.domComplete - timing.domLoading,
                elapsedMs = +new Date() - timing.domLoading;
            return {
                ptTti: tti >= 0 ? tti : undefined,
                ptDcl: dcl >= 0 ? dcl : undefined,
                ptComplete: complete >= 0 ? complete : undefined,
                ptElapsedMs: elapsedMs >= 0 ? elapsedMs : undefined,
                nvType: nav.type,
                nvRdCnt: nav.redirectCount,
            };
        } else {
            return {};
        }
    }

    getClientInfo(targetWindow) {
        const ua = navigator.userAgent;
        let orientation = screen.orientation || screen.mozOrientation || screen.msOrientation || 'not-supported';
        if (typeof orientation === 'object') {
            orientation = orientation.type;
        }
        let deviceType, deviceOs;
        if (ua.match(/iPhone|iPod/g)) {
            deviceOs = 'iOS';
            deviceType = 'Mobile';
        } else if (ua.match(/iPad/g)) {
            deviceOs = 'iOS';
            deviceType = 'Tablet';
        } else if (ua.match(/Android/g)) {
            if (ua.match(/Windows Phone/g)) {
                deviceOs = 'Windows Phone';
                deviceType = 'Mobile';
            } else {
                deviceOs = 'Android';
                if (ua.match(/Mobile/g)) {
                    deviceType = 'Mobile';
                } else {
                    deviceType = 'Tablet';
                }
            }
        } else if (ua.match(/Windows/g)) {
            deviceOs = 'Windows';
            deviceType = 'Desktop';
        } else if (ua.match(/Mac OS X/g)) {
            deviceOs = 'Mac OS X';
            deviceType = 'Desktop';
        } else if (ua.match(/Linux/g)) {
            deviceOs = 'Linux';
            deviceType = 'Desktop';
        } else if (ua.match(/CrOS/g)) {
            deviceOs = 'Chrome OS';
            deviceType = 'Desktop';
        } else if (ua.match(/Nintendo|PlayStation|Xbox/g)) {
            deviceOs = 'Other';
            deviceType = 'Game';
        } else {
            deviceOs = 'Other';
            deviceType = 'Unknown';
        }

        return {
            vpHeight: window[targetWindow].innerHeight,
            vpWidth: window[targetWindow].innerWidth,
            scHeight: window[targetWindow].screen.height,
            scWidth: window[targetWindow].screen.width,
            scOrientation: orientation,
            dvType: deviceType,
            dvOs: deviceOs,
            dvPlatform: navigator.platform,
        };
    }

    getMediaInfo(element) {
        if (element) {
            return {
                mdSrc: element.src,
                mdCurrentTime: Math.round(element.currentTime * 10) / 10,
                mdDuration: Math.round(element.duration * 10) / 10,
                mdPlayedPercent: Math.round((element.currentTime / element.duration) * 1000) / 10,
                mdAttr: {
                    type: element.type || undefined,
                    width: element.clientWidth || undefined,
                    height: element.clientHeight || undefined,
                    muted: element.muted || false,
                    defaultMuted: element.defaultMuted || false,
                    autoplay: element.autoplay || false,
                    playerId: element.playerId || undefined,
                    dataset: element.dataset,
                },
            };
        } else {
            return false;
        }
    }

    getFormStats(formDetail, targetEvent, targetElement, initTimestamp) {
        const elementName = targetElement.name || targetElement.id || '-';
        let valueLength = 0;
        if (targetElement.tagName.toLowerCase() === 'select') {
            for (let i = 0; i < targetElement.length; i++) {
                targetElement[i].selected ? valueLength++ : false;
            }
        } else if (
            targetElement.tagName.toLowerCase() === 'input' &&
            (targetElement.type === 'checkbox' || targetElement.type === 'radio')
        ) {
            valueLength = targetElement.checked ? 1 : 0;
        } else {
            valueLength = targetElement.value.length;
        }
        if (targetElement.type !== 'hidden') {
            formDetail.fmItems[elementName] = {
                status: targetEvent,
                length: valueLength,
            };
        }
        if (!formDetail.fmFirstItem) {
            formDetail.fmFirstItem = targetElement.name || targetElement.id || '-';
            formDetail.fmStartedSinceInitMs = +new Date() - initTimestamp;
        }
        formDetail.fmLastItem = targetElement.name || targetElement.id || '-';
        formDetail.fmEndedSinceInitMs = +new Date() - initTimestamp;
        formDetail.fmDurationMs = formDetail.fmEndedSinceInitMs - formDetail.fmStartedSinceInitMs;
        return formDetail;
    }

    getVisibility(targetElement, targetWindow) {
        let textLength = 0,
            targetRect = {};
        try {
            targetRect = targetElement.getBoundingClientRect();
            textLength = targetElement.innerText.length;
        } catch (e) {
            targetRect = {};
        }

        const viewportHeight = window[targetWindow].innerHeight;
        const documentHeight = window[targetWindow].document.documentElement.scrollHeight;
        const documentIsVisible = window[targetWindow].document.visibilityState || 'unknown';
        const documentVisibleTop =
            'pageYOffset' in window[targetWindow]
                ? window[targetWindow].pageYOffset
                : (
                      window[targetWindow].document.documentElement ||
                      window[targetWindow].document.body.parentNode ||
                      window[targetWindow].document.body
                  ).scrollTop;
        const documentVisibleBottom = documentVisibleTop + viewportHeight;
        const targetHeight = targetRect.height;
        const targetMarginTop = targetRect.top <= 0 ? 0 : targetRect.top;
        const targetMarginBottom =
            (targetRect.bottom - viewportHeight) * -1 <= 0 ? 0 : (targetRect.bottom - viewportHeight) * -1;
        const documentScrollUntil = documentVisibleBottom;
        const documentScrollRate = documentVisibleBottom / documentHeight;

        let targetVisibleTop = null,
            targetVisibleBottom = null,
            isInView = false;

        if (targetRect.top >= 0 && targetRect.bottom > viewportHeight && targetRect.top >= viewportHeight) {
            // pre
            targetVisibleTop = null;
            targetVisibleBottom = null;
            isInView = false;
        } else if (targetRect.top >= 0 && targetRect.bottom > viewportHeight && targetRect.top < viewportHeight) {
            // top
            targetVisibleTop = 0;
            targetVisibleBottom = viewportHeight - targetRect.top;
            isInView = true;
        } else if (targetRect.top < 0 && targetRect.bottom > viewportHeight) {
            // middle
            targetVisibleTop = targetRect.top * -1;
            targetVisibleBottom = targetVisibleTop + viewportHeight;
            isInView = true;
        } else if (targetRect.top >= 0 && targetRect.bottom <= viewportHeight) {
            // all in
            targetVisibleTop = 0;
            targetVisibleBottom = targetHeight;
            isInView = true;
        } else if (targetRect.top < 0 && targetRect.bottom >= 0 && targetRect.bottom <= viewportHeight) {
            // bottom
            targetVisibleTop = targetHeight + targetRect.top;
            targetVisibleBottom = targetHeight;
            isInView = true;
        } else if (targetRect.top < 0 && targetRect.bottom < 0) {
            // post
            targetVisibleTop = null;
            targetVisibleBottom = null;
            isInView = false;
        } else {
            isInView = false;
        }
        return {
            dHeight: documentHeight,
            dIsVisible: documentIsVisible,
            dVisibleTop: documentVisibleTop,
            dVisibleBottom: documentVisibleBottom,
            dScrollUntil: documentScrollUntil,
            dScrollRate: documentScrollRate,
            tHeight: targetHeight,
            tVisibleTop: targetVisibleTop,
            tVisibleBottom: targetVisibleBottom,
            tMarginTop: targetMarginTop,
            tMarginBottom: targetMarginBottom,
            tScrollUntil: targetVisibleBottom,
            tScrollRate: targetVisibleBottom / targetHeight,
            tViewableRate: (targetVisibleBottom - targetVisibleTop) / targetHeight,
            tIsInView: isInView,
            tLength: textLength,
        };
    }

    queryMatch(selector, target, targetFlag = 'data-trackable') {
        let element,
            category = 'button',
            p = [];
        if (target.nodeType === 3) {
            target = target.parentNode;
        }
        while (target && target !== window.parent.document) {
            let matches = (
                target.matches ||
                target.msMatchesSelector ||
                function() {
                    return false;
                }
            ).bind(target);
            if (target.hasAttribute(targetFlag)) {
                p.unshift(target.getAttribute(targetFlag));
            }
            if (!element && matches(selector)) {
                if (target.tagName.toLowerCase() === 'a') {
                    category = 'link';
                } else {
                    category = target.tagName.toLowerCase();
                }
                element = target;
            }
            target = target.parentNode;
        }
        if (element && p.length > 0) {
            return {
                element: element,
                category: category,
                path: p.join('>'),
            };
        } else {
            return false;
        }
    }

    mergeObj(objArray) {
        let obj = {};
        for (let i = 0; i < objArray.length; i++) {
            for (let k in objArray[i]) {
                if (typeof objArray[i][k] === 'object' && objArray[i][k] !== null && !Array.isArray(objArray[i][k])) {
                    obj[k] = obj[k] ? this.mergeObj([obj[k], objArray[i][k]]) : objArray[i][k];
                } else if (Array.isArray(objArray[i][k])) {
                    obj[k] = obj[k] ? obj[k].concat(objArray[i][k]) : objArray[i][k];
                } else {
                    obj[k] = objArray[i][k];
                }
            }
        }
        return obj;
    }

    parseUrl(url) {
        let query,
            result = {},
            parser = document.createElement('a');
        if (url) {
            parser.href = url;
            query = parser.search
                .slice(1)
                .split('&')
                .reduce((obj, val) => {
                    let pair = val.split('=');
                    obj[pair[0]] = pair[1];
                    return obj;
                }, {});
            result = {
                Protocol: parser.protocol,
                Host: parser.hostname,
                Port: parser.port,
                Path: parser.pathname,
                Search: parser.search,
                Hash: parser.hash,
                Query: query,
            };
        }
        return result;
    }
}
