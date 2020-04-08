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
    xhr.send();
    return true;
};

const generateDestination = (feature, payload) => {
    const useCookie = config.ck === true ? 1 : 0;
    let url = `https://${config.ep}/${feature}/${(+new Date()).toString(36)}/`;
    url += `?key=${config.ak}`;
    url += `&cookie=${useCookie}`;
    url += `&sdk=JS-${config.sv}`;
    url += `&rootId=${generateId()}`;

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

let config,
    status = true;

/**
 * @ignore
 */
export default class {
    constructor(obj) {
        config = obj;
    }

    emit(url) {
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
                    window.fetch(url, option);
                } else {
                    xhr(url);
                }
            }
        } else {
            xhr(url);
        }
    }

    consentManagement(useCookie, purposes) {
        let url = generateDestination('consent', {
            i: useCookie === true ? 1 : 0,
            p: JSON.stringify(purposes),
        });
        this.emit(url);
    }

    ingest(payload) {
        let url = generateDestination('ingest', payload);
        this.emit(url);
    }
}
