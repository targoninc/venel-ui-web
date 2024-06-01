export class LocalSetting {
    static getBoolean(key) {
        return sessionStorage.getItem(key) === "true";
    }

    static getString(key) {
        return sessionStorage.getItem(key);
    }

    static set(key, value) {
        sessionStorage.setItem(key, value);
    }
}

export function localNotificationsEnabled() {
    return LocalSetting.getBoolean("notifications");
}

export function setLocalNotificationsEnabled(enabled) {
    LocalSetting.set("notifications", enabled);
}
