const generateId = () => {
    const timestamp = (+new Date()).toString(36);
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${timestamp}-${result}`;
};

const readCookie = key => {
    const cookies = window.document.cookie || '';
    return (`; ${cookies};`.match(`; ${key}=([^\\S;]*)`) || [])[1];
};

const initDeviceId = () => {
    const idCookie = readCookie(idCacheKey) || '',
        idStorage = localStorage.getItem(idCacheKey) || '';
    let deviceId;

    if (idCookie.length > 8) {
        deviceId = idCookie;
    } else if (idStorage.length > 8) {
        deviceId = idStorage;
    } else {
        deviceId = initialId;
        isNewId = true;
    }
    return deviceId;
};

let idCacheKey,
    initialId,
    isNewId = false;

/**
 * @ignore
 */
export default class {
    constructor(config) {
        initialId = generateId();
        idCacheKey = `${config.pf}CId`;
        this.deviceId = initDeviceId();
        this.rootId = initialId;
        this.isNewId = isNewId;
    }

    setDeviceId(deviceId) {
        this.deviceId = deviceId;
        try {
            localStorage.setItem(idCacheKey, deviceId);
        } catch (e) {
            window.document.cookie = `${idCacheKey}=${deviceId}; Path=/; Max-Age=31536000;`;
        }
    }
}
