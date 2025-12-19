import {addChannel, addMessage, addReaction, removeMessage, removeReaction} from "../api/Hooks.mjs";
import {toast} from "../actions.mjs";
import {Api} from "../api/Api.mjs";
import {store} from "/f.js";

export class LiveInstance {
    constructor(onStop = () => {}, onStart = () => {}) {
        this.onStop = onStop;
        this.onStart = onStart;
        this.server = null;
        this.interval = null;

        this.start();
    }

    async getConnectSid() {
        const res = await Api.getConnectionSid();
        if (res.status === 200) {
            return res.data.connectSid;
        }

        return null;
    }

    async startPing() {
        if (!this.server || this.interval) {
            return;
        }

        this.interval = setInterval(() => {
            if (this.server.readyState !== WebSocket.OPEN) {
                return;
            }
            this.server.send(JSON.stringify({type: "ping"}));
        }, 10000);
    }

    async start() {
        let connectSid = await this.getConnectSid();
        if (!connectSid) {
            console.error("No connect.sid cookie found");
            return;
        }
        const res = await Api.url();
        if (res.status !== 200) {
            toast("Could not get live server URL: " + res.data.error, "error");
            return;
        }
        this.server = new WebSocket(encodeURI(`${res.data}?cid=${connectSid}`));
        this.server.onopen = () => {
            console.log("Connected to live server!");
            this.onStart();
            this.startPing();
        };

        this.server.onclose = () => {
            this.onStop();
            setTimeout(() => {
                console.log("Lost connection to live server, reconnecting...");
                toast("Lost connection to live server, reconnecting...", "info");
                this.start();
            }, 1000);
        };

        this.server.onerror = (error) => {
            console.error("WebSocket error", error);
        }

        this.server.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received live message', data);
            switch (data.type) {
                case "message":
                    addMessage(data.message.channelId, data.message);
                    break;
                case "addReaction":
                    addReaction(data.messageId, data.reactionId, data.userId);
                    break;
                case "removeReaction":
                    removeReaction(data.messageId, data.reactionId, data.userId);
                    break;
                case "removeMessage":
                    removeMessage(data.channelId, data.messageId);
                    break;
                case "newChannel":
                    addChannel(data.channel);
                    break;
                case "maxPayloadSize":
                    this.maxPayloadSizeInMb = data.size;
                    store().set("maxPayloadSizeInMb", data.size);
                    break;
            }
        };
    }

    stop() {
        this.server.close();
    }

    send(data) {
        const toSend = JSON.stringify(data);
        if (this.maxPayloadSizeInMb) {
            if (toSend.length > this.maxPayloadSizeInMb * 1024 * 1024) {
                toast("Payload too large, not sending");
                return;
            }
        }
        this.server.send(toSend);
    }
}