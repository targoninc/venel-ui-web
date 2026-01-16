import {signal, store} from "/f.js";
import {currentCallSound, currentSound, setCurrentCallSound, setCurrentSound} from "./Setting.ts";
import {Api} from "./Api.ts";
import {toast} from "../actions.ts";

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
        Api.getReactionGroups().then(res => {
            if (res.status === 200) {
                store().setSignalValue('reactionGroups', res.data);
            } else {
                toast("Failed to get reaction groups: " + res.data.error, "error");
            }
        });
        Api.getAvailableReactions().then(res => {
            if (res.status === 200) {
                store().setSignalValue('reactions', res.data);
            } else {
                toast("Failed to get available reactions: " + res.data.error, "error");
            }
        });
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
        reactions: {
            type: "array",
            default: signal([]),
        },
        reactionGroups: {
            type: "array",
            default: signal([]),
        },
    }
}