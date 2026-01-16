import {LiveInstance} from "./LiveInstance.ts";
import {store} from "../compat";
import {signal} from "@targoninc/jess";

export class Live {
    static startIfNotRunning() {
        if (Live.running()) {
            return;
        }

        Live.start();
    }

    static running() {
        if (!store().get('live')) {
            return false;
        }

        return store().getSignalValue('live') === true;
    }

    static start() {
        store().set('live', signal(false));

        const liveInstance = new LiveInstance(() => {
            store().setSignalValue('live', false);
        }, () => {
            store().setSignalValue('live', true);
        });
        store().set('live_instance', liveInstance);
    }

    static stop() {
        const liveInstance = store().get('live_instance');
        liveInstance?.stop();
        store().set('live_instance', null);
        if (store().get('live')) {
            store().setSignalValue('live', false);
        }
    }

    static send(data) {
        const liveInstance = store().get('live_instance');
        liveInstance?.send(data);
    }
}