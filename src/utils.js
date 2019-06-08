export default class {
    getPerformanceInfo() {
        let timing = window.performance.timing,
            interactive = timing.domInteractive - timing.domLoading,
            dcl = timing.domContentLoadedEventStart - timing.domLoading,
            complete = timing.domComplete - timing.domLoading;
        return {
            interactive: interactive >= 0 ? interactive : undefined,
            dcl: dcl >= 0 ? dcl : undefined,
            complete: complete >= 0 ? complete : undefined
        };
    }

    getClientInfo() {
        const orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
        const ua = navigator.userAgent;
        let deviceType, deviceOs;
        if(ua.match(/iPhone|iPod/g)){
            deviceOs = 'iOS';
            deviceType = 'Mobile';
        }else if(ua.match(/iPad/g)){
            deviceOs = 'iOS';
            deviceType = 'Tablet';
        }else if(ua.match(/Android/g)){
            if(ua.match(/Windows Phone/g)){
                deviceOs = 'Windows Phone';
                deviceType = 'Mobile';
            }else{
                deviceOs = 'Android';
                if(ua.match(/Mobile/g)){
                    deviceType = 'Mobile';
                }else{
                    deviceType = 'Tablet';
                }
            }
        }else if(ua.match(/Windows/g)){
            deviceOs = 'Windows';
            deviceType = 'Desktop';
        }else if(ua.match(/Mac OS X/g)){
            deviceOs = 'Mac OS X';
            deviceType = 'Desktop';
        }else if(ua.match(/Linux/g)){
            deviceOs = 'Linux';
            deviceType = 'Desktop';
        }else if(ua.match(/CrOS/g)){
            deviceOs = 'Chrome OS';
            deviceType = 'Desktop';
        }else if(ua.match(/Nintendo|PlayStation|Xbox/g)){
            deviceOs = 'Other';
            deviceType = 'Game';
        }else{
            deviceOs = 'Other';
            deviceType = 'Unknown';
        }

        return {
            viewportHeight: window.parent.innerHeight,
            viewportWidth: window.parent.innerWidth,
            screenHeight: window.parent.screen.height,
            screenWidth: window.parent.screen.width,
            screenOrientation: orientation,
            deviceType: deviceType,
            deviceOs: deviceOs,
            devicePlatform: navigator.platform
        };
    }

    getScrollDepth() {
        const viewportHeight = window.parent.innerHeight;
        const documentHeight = window.parent.document.documentElement.scrollHeight;
        const documentIsVisible = window.parent.document.visibilityState || 'unknown';
        const documentVisibleTop = 'pageYOffset' in window.parent ?
            window.parent.pageYOffset :
            (window.parent.document.documentElement || window.parent.document.body.parentNode || window.parent.document.body).scrollTop;
        const documentVisibleBottom = documentVisibleTop + viewportHeight;
        const documentScrollUntil = documentVisibleBottom;
        const documentScrollRate = documentVisibleBottom / documentHeight;

        return {
            'dHeight': documentHeight,
            'dIsVisible': documentIsVisible,
            'dVisibleTop': documentVisibleTop,
            'dVisibleBottom': documentVisibleBottom,
            'dScrollUntil': documentScrollUntil,
            'dScrollRate': documentScrollRate
        };
    }

    queryMatch(selector, target, targetFlag = 'data-trackable'){
            let element, category = 'button', p = [];
            if (target.nodeType === 3) {
                target = target.parentNode;
            }
            while (target && target !== window.parent.document) {
                let matches = (target.matches || target.msMatchesSelector || function () {
                    return false;
                }).bind(target);
                if (target.hasAttribute(targetFlag)) {
                    p.unshift(target.getAttribute(targetFlag));
                }
                if (!element && matches(selector)) {
                    if (target.tagName.toLowerCase() === 'a') {
                        category = 'link';
                    }else{
                        category = target.tagName.toLowerCase();
                    }
                    element = target;
                }
                target = target.parentNode;
            }
            if (element && p.length > 0) {
                return {
                    'element': element,
                    'category': category,
                    'path': p.join('>')
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
        let query, result = {}, parser = document.createElement('a');
        if(url){
            parser.href = url;
            query = parser.search.slice(1).split('&').reduce((obj, val) => {
                let pair = val.split('=');
                obj[pair[0]] = pair[1];
                return obj;
            }, {});
            result = {
                protocol: parser.protocol,
                hostname: parser.hostname,
                port: parser.port,
                pathname: parser.pathname,
                search: parser.search,
                hash: parser.hash,
                query: query
            }
        }
        return result;
    }
}