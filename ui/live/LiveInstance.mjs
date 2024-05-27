import {addMessage, removeMessage} from "../api/Hooks.mjs";
import {toast} from "../actions.mjs";
import {Api} from "../api/Api.mjs";

export class LiveInstance {
    constructor(onStop = () => {}, onStart = () => {}) {
        this.onStop = onStop;
        this.onStart = onStart;
        this.server = null;

        this.start();
    }

    async getConnectSid() {
        const res = await Api.getConnectionSid();
        if (res.status === 200) {
            return res.data.connectSid;
        }

        return null;
    }

    async start() {
        let connectSid = await this.getConnectSid();
        if (!connectSid) {
            console.error("No connect.sid cookie found");
            toast("Could not connect to live server. You have to refresh the page to get any updates.");
            return;
        }
        this.server = new WebSocket(encodeURI(`ws://127.0.0.1:8912?cid=${connectSid}`)); // TODO: Replace with actual server address
        this.server.onopen = () => {
            this.onStart();
        };

        this.server.onclose = () => {
            this.onStop();
        };

        this.server.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case "message":
                    addMessage(data.message.channelId, data.message);
                    break;
                case "removeMessage":
                    removeMessage(data.channelId, data.messageId);
                    break;
            }
        };
    }

    stop() {
        this.server.close();
    }

    send(data) {
        this.server.send(JSON.stringify(data));
    }
}