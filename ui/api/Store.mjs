import {signal, store} from "https://fjs.targoninc.com/f.js";
import {currentCallSound, currentSound, setCurrentCallSound, setCurrentSound} from "./LocalSetting.mjs";

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
        if (!currentSound()) {
            setCurrentSound("bloom.mp3");
        }
        if (!currentCallSound()) {
            setCurrentCallSound("blossom.mp3");
        }
    }

    static definition = {
        user: {
            type: "object",
            default: signal(null),
        },
        currentChannelId: {
            type: "number",
            default: 0,
        },
        messages: {
            type: "signal<array>",
            default: signal([]),
        },
        selectedMessageId: {
            type: "number",
            default: 0,
        },
    }
}