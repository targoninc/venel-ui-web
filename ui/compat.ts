export class JessLegacyStore {
    static keyName = "__fjs_store__";

    static get(key) {
        return window[this.keyName][key];
    }

    static set(key, value) {
        window[this.keyName][key] = value;
    }

    static clear() {
        window[this.keyName] = {};
    }

    static remove(key) {
        delete window[this.keyName][key];
    }

    static getAll() {
        return window[this.keyName];
    }

    static keys() {
        return Object.keys(window[this.keyName]);
    }

    static values() {
        return Object.values(window[this.keyName]);
    }

    static getSignalValue(key) {
        return this.get(key).value;
    }

    static setSignalValue(key, value) {
        this.get(key).value = value;
    }
}

export function store() {
    if (!window[JessLegacyStore.keyName]) {
        window[JessLegacyStore.keyName] = {};
    }
    return JessLegacyStore;
}