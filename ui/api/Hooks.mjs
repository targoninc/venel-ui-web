import {Api} from "./Api.mjs";
import {playSound, testImage, toast} from "../actions.mjs";
import {signal, store} from "https://fjs.targoninc.com/f.js";
import {Live} from "../live/Live.mjs";
import {Store} from "./Store.mjs";
import {currentSound, localNotificationsEnabled, soundEnabled, systemNotificationsEnabled} from "./LocalSetting.mjs";
import {Notifier} from "../live/Notifier.mjs";

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
                for (const channel of res.data) {
                    Hooks.runActiveChannel(channel.id);
                }
            } else {
                toast("Failed to fetch channels: " + res.data.error, "negative");
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
                toast("Failed to fetch messages: " + res.data.error, "negative");
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
    store().setSignalValue('messages', {...ex, [channel]: messages.sort((a, b) => a.id - b.id)});
}

export function addMessage(channel, message) {
    if (!store().get('messages')) {
        store().set('messages', signal({}));
    }

    const ex = store().get('messages').value;
    setChannel(ex, channel);

    if (ex[channel].find((m) => m.id === message.id)) {
        return;
    }
    store().setSignalValue('messages', {...ex, [channel]: [...ex[channel], message]});

    const user = Store.get('user');
    if (message.sender.id === user.value.id) {
        return;
    }

    if (localNotificationsEnabled()) {
        Notifier.sendMessage(channel, message);
    }
    if (systemNotificationsEnabled()) {
        new Notification(`New message from ${message.sender.displayname ?? message.sender.username}`, {
            body: message.text,
            icon: message.sender.avatar ?? testImage,
        });
    }
    if (soundEnabled()) {
        playSound(currentSound());
    }
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

export function addChannel(channel) {
    if (!store().get('channels')) {
        store().set('channels', signal([]));
    }

    if (store().get('channels').value.some((c) => c.id === channel.id)) {
        return;
    }

    store().setSignalValue('channels', [channel, ...store().get('channels').value]);
}

export function removeChannel(channel) {
    if (!store().get('channels')) {
        store().set('channels', signal([]));
    }

    store().setSignalValue('channels', store().get('channels').value.filter((c) => c !== channel));
}

export function setActiveChannel(channel) {
    store().set('activeChannel', signal(channel));
    Hooks.runActiveChannel(channel);
}

export function addReaction(messageId, reactionId, userId) {
    if (!store().get('messages')) {
        store().set('messages', signal({}));
    }

    const ex = store().get('messages').value;
    for (const channel in ex) {
        const message = ex[channel].find((m) => m.id === messageId);
        if (message) {
            message.reactions = message.reactions.map(r => {
                r.isNew = false;
                return r;
            });
            message.reactions.push({ id: reactionId, userId, isNew: userId === Store.get('user').value.id });
            store().setSignalValue('messages', ex);
            return;
        }
    }
}

export function removeReaction(messageId, reactionId, userId) {
    if (!store().get('messages')) {
        store().set('messages', signal({}));
    }

    const ex = store().get('messages').value;
    for (const channel in ex) {
        const message = ex[channel].find((m) => m.id === messageId);
        if (message) {
            message.reactions = message.reactions.filter((r) => {
                return !(r.id === reactionId && r.userId === userId);
            });
            message.reactions = message.reactions.map(r => {
                r.isNew = false;
                return r;
            });
            store().setSignalValue('messages', ex);
            return;
        }
    }
}