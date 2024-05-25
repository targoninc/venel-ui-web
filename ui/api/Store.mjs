import {store} from "https://fjs.targoninc.com/f.js";

export class Store {
    static clear() {
        store().clear();
    }

    static get(key) {
        return store().get(key);
    }

    static set(key, value) {
        store().set(key, value);
    }

    static create() {
        for (const key in this.definition) {
            this.set(key, this.definition[key].default);
        }
    }

    static definition = {
        user: {
            type: "object",
            default: null,
        },
        currentChannelId: {
            type: "number",
            default: 0,
        },
        messages: {
            type: "object",
            default: {},
        },
        selectedMessageId: {
            type: "number",
            default: 0,
        },
    }
}