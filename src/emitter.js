const generateId = () => {
    const timestamp = (+new Date()).toString(36);
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${timestamp}-${result}`;
};

const xhr = (url, callback) => {
    let xhr = new XMLHttpRequest();
    if (typeof callback === 'function') {
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && xhr.status === 200) {
                let obj;
                try {
                    obj = JSON.parse(xhr.response);
                } catch (e) {
                    return e;
                }
                callback.call(null, obj);
            }
        };
    }
    xhr.open('GET', url, true);
    xhr.timeout = 4000;
    xhr.withCredentials = true;
    try {
        xhr.send();
    } catch (e) {}

    return true;
};

const generateDestination = (feature, payload) => {
    let url = `https://${endpoint}/ingestly-${feature}/${(+new Date()).toString(36)}/`;
    url += `?rootId=${rootId}`;
    for (let key in payload) {
        url += generateParamPair(key, payload[key]);
    }
    return url;
};

const generateParamPair = (key, val) => {
    if (typeof val === 'object') {
        val = JSON.stringify(val);
    }
    if (typeof val !== 'undefined' && val !== '' && val !== '{}') {
        return `&${key}=${encodeURIComponent(val)}`;
    } else {
        return '';
    }
};

let endpoint,
    rootId,
    status = true;

/**
 * @ignore
 */
export default class {
    constructor(ep) {
        rootId = generateId();
        endpoint = ep;
    }

    emit(feature, payload) {
        const url = generateDestination(feature, payload);
        if ('sendBeacon' in navigator && typeof navigator.sendBeacon === 'function' && status === true) {
            try {
                status = navigator.sendBeacon(url);
            } catch (error) {
                status = false;
            }
            if (!status) {
                if (typeof window.fetch === 'function' && typeof window.AbortController === 'function') {
                    const controller = new AbortController();
                    const signal = controller.signal;
                    const option = { signal, method: 'POST', cache: 'no-store', keepalive: true };
                    setTimeout(() => controller.abort(), 4000);
                    try {
                        window.fetch(url, option);
                    } catch (e) {}
                } else {
                    xhr(url);
                }
            }
        } else {
            xhr(url);
        }
    }
}
