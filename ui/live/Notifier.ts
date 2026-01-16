import {Store} from "../api/Store.ts";
import {notify, testImage} from "../actions.ts";
import {truncate} from "../tooling/Text.ts";

export class Notifier {
    static sendMessage(channelId, message) {
        const channel = Store.get('channels').value.find((channel) => channel.id === channelId);
        if (!channel) {
            console.error(`Channel with id ${channelId} not found`);
            return;
        }

        const reference = channel.type === "dm" ? "DM" : channel.name;
        notify(message.sender.avatar ?? testImage,
            message.sender.displayname ?? message.sender.username,
            "in " + reference,
            truncate(message.text, 150),
            () => {
                if (channelId !== Store.get('currentChannelId')) {
                    window.router.navigate(`/chat/${channelId}`);
                }
            });
    }
}