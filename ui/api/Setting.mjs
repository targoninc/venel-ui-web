import {Api} from "./Api.mjs";
import {toast} from "../actions.mjs";
import {store} from "https://fjs.targoninc.com/f.js";

export class Setting {
    static getBoolean(key) {
        return sessionStorage.getItem(key) === "true";
    }

    static getString(key) {
        return sessionStorage.getItem(key);
    }

    static set(key, value) {
        sessionStorage.setItem(key, value);
        Api.updateSetting(key, value).then((res) => {
            if (res.status !== 200) {
                toast("Failed to update setting: " + res.data.error, "error");
            } else {
                const user = store().getSignalValue("user");
                const newUser = {
                    ...user,
                    settings: {
                        ...user,
                        [key]: value,
                    },
                };
                store().setSignalValue("user", newUser);
            }
        });
    }

    static initializeLocalStoreFromUser(user) {
        for (const key in user.settings) {
            let value = user.settings[key];
            if (value === "true") {
                value = true;
            } else if (value === "false") {
                value = false;
            }
            sessionStorage.setItem(key, value);
        }
    }
}

export function localNotificationsEnabled() {
    return Setting.getBoolean("notifications");
}

export function setLocalNotificationsEnabled(enabled) {
    Setting.set("notifications", enabled);
}

export function systemNotificationsAllowed() {
    return Notification.permission === "granted";
}

export function systemNotificationsEnabled() {
    return systemNotificationsAllowed() && Setting.getBoolean("systemNotifications");
}

export function setSystemNotificationsEnabled(enabled) {
    if (enabled) {
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                Setting.set("systemNotifications", true);
            } else {
                console.warn("System notifications permission denied");
                Setting.set("systemNotifications", false);
            }
        });
    }
    Setting.set("systemNotifications", enabled);
}

export function soundEnabled() {
    return Setting.getBoolean("sound");
}

export function setSoundEnabled(enabled) {
    Setting.set("sound", enabled);
}

export function currentSound() {
    return Setting.getString("currentSound");
}

export function setCurrentSound(sound) {
    Setting.set("currentSound", sound);
}

export function currentCallSound() {
    return Setting.getString("currentCallSound");
}

export function setCurrentCallSound(sound) {
    Setting.set("currentCallSound", sound);
}
