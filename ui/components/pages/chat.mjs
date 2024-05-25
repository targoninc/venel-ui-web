import {computedSignal, create, ifjs, signal, signalMap} from "https://fjs.targoninc.com/f.js";
import {LayoutTemplates} from "../layout.mjs";
import {Store} from "../../api/Store.mjs";
import {CommonTemplates} from "../common.mjs";
import {Api} from "../../api/Api.mjs";
import {toast} from "../../actions.mjs";

export class ChatComponent {
    static render() {
        return LayoutTemplates.pageFull(ChatComponent.content());
    }

    static content() {
        const user = Store.get('user');
        const channels = Store.get("channels");
        const activeChannel = signal(Store.get("currentChannelId") || channels[0]?.id || null);
        const activeMessages = signal(Store.get("messages")[activeChannel.value] || []);
        activeChannel.subscribe(channel => {
            Store.set("currentChannelId", channel);
            activeMessages.value = Store.get("messages")[channel] || [];
        });
        activeMessages.subscribe(messages => {
            Store.get("messages")[activeChannel.value] = messages;
        });

        return create("div")
            .classes("panes-v", "full-width", "full-height")
            .children(
                create("div")
                    .classes("full-width")
                    .children(
                        ChatComponent.actions(user),
                    ).build(),
                create("div")
                    .classes("panes", "full-width", "flex-grow")
                    .children(
                        LayoutTemplates.pane(ChatComponent.channelList(channels, activeChannel), "25%", "200px"),
                        ifjs(activeChannel, LayoutTemplates.pane(ChatComponent.chat(activeChannel, activeMessages), "75%", "300px")),
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

    static chat(activeChannel, activeMessages) {
        const sending = signal(false);
        const messageText = signal("");

        return create("div")
            .classes("flex-v", "full-height")
            .children(
                create("div")
                    .classes("chat-content", "flex-v")
                    .children(
                        signalMap(activeMessages, create("div")
                                .classes("chat-messages", "flex-v", "flex-grow"),
                            message => ChatComponent.message(message)),
                        create("div")
                            .classes("chat-input", "flex", "align-center")
                            .children(
                                CommonTemplates.textArea(messageText, "message", "Enter message", "Write something nice...", ["flex-grow"], ["full-width-h"]),
                                create("div")
                                    .children(
                                        ChatComponent.sendButton(sending, activeMessages, activeChannel, messageText),
                                    ).build()
                            ).build(),
                    ).build(),
            ).build();
    }

    static sendButton(sending, activeMessages, activeChannel, messageText) {
        return CommonTemplates.buttonWithSpinner("send", "Send", "send", () => {
            sending.value = true;
            Api.sendMessage(activeChannel.value, messageText.value).then((res) => {
                sending.value = false;
                if (res.status !== 200) {
                    toast("Failed to send message", "negative");
                    return;
                }

                activeMessages.value.push(res.data);
                messageText.value = "";
            });
        }, sending, ["rounded-max", "double"]);
    }

    static actions(user) {
        return create("div")
            .classes("flex")
            .children(
                CommonTemplates.userInList("face_5", user.displayname, user.username, () => {})
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
            .classes("chat-message")
            .children(
                create("span")
                    .classes("bold")
                    .text(message.user.displayname)
                    .build(),
                create("span")
                    .text(message.text)
                    .build(),
            ).build();
    }
}