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

const generateDestination = (feature, payload, deviceId, rootId) => {
    const timestamp = (+new Date()).toString(36);
    let url = `https://${config.ep}/${feature}/${timestamp}/`;
    url += `?key=${config.ak}`;
    url += `&sdk=JS-${config.sv}`;
    url += `&ingestlyId=${deviceId}`;
    url += `&rootId=${rootId}`;

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

    emit(payload) {
        let url = generateDestination('ingestly-ingest', payload, config.di, config.ri);
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

    sync(payload, callback) {
        let url = generateDestination('ingestly-sync', payload, config.di, config.ri);
        if (typeof window.fetch === 'function' && typeof window.AbortController === 'function') {
            const controller = new AbortController();
            const signal = controller.signal;
            const option = { signal, method: 'GET', cache: 'no-store', keepalive: true };
            setTimeout(() => controller.abort(), 4000);
            window
                .fetch(url, option)
                .then(response => {
                    return response.json();
                })
                .then(result => {
                    callback.call(null, result.id);
                });
        } else {
            xhr(url, result => {
                callback.call(null, result.id);
            });
        }
    }
}
