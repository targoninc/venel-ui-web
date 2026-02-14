import {notify, testImage} from "../actions.ts";
import {truncate} from "../tooling/Text.ts";
import {router} from "../routing/RouterInstance.ts";
import {Id, Message} from "../models/models";
import {channels, currentChannelId} from "../api/Store";

export class Notifier {
    static sendMessage(channelId: Id, message: Message) {
        const channel = channels.value.find((channel) => channel.id === channelId);
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
                if (channelId !== currentChannelId.value) {
                    router.navigate(`/chat/${channelId}`);
                }
            });
    }
}