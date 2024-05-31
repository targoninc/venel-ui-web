import {computedSignal, create, ifjs, signal, signalMap, store} from "https://fjs.targoninc.com/f.js";
import {LayoutTemplates} from "../layout.mjs";
import {Store} from "../../api/Store.mjs";
import {CommonTemplates} from "../common.mjs";
import {Hooks, removeMessage} from "../../api/Hooks.mjs";
import {Time} from "../../tooling/Time.mjs";
import {Live} from "../../live/Live.mjs";
import {ChannelTemplates} from "../channel.mjs";

export class ChatComponent {
    static render(params) {
        return LayoutTemplates.pageFull(ChatComponent.content(params));
    }

    static content(params) {
        const user = Store.get('user');
        const channels = Store.get("channels");
        const activeChannel = signal(params.channelId || Store.get("currentChannelId") || channels[0]?.id || null);
        const messages = Store.get("messages");
        channels.subscribe(newChannels => {
            if (!newChannels.some(channel => channel.id === activeChannel.value)) {
                activeChannel.value = newChannels[0]?.id || null;
            }
        });
        const updateChannels = () => {
            displayChannels.value = channels.value.sort((a, b) => {
                const aLastMsg = messages.value[a.id]?.at(-1);
                const bLastMsg = messages.value[b.id]?.at(-1);
                if (!aLastMsg || !bLastMsg) {
                    return 0;
                }

                return new Date(bLastMsg.createdAt).getTime() - new Date(aLastMsg.createdAt).getTime();
            });
        };
        const displayChannels = signal(channels.value);
        messages.subscribe(updateChannels);
        channels.subscribe(updateChannels);

        activeChannel.subscribe(channel => {
            Store.set("currentChannelId", channel);
            Hooks.runActiveChannel(channel);
        });

        return create("div")
            .classes("panes-v", "full-width", "full-height")
            .children(
                CommonTemplates.actions(user, channels),
                create("div")
                    .classes("panes", "full-width", "flex-grow")
                    .children(
                        LayoutTemplates.resizableFromRight(ChannelTemplates.channelList(displayChannels, messages, activeChannel), "50%", "200px", "50%"),
                        ifjs(activeChannel, LayoutTemplates.flexPane(ChatComponent.chat(activeChannel, messages), "300px", "100%")),
                        ifjs(activeChannel, LayoutTemplates.flexPane(create("span").text("No channel selected").build(), "300px", "100%"), true)
                    ).build()
            ).build();
    }

    static chat(activeChannel, allMessages) {
        const sending = signal(false);
        const messageText = signal("");
        const messages = computedSignal(allMessages, (messages) => {
            const out = messages[activeChannel.value] || [];
            return out.sort((a, b) => {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });
        });

        return create("div")
            .classes("flex-v", "full-height")
            .children(
                create("div")
                    .classes("chat-content", "flex-v", "no-gap")
                    .children(
                        signalMap(messages, create("div")
                                .classes("chat-messages", "flex-v", "flex-grow", "no-gap"),
                            message => ChatComponent.message(message, messages)),
                        create("div")
                            .classes("background-2", "chat-input", "flex", "align-center")
                            .children(
                                CommonTemplates.textArea(messageText, "message", null, "Write something nice...", ["flex-grow"], ["full-width-h", "message-input"], () => {
                                    if (!messageText.value || messageText.value.trim() === "" || sending.value) {
                                        return;
                                    }

                                    sending.value = true;
                                    Live.send({
                                        type: "message",
                                        channelId: activeChannel.value,
                                        text: messageText.value,
                                    });
                                    sending.value = false;
                                    messageText.value = "";
                                }),
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
            if (!messageText.value || messageText.value.trim() === "" || sending.value) {
                return;
            }

            sending.value = true;
            Live.send({
                type: "message",
                channelId: activeChannel.value,
                text: messageText.value,
            });
            sending.value = false;
            messageText.value = "";
        }, sending, ["rounded-max", "double"]);
    }

    static message(message, messages) {
        const messageIndex = messages.value.indexOf(message);
        const previousMessage = messages.value[messageIndex - 1];
        let shouldDisplaySender = true;
        if (previousMessage && previousMessage.sender.id === message.sender.id) {
            shouldDisplaySender = false;
        }
        const edited = message.createdAt !== message.updatedAt;
        const timestamp = new Date(message.createdAt).getTime();
        const offset = new Date().getTimezoneOffset() * 60000;
        const localTimestamp = timestamp + offset;
        const menuShown = signal(false);

        return create("div")
            .classes("chat-message", "flex-v")
            .children(
                ifjs(shouldDisplaySender, create("div")
                    .classes("flex", "align-center")
                    .children(
                        CommonTemplates.userInList("face_5", message.sender.displayname ?? message.sender.username, null, () => {})
                    ).build()),
                create("div")
                    .classes("message-content", "flex", "space-between", "full-width")
                    .oncontextmenu((e) => {
                        e.preventDefault();
                        menuShown.value = true;
                        document.addEventListener("click", () => {
                            menuShown.value = false;
                        });
                    })
                    .children(
                        ifjs(menuShown, ChatComponent.messageMenu(message)),
                        create("div")
                            .classes("flex-v", "no-gap")
                            .children(
                                ifjs(edited, create("span")
                                    .classes("message-note")
                                    .text("edited")
                                    .build()),
                                create("span")
                                    .classes("message-text")
                                    .text(message.text)
                                    .build(),
                            ).build(),
                        create("span")
                            .classes("message-timestamp", "text-small")
                            .text(Time.ago(localTimestamp))
                            .build(),
                    ).build()
            ).build();
    }

    static messageMenu(message) {
        return create("div")
            .classes("message-menu", "flex-v")
            .children(
                CommonTemplates.buttonWithIcon("edit", "Edit", () => {
                    // TODO: Implement edit message
                }),
                CommonTemplates.buttonWithIcon("delete", "Delete", () => {
                    Live.send({
                        type: "removeMessage",
                        messageId: message.id,
                    });
                    removeMessage(message.channelId, message.id);
                }),
            ).build();
    }
}