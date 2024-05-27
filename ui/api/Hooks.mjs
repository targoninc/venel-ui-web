import {Api} from "./Api.mjs";
import {toast} from "../actions.mjs";
import {signal, store} from "https://fjs.targoninc.com/f.js";
import {Live} from "../live/Live.mjs";

export class Hooks {
    static runUser(user) {
        if (!user) {
            return;
        }

        if (!store().get('channels')) {
            store().set('channels', signal([]));
        }

        Api.getChannels().then((res) => {
            if (res.status === 200) {
                store().setSignalValue('channels', res.data);
            } else {
                toast("Failed to fetch channels", "negative");
                store().setSignalValue('channels', []);
            }
        });

        Live.startIfNotRunning();
    }

    static runActiveChannel(channel) {
        if (!channel) {
            return;
        }

        Api.getMessages(channel, 0).then((res) => {
            if (res.status === 200) {
                setMessages(channel, res.data);
            } else {
                toast("Failed to fetch messages", "negative");
                setMessages(channel, []);
            }
        });
    }
}

export function setMessages(channel, messages) {
    if (!store().get('messages')) {
        store().set('messages', signal({}));
    }

    const ex = store().get('messages').value;
    setChannel(ex, channel);
    store().setSignalValue('messages', {...ex, [channel]: messages});
}

export function addMessage(channel, message) {
    if (!store().get('messages')) {
        store().set('messages', signal({}));
    }

    const ex = store().get('messages').value;
    setChannel(ex, channel);
    store().setSignalValue('messages', {...ex, [channel]: [message, ...ex[channel]]});
}

export function removeMessage(channel, messageId) {
    if (!store().get('messages')) {
        store().set('messages', signal({}));
    }

    const ex = store().get('messages').value;
    setChannel(ex, channel);
    store().setSignalValue('messages', {...ex, [channel]: ex[channel].filter((message) => message.id !== messageId)});
}

export function setChannel(ex, channel) {
    if (!ex[channel]) {
        ex[channel] = [];
    }
}