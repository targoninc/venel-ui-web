import {Store} from "../api/Store.mjs";
import {notify, testImage} from "../actions.mjs";
import {truncate} from "../tooling/Text.mjs";

export class Notifier {
    static sendMessage(channelId, message) {
        const channel = Store.get('channels').value.find((channel) => channel.id === channelId);
        if (!channel) {
            console.error(`Channel with id ${channelId} not found`);
            return;
        }

        notify(message.sender.avatar ?? testImage,
            message.sender.displayname ?? message.sender.username,
            "in " + channel.name,
            truncate(message.text, 150));
    }
}