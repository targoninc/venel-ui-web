import {computedSignal, create, ifjs, signal, signalFromProperty, signalMap} from "https://fjs.targoninc.com/f.js";
import {LayoutTemplates} from "../layout.mjs";
import {Store} from "../../api/Store.mjs";
import {CommonTemplates} from "../common.mjs";
import {Hooks, removeMessage} from "../../api/Hooks.mjs";
import {Time} from "../../tooling/Time.mjs";
import {Live} from "../../live/Live.mjs";
import {ChannelTemplates} from "../channel.mjs";
import {testImage} from "../../actions.mjs";
import {Popups} from "../../api/Popups.mjs";

export class ChatComponent {
    static render(params) {
        return LayoutTemplates.pageFull(ChatComponent.content(params));
    }

    static content(params) {
        const channels = Store.get("channels");
        const pathChannelId = params.channelId ? parseInt(params.channelId) : null;
        const activeChannel = signal(pathChannelId || Store.get("currentChannelId") || channels[0]?.id || null);
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
        const inverseRefId = Math.random().toString(36).substring(7);

        return create("div")
            .classes("panes-v", "full-width", "full-height")
            .children(
                CommonTemplates.actions(),
                create("div")
                    .classes("panes", "full-width", "flex-grow", "nav-margin", "no-wrap")
                    .children(
                        LayoutTemplates.resizableFromRight(ChannelTemplates.channelList(displayChannels, messages, activeChannel), inverseRefId, "20%", "10%", "50%"),
                        ifjs(activeChannel, LayoutTemplates.flexPane(ChatComponent.chat(activeChannel, messages), "300px", "100%", inverseRefId)),
                        ifjs(activeChannel, LayoutTemplates.flexPane(create("span").text("No channel selected").build(), "300px", "100%", inverseRefId), true)
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
        const menuShownForMessageId = signal(null);

        return create("div")
            .classes("flex-v", "full-height")
            .children(
                create("div")
                    .classes("chat-content", "flex-v", "no-gap")
                    .children(
                        signalMap(messages, create("div")
                                .classes("chat-messages","flex-v", "flex-grow", "no-gap"),
                            message => ChatComponent.message(message, messages, menuShownForMessageId)),
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

    static message(message, messages, menuShownForMessageId) {
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
        const menuShown = computedSignal(menuShownForMessageId, id => id === message.id);
        const messageMenuPositionX = signal(0);
        const messageMenuPositionY = signal(0);
        const cardShown = signal(false);

        return create("div")
            .classes("chat-message", "flex-v", "no-gap")
            .children(
                ifjs(shouldDisplaySender, create("div")
                    .classes("flex", "align-center", "relative")
                    .children(
                        CommonTemplates.chatUser(message.sender.avatar ?? testImage, message.sender.displayname ?? message.sender.username, () => {
                            cardShown.value = true;
                        }, () => {
                            cardShown.value = true;
                        }),
                        CommonTemplates.profileCard(message.sender, cardShown),
                    ).build()),
                create("div")
                    .classes("message-content", "flex", "space-between", "full-width")
                    .oncontextmenu((e) => {
                        e.preventDefault();
                        menuShownForMessageId.value = message.id;
                        messageMenuPositionX.value = e.clientX - e.target.getBoundingClientRect().left;
                        messageMenuPositionY.value = e.clientY - e.target.getBoundingClientRect().top;
                        document.addEventListener("click", () => {
                            menuShownForMessageId.value = null;
                        }, {once: true});
                    })
                    .children(
                        ifjs(menuShown, ChatComponent.messageMenu(message, messages, messageMenuPositionX, messageMenuPositionY)),
                        ChatComponent.reactionTrigger(message, messages),
                        create("span")
                            .classes("message-text")
                            .text(message.text)
                            .build(),
                        create("div")
                            .classes("flex-v", "no-gap")
                            .children(
                                ifjs(edited, create("span")
                                    .classes("message-note")
                                    .text("edited " + Time.ago(new Date(message.updatedAt).getTime() + offset))
                                    .build()),
                                create("span")
                                    .classes("message-timestamp", "text-small")
                                    .text(Time.ago(localTimestamp))
                                    .build(),
                            ).build(),
                    ).build()
            ).build();
    }

    static messageMenu(message, messages, posX, posY) {
        const posXR = computedSignal(posX, x => x + "px");
        const posYR = computedSignal(posY, y => y + "px");
        const user = Store.get("user");
        const permissions = signalFromProperty(user, "permissions");
        const sameUser = computedSignal(user, u => u.id === message.sender.id);
        const hasDeletePermission = computedSignal(permissions, p => p.some(perm => perm.name === "deleteMessage"));
        const canDelete = computedSignal(sameUser, isSame => isSame || hasDeletePermission.value);
        const menuClass = computedSignal(canDelete, can => (can || sameUser.value) ? "_" : "no-content");

        return create("div")
            .classes("message-menu", "flex-v", menuClass)
            .styles("top", posYR, "left", posXR)
            .children(
                ifjs(sameUser, CommonTemplates.buttonWithIcon("edit", "Edit", () => {
                    Popups.editMessage(message, messages);
                })),
                ifjs(canDelete, CommonTemplates.buttonWithIcon("delete", "Delete", () => {
                    Live.send({
                        type: "removeMessage",
                        messageId: message.id,
                    });
                    removeMessage(message.channelId, message.id);
                })),
            ).build();
    }

    static reactionTrigger(message, messages) {
        const menuShown = signal(false);
        const reactions = message.reactions.map(reaction => {
            return {
                ...reaction,
                content: Store.get("reactions").value.find(r => r.id === reaction.id).content,
            };
        });

        return create("div")
            .classes("reaction-trigger", "flex")
            .children(
                ifjs(reactions.length > 0, ChatComponent.reactionDisplay(reactions)),
                CommonTemplates.buttonWithIcon("add_reaction", "React", e => {
                    e.preventDefault();
                    menuShown.value = true;
                    setTimeout(() => {
                        document.addEventListener("click", (e) => {
                            if (e.target.closest(".reaction-menu")) {
                                return;
                            }
                            menuShown.value = false;
                        }, {once: true});
                    }, 0);
                }, ["reaction-button"]),
                ifjs(menuShown, ChatComponent.reactionMenu(message, messages)),
            ).build();
    }

    static reactionMenu(message) {
        const reactions = Store.get("reactions");
        const groups = Store.get("reactionGroups");
        const search = signal("");
        const filteredReactions = computedSignal(search, search => {
            return reactions.value.filter(reaction => reaction.identifier.includes(search));
        });
        const groupedFilteredReactions = computedSignal(filteredReactions, (reactions) => {
            const out = {};
            reactions.forEach(reaction => {
                const group = groups.value.find(group => group.id === reaction.groupId);
                if (!out[group.id]) {
                    out[group.id] = [];
                }
                out[group.id].push(reaction);
            });
            return out;
        });

        return create("div")
            .classes("reaction-menu", "card", "flex-v")
            .children(
                CommonTemplates.input("text", "reaction_search", "Search reactions", "👀", search, () => {}, false, "off", () => {}, (e) => {
                    search.value = e.target.value;
                }),
                signalMap(groups, create("div")
                    .classes("flex-v", "reaction-icons"),
                    group => ChatComponent.reactionGroup(group, groupedFilteredReactions, message)),
            ).build();
    }

    static reaction(reaction, message) {
        return create("div")
            .classes("reaction-icon")
            .text(reaction.content)
            .on("click", () => {
                Live.send({
                    type: "addReaction",
                    messageId: message.id,
                    reactionId: reaction.id,
                });
            }).build();
    }

    static reactionGroup(group, groupedFilteredReactions, message) {
        const reactions = computedSignal(groupedFilteredReactions, reactions => reactions[group.id] || []);
        const hasReactions = computedSignal(reactions, reactions => reactions.length > 0);

        return create("div")
            .classes("flex-v")
            .children(
                ifjs(hasReactions, create("h3")
                    .classes("text-small")
                    .text(group.display)
                    .build()),
                signalMap(reactions, create("div")
                        .classes("flex"),
                    reaction => ChatComponent.reaction(reaction, message))
            ).build();
    }

    static reactionDisplay(reactions) {
        const reactionCounts = {};
        reactions.forEach(reaction => {
            if (!reactionCounts[reaction.id]) {
                reactionCounts[reaction.id] = 0;
            }
            reactionCounts[reaction.id]++;
        });
        const uniqueReactions = reactions.filter((reaction, index, self) => {
            return self.findIndex(r => r.id === reaction.id) === index;
        });
        const user = Store.get("user");

        return create("div")
            .classes("flex")
            .children(
                uniqueReactions.map(reaction => {
                    const activeClass = reactions.some(r => r.id === reaction.id && r.userId === user.value.id) ? "active" : "_";

                    return create("div")
                        .classes("reaction-display", "pill", activeClass)
                        .text(reaction.content + " " + reactionCounts[reaction.id])
                        .build();
                }),
            ).build();
    }
}