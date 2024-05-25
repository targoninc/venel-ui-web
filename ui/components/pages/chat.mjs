import {computedSignal, create, ifjs, signal, signalMap} from "https://fjs.targoninc.com/f.js";
import {LayoutTemplates} from "../layout.mjs";
import {Store} from "../../api/Store.mjs";
import {CommonTemplates} from "../common.mjs";
import {Api} from "../../api/Api.mjs";
import {toast} from "../../actions.mjs";
import {Hooks} from "../../api/Hooks.mjs";

export class ChatComponent {
    static render() {
        return LayoutTemplates.pageFull(ChatComponent.content());
    }

    static content() {
        const user = Store.get('user');
        const channels = Store.get("channels");
        const activeChannel = signal(Store.get("currentChannelId") || channels[0]?.id || null);
        const messages = Store.get("messages");
        channels.subscribe(newChannels => {
            if (!newChannels.some(channel => channel.id === activeChannel.value)) {
                activeChannel.value = newChannels[0]?.id || null;
            }
        });
        activeChannel.subscribe(channel => {
            Store.set("currentChannelId", channel);
            Hooks.runActiveChannel(channel);
        });

        return create("div")
            .classes("panes-v", "full-width", "full-height")
            .children(
                ChatComponent.actions(user),
                create("div")
                    .classes("panes", "full-width", "flex-grow")
                    .children(
                        LayoutTemplates.pane(ChatComponent.channelList(channels, activeChannel), "25%", "200px"),
                        ifjs(activeChannel, LayoutTemplates.pane(ChatComponent.chat(activeChannel, messages), "75%", "300px")),
                        ifjs(activeChannel, LayoutTemplates.pane(create("span").text("No channel selected").build(), "75%", "300px"), true)
                    ).build()
            ).build();
    }

    static channelList(channels, activeChannel) {
        return signalMap(channels,
            create("div")
                .classes("flex-v")
            , channel => ChatComponent.channel(channel, activeChannel));
    }

    static chat(activeChannel, messages) {
        const sending = signal(false);
        const messageText = signal("");

        return create("div")
            .classes("flex-v", "full-height")
            .children(
                create("div")
                    .classes("chat-content", "flex-v", "no-gap")
                    .children(
                        signalMap(messages, create("div")
                                .classes("chat-messages", "flex-v", "flex-grow"),
                            message => ChatComponent.message(message)),
                        create("div")
                            .classes("background-2", "chat-input", "flex", "align-center")
                            .children(
                                CommonTemplates.textArea(messageText, "message", "Enter message", "Write something nice...", ["flex-grow"], ["full-width-h"]),
                                create("div")
                                    .children(
                                        ChatComponent.sendButton(sending, messages, activeChannel, messageText),
                                    ).build()
                            ).build(),
                    ).build(),
            ).build();
    }

    static sendButton(sending, messages, activeChannel, messageText) {
        return CommonTemplates.buttonWithSpinner("send", "Send", "send", () => {
            sending.value = true;
            Api.sendMessage(activeChannel.value, messageText.value).then((res) => {
                sending.value = false;
                if (res.status !== 200) {
                    toast("Failed to send message", "negative");
                    return;
                }

                messages.value.push(res.data);
                messageText.value = "";
            });
        }, sending, ["rounded-max", "double"]);
    }

    static actions(user) {
        return create("div")
            .classes("flex", "align-center", "full-width")
            .children(
                create("div")
                    .classes("padded")
                    .children(
                        CommonTemplates.userInList("face_5", user.displayname, user.username, () => {})
                    ).build(),
                CommonTemplates.pageLink("Logout", "logout")
            ).build();
    }

    static channel(channel, activeChannel) {
        const activeClass = computedSignal(activeChannel, (id) => id === channel.id ? "active" : "_");
        const channelTypes = {
            "dm": "Direct message",
            "group": "Group",
        };

        return create("div")
            .classes("channel", "flex-v", "full-width", activeClass)
            .onclick(() => {
                activeChannel.value = channel.id;
            })
            .children(
                create("span")
                    .text(channel.name)
                    .build(),
                create("span")
                    .classes("text-small")
                    .text(channelTypes[channel.type] || "Channel")
                    .build(),
            ).build();
    }

    static message(message) {
        return create("div")
            .classes("chat-message", "flex")
            .children(
                create("span")
                    .classes("bold")
                    .text(message.sender.displayname ?? message.sender.username)
                    .build(),
                create("span")
                    .text(message.text)
                    .build(),
            ).build();
    }
}