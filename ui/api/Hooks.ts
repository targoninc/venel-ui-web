import {Api} from "./Api.ts";
import {playSound, testImage, toast} from "../actions.ts";
import {Live} from "../live/Live.ts";
import {
    currentSound,
    localNotificationsEnabled,
    Setting,
    soundEnabled,
    systemNotificationsEnabled
} from "./Setting.ts";
import {Notifier} from "../live/Notifier.ts";
import {channels, currentUser, messages} from "./Store";
import {Channel, Id, Message, User} from "../models/models";

export class Hooks {
    static runUser(user: User) {
        if (!user) {
            return;
        }

        Setting.initializeLocalStoreFromUser(user);

        Api.getChannels().then((res) => {
            if (res.status === 200) {
                channels.value = res.data;
                for (const channel of res.data) {
                    Hooks.runActiveChannel(channel.id);
                }
            } else {
                toast("Failed to fetch channels: " + res.data.error, "negative");
                channels.value = [];
            }
        });

        Live.startIfNotRunning();
    }

    static runActiveChannel(channelId: Id) {
        if (!channelId) {
            return;
        }

        Api.getMessages(channelId, 0).then((res) => {
            if (res.status === 200) {
                setMessages(channelId, res.data);
            } else {
                toast("Failed to fetch messages: " + res.data.error, "negative");
            }
        });
    }
}

export function setMessages(channelId: Id, msgs: Message[]) {
    const ex = messages.value;
    setChannel(ex, channelId);
    messages.value = {
        ...ex,
        [channelId]: msgs.sort((a, b) => a.id - b.id)
    };
}

export function addMessage(channelId: Id, message: Message) {
    const ex = messages.value;
    setChannel(ex, channelId);

    if (ex[channelId].find((m) => m.id === message.id)) {
        return;
    }
    messages.value = {
        ...ex,
        [channelId]: [...ex[channelId], message]
    };

    if (message.sender.id === currentUser.value?.id) {
        return;
    }

    if (localNotificationsEnabled()) {
        Notifier.sendMessage(channelId, message);
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

export function removeMessage(channelId: Id, messageId: Id) {
    const ex = messages.value;
    setChannel(ex, channelId);
    messages.value = {
        ...ex,
        [channelId]: ex[channelId].filter((message) => message.id !== messageId)
    };
}

export function setChannel(ex, channel) {
    if (!ex[channel]) {
        ex[channel] = [];
    }
}

export function addChannel(channel: Channel) {
    if (channels.value.some((c) => c.id === channel.id)) {
        return;
    }

    channels.value = [
        channel,
        ...channels.value
    ];
}

export function addReaction(messageId: Id, reactionId: Id, userId: Id) {
    const ex = messages.value;
    for (const channel in ex) {
        const message = ex[channel].find((m) => m.id === messageId);
        if (message) {
            message.reactions = message.reactions.map(r => {
                r.isNew = false;
                return r;
            });
            message.reactions.push({
                reactionId,
                messageId,
                userId,
                isNew: userId === currentUser.value?.id
            });
            messages.value = ex;
            return;
        }
    }
}

export function removeReaction(messageId: Id, reactionId: Id, userId: Id) {
    const ex = messages.value;
    for (const channel in ex) {
        const message = ex[channel].find((m) => m.id === messageId);
        if (message) {
            message.reactions = message.reactions.filter((r) => {
                return !(r.reactionId === reactionId && r.userId === userId);
            });
            message.reactions = message.reactions.map(r => {
                r.isNew = false;
                return r;
            });
            messages.value = ex;
            return;
        }
    }
}