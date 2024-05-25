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
}