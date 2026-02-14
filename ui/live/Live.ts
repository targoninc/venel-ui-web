import {LiveInstance} from "./LiveInstance.ts";
import {live, liveInstance} from "../api/Store";

export class Live {
    static startIfNotRunning() {
        if (Live.running()) {
            return;
        }

        Live.start();
    }

    static running() {
        return live.value;
    }

    static start() {
        live.value = false;
        liveInstance.value = new LiveInstance(() => {
            live.value = false;
        }, () => {
            live.value = true;
        });
    }

    static stop() {
        const li = liveInstance.value;
        li?.stop();
        liveInstance.value = null;
        if (Live.running()) {
            live.value = false;
        }
    }

    static send(data: Record<string, any>) {
        liveInstance.value?.send(data);
    }
}