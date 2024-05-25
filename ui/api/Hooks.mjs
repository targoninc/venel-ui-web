import {Api} from "./Api.mjs";
import {toast} from "../actions.mjs";
import {signal, store} from "https://fjs.targoninc.com/f.js";

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
    }

    static runActiveChannel(channel) {
        if (!channel) {
            return;
        }

        if (!store().get('messages')) {
            store().set('messages', signal({}));
        }

        Api.getMessages(channel, 0).then((res) => {
            if (res.status === 200) {
                store().setSignalValue('messages', res.data.reverse());
            } else {
                toast("Failed to fetch messages", "negative");
                store().setSignalValue('messages', {});
            }
        });
    }
}