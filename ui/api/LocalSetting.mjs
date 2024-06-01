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

export function systemNotificationsAllowed() {
    return Notification.permission === "granted";
}

export function systemNotificationsEnabled() {
    return systemNotificationsAllowed() && LocalSetting.getBoolean("systemNotifications");
}

export function setSystemNotificationsEnabled(enabled) {
    if (enabled) {
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                LocalSetting.set("systemNotifications", true);
            } else {
                LocalSetting.set("systemNotifications", false);
            }
        });
    }
    LocalSetting.set("systemNotifications", enabled);
}
