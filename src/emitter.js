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
    xhr.timeout = 2000;
    xhr.withCredentials = true;
    xhr.send();
    return true;
};

const generateDestination = (feature) => {
    const timestamp = (+new Date).toString(36),
        protocol = (document.location && document.location.protocol === 'http:') ? 'http:' : 'http:';
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
                vpHeight: payload.client.viewportHeight,
                vpWidth: payload.client.viewportWidth,
                scHeight: payload.client.screenHeight,
                scWidth: payload.client.screenWidth,
                scOrientation: payload.client.screenOrientation,
                dvType: payload.client.deviceType,
                dvOs: payload.client.deviceOs,
                dvPlatform: payload.client.devicePlatform,
                ptInteractive: payload.performance ? payload.performance.interactive : undefined,
                ptDcl: payload.performance ? payload.performance.dcl : undefined,
                ptComplete: payload.performance ? payload.performance.complete : undefined,
                srDepth: payload.scrollDepth,
                srUnit: payload.scrollUnit,
                pgHeight: payload.pageHeight,
                clTag: payload.clickTag,
                clId: payload.clickId,
                clClass: payload.clickClass,
                clPath: payload.clickPath,
                clLink: payload.clickLink,
                clAttr: JSON.stringify(payload.clickAttr),
                cpCode: payload.campaignCode,
                cpName: payload.campaignName,
                cpSource: payload.campaignSource,
                cpMedium: payload.campaignMedium,
                cpTerm: payload.campaignTerm,
                cpContent: payload.campaignContent,
                urProtocol: payload.parsedUrl.protocol,
                urHost: payload.parsedUrl.hostname,
                urPath: payload.parsedUrl.pathname,
                urSearch: payload.parsedUrl.search,
                urHash: payload.parsedUrl.hash,
                urQuery: JSON.stringify(payload.parsedUrl.query),
                rfProtocol: payload.parsedReferrer.protocol,
                rfHost: payload.parsedReferrer.hostname,
                rfPath: payload.parsedReferrer.pathname,
                rfSearch: payload.parsedReferrer.search,
                rfHash: payload.parsedReferrer.hash,
                rfQuery: JSON.stringify(payload.parsedReferrer.query),
                customAttr: JSON.stringify(payload.customAttr)
            };

        for (let key in obj) {
            url += generateParamPair(key, obj[key]);
        }

        if ('sendBeacon' in navigator && typeof navigator.sendBeacon === 'function' && status === true) {
            try {
                status = navigator.sendBeacon(url, null);
            } catch (error) {
                status = false;
            }
            if (!status) {
                xhr(url);
            }
        } else {
            xhr(url);
        }
    }

    getDeviceId(callback) {
        let url = generateDestination('ingestly-sync');
        url += `&deviceId=${config.deviceId}`;
        if ('fetch' in window.parent && typeof window.parent.fetch === 'function') {
            window.parent.fetch(url).then((response) => {
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

