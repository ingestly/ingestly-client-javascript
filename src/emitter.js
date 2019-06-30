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

const generateDestination = (feature) => {
    const timestamp = (+new Date).toString(36),
        protocol = (document.location && document.location.protocol === 'https:') ? 'https:' : 'http:';
    return `${protocol}//${config.endpoint}/${feature}/${timestamp}/?key=${config.apiKey}&sdk=${config.sdkName}-${config.sdkVersion}`;
};

const generateParamPair = (key, val) => {
    if(typeof val === 'object'){
        val = JSON.stringify(val);
    }
    if (typeof val !== 'undefined' && val !== '' && val !== '{}') {
        return (`&${key}=${encodeURIComponent(val)}`);
    } else {
        return '';
    }
};

let config, status = true;

/**
 * @ignore
 */
export default class {
    constructor(obj) {
        config = obj;
    }

    emit(payload) {
        let url = generateDestination('ingestly-ingest');
        url += `&ingestlyId=${config.deviceId}`;
        url += `&rootId=${config.rootId}`;

        for (let key in payload) {
            url += generateParamPair(key, payload[key]);
        }

        if ('sendBeacon' in navigator && typeof navigator.sendBeacon === 'function' && status === true) {
            try {
                status = navigator.sendBeacon(url);
            } catch (error) {
                status = false;
            }
            if (!status) {
                if ('fetch' in window[config.target] && typeof window[config.target].fetch === 'function') {
                    const controller = new AbortController();
                    const signal = controller.signal;
                    const option = {signal, method: 'POST', cache: 'no-store', keepalive: true};
                    setTimeout(() => controller.abort(), 4000);
                    window[config.target].fetch(url, option);
                } else {
                    xhr(url);
                }
            }
        } else {
            xhr(url);
        }
    }

    getDeviceId(callback) {
        let url = generateDestination('ingestly-sync');
        url += `&ingestlyId=${config.deviceId}`;
        if ('fetch' in window[config.target] && typeof window[config.target].fetch === 'function' && 'AbortController' in window[config.target] && typeof window[config.target].AbortController === 'function') {
            const controller = new AbortController();
            const signal = controller.signal;
            const option = {signal, method: 'GET', cache: 'no-store', keepalive: true};
            setTimeout(() => controller.abort(), 4000);
            window[config.target].fetch(url, option).then((response) => {
                    return response.json();
                }
            ).then((result) => {
                callback.call(null, result.id);
            });
        } else {
            xhr(url, (result) => {
                callback.call(null, result.id);
            });
        }
    }
}

