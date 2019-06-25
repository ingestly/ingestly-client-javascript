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
        let url = generateDestination('ingestly-ingest'),
            obj = {
                ingestlyId: config.deviceId,
                rootId: config.rootId,
                action: payload.action,
                category: payload.category,
                sinceInitMs: payload.sinceInitMs,
                sincePrevMs: payload.sincePrevMs,
                usId: payload.userId,
                usStatus: payload.userStatus,
                usAttr: JSON.stringify(payload.userAttr),
                pgUrl: payload.pageUrl,
                pgReferrer: payload.pageReferrer,
                pgTitle: payload.pageTitle,
                pgAttr: JSON.stringify(payload.pageAttr),
                cnId: payload.contentId,
                cnHeadline: payload.contentHeadline,
                cnStatus: payload.contentStatus,
                cnAttr: JSON.stringify(payload.contentAttr),
                vpHeight: payload.client.vpH,
                vpWidth: payload.client.vpW,
                scHeight: payload.client.scH,
                scWidth: payload.client.scW,
                scOrientation: payload.client.scOrientation,
                dvType: payload.client.dvType,
                dvOs: payload.client.dvOs,
                dvPlatform: payload.client.dvPlatform,
                ptInteractive: payload.pt ? payload.pt.interactive : undefined,
                ptDcl: payload.pt ? payload.pt.dcl : undefined,
                ptComplete: payload.pt ? payload.pt.complete : undefined,
                srDepth: payload.srDepth,
                srUnit: payload.srUnit,
                pgHeight: payload.pgH,
                rdRate: payload.rdRate,
                txLength: payload.txL,
                ctHeight: payload.tgH,
                clTag: payload.clTag,
                clId: payload.clId,
                clClass: payload.clClass,
                clPath: payload.clPath,
                clLink: payload.clLink,
                clAttr: JSON.stringify(payload.clAttr),
                mdSrc: payload.mdSrc,
                mdCurrentTime: payload.mdCurrentTime,
                mdDuration: payload.mdDuration,
                mdPlayedPercent: payload.mdPlayedPercent,
                mdAttr: JSON.stringify(payload.mdAttr),
                cpCode: payload.campaignCode,
                cpName: payload.campaignName,
                cpSource: payload.campaignSource,
                cpMedium: payload.campaignMedium,
                cpTerm: payload.campaignTerm,
                cpContent: payload.campaignContent,
                urProtocol: payload.pur.protocol,
                urHost: payload.pur.hostname,
                urPath: payload.pur.pathname,
                urSearch: payload.pur.search,
                urHash: payload.pur.hash,
                urQuery: JSON.stringify(payload.pur.query),
                rfProtocol: payload.prf.protocol,
                rfHost: payload.prf.hostname,
                rfPath: payload.prf.pathname,
                rfSearch: payload.prf.search,
                rfHash: payload.prf.hash,
                rfQuery: JSON.stringify(payload.prf.query),
                customAttr: JSON.stringify(payload.customAttr)
            };

        for (let key in obj) {
            url += generateParamPair(key, obj[key]);
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

