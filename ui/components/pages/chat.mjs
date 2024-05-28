import {computedSignal, create, ifjs, signal, signalMap} from "https://fjs.targoninc.com/f.js";
import {LayoutTemplates} from "../layout.mjs";
import {Store} from "../../api/Store.mjs";
import {CommonTemplates} from "../common.mjs";
import {Api} from "../../api/Api.mjs";
import {popup, removePopups, toast} from "../../actions.mjs";
import {Hooks, removeMessage} from "../../api/Hooks.mjs";
import {Time} from "../../tooling/Time.mjs";
import {Live} from "../../live/Live.mjs";
import {PopupComponents} from "../popup.mjs";

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
                ChatComponent.actions(user, channels),
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
                .classes("flex-v", "no-gap")
            , channel => {
                if (channel.type === "gr") {
                    return ChatComponent.groupChannel(channel, activeChannel);
                } else {
                    return ChatComponent.dmChannel(channel, activeChannel);
                }
            });
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
                                .classes("chat-messages", "flex-v", "flex-grow"),
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

    static actions(user, channels) {
        const userSearchResults = signal([]);

        return create("div")
            .classes("flex", "align-center", "full-width", "space-between")
            .children(
                CommonTemplates.buttonWithIcon("person_add", "New DM", () => {
                    popup(PopupComponents.searchPopup(() => {
                        removePopups();
                    }, (e) => {
                        const query = e.target.value;
                        if (query.length < 3) {
                            userSearchResults.value = [];
                            return;
                        }

                        Api.search(query).then((res) => {
                            if (res.status !== 200) {
                                toast("Failed to search for users", "error");
                                return;
                            }
                            userSearchResults.value = res.data.filter(user => {
                                return !channels.value.some(channel => {
                                    if (channel.type === "dm" && channel.members.length === 1) {
                                        return channel.members[0].id === user.id;
                                    }

                                    return channel.type === "dm" && channel.members[1].id === user.id;
                                });
                            });
                        })
                    }, () => {}, userSearchResults, (result) => {
                        return CommonTemplates.chatWithButton(result.username, () => {
                            Api.createDirect(result.id).then((res) => {
                                if (res.status !== 200) {
                                    toast("Failed to create DM", "error");
                                    removePopups();
                                    return;
                                }
                                toast("DM created", "success");
                                Live.send({
                                    type: "createChannel",
                                    channelId: res.data.id,
                                });
                                removePopups();
                            });
                        });
                    }, "New DM", "Search for users"));
                }),
                create("div")
                    .classes("padded")
                    .children(
                        CommonTemplates.userInList("face_5", user.displayname ?? user.displayname, user.username, () => {})
                    ).build(),
                CommonTemplates.pageLink("Logout", "logout")
            ).build();
    }

    static groupChannel(channel, activeChannel) {
        const activeClass = computedSignal(activeChannel, (id) => id === channel.id ? "active" : "_");
        const editing = signal(false);

        return create("div")
            .classes("channel", "flex-v", "full-width", activeClass)
            .onclick(() => {
                activeChannel.value = channel.id;
            })
            .children(
                ifjs(editing, create("input")
                    .type("text")
                    .value(channel.name)
                    .onchange((e) => {
                        Live.send({
                            type: "updateChannel",
                            channelId: channel.id,
                            name: e.target.value,
                        });
                    }).build()),
                ifjs(editing, create("span")
                    .text(channel.name)
                    .build(), true),
                create("span")
                    .classes("text-small")
                    .text("Group")
                    .build(),
            ).build();
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

    static dmChannel(channel, activeChannel) {
        const activeClass = computedSignal(activeChannel, (id) => id === channel.id ? "active" : "_");

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
                    .text("DM")
                    .build(),
            ).build();
    }
}