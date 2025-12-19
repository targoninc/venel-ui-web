import {
    computedSignal,
    create,
    ifjs,
    signal,
    signalFromProperty,
    signalMap
} from "/f.js";
import {LayoutTemplates} from "../layout.mjs";
import {Store} from "../../api/Store.mjs";
import {CommonTemplates} from "../common.mjs";
import {Hooks, removeMessage} from "../../api/Hooks.mjs";
import {Time} from "../../tooling/Time.mjs";
import {Live} from "../../live/Live.mjs";
import {ChannelTemplates} from "../channel.mjs";
import {testImage} from "../../actions.mjs";
import {Popups} from "../../api/Popups.mjs";
import {ReactionTemplates} from "../reaction.mjs";
import {AttachmentTemplates} from "../attachment.mjs";

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
        const toBeSentAttachments = signal([]);
        const hasAttachments = computedSignal(toBeSentAttachments, attachments => {
            console.log(attachments);
            return attachments.length > 0;
        });

        return create("div")
            .classes("flex-v", "full-height")
            .children(
                create("div")
                    .classes("chat-content", "flex-v", "no-gap")
                    .children(
                        signalMap(messages, create("div")
                                .classes("chat-messages","flex-v", "flex-grow", "no-gap"),
                            message => ChatComponent.message(message, messages, menuShownForMessageId)),
                        ifjs(hasAttachments, create("div")
                            .classes("flex", "align-center", "full-width")
                            .children(
                                signalMap(toBeSentAttachments, create("div")
                                        .classes("flex", "attachment-preview", "full-width"),
                                    attachment => AttachmentTemplates.attachmentPreview(attachment, toBeSentAttachments)),
                            ).build()),
                        create("div")
                            .classes("background-2", "chat-input", "flex", "align-center")
                            .children(
                                AttachmentTemplates.attachmentButton(activeChannel, messageText, toBeSentAttachments),
                                AttachmentTemplates.voiceButton(activeChannel, messageText, toBeSentAttachments),
                                CommonTemplates.textArea(messageText, "message", null, "Write something nice...", ["flex-grow"], ["full-width-h", "message-input"], () => {
                                    if (!messageText.value || messageText.value.trim() === "" || sending.value) {
                                        return;
                                    }

                                    sending.value = true;
                                    Live.send({
                                        type: "message",
                                        channelId: activeChannel.value,
                                        text: messageText.value,
                                        attachments: toBeSentAttachments.value,
                                    });
                                    sending.value = false;
                                    messageText.value = "";
                                    toBeSentAttachments.value = [];
                                }),
                                create("div")
                                    .children(
                                        ChatComponent.sendButton(sending, messages, toBeSentAttachments, activeChannel, messageText),
                                    ).build()
                            ).build(),
                    ).build(),
            ).build();
    }

    static sendButton(sending, messages, toBeSentAttachments, activeChannel, messageText) {
        return CommonTemplates.buttonWithSpinner("send", "Send", "send", () => {
            if (sending.value) {
                return;
            }

            if ((!messageText.value || messageText.value.trim() === "") && toBeSentAttachments.value.length === 0) {
                return;
            }

            sending.value = true;
            Live.send({
                type: "message",
                channelId: activeChannel.value,
                text: messageText.value,
                attachments: toBeSentAttachments.value,
            });
            sending.value = false;
            messageText.value = "";
            toBeSentAttachments.value = [];
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
        const menuShown = computedSignal(menuShownForMessageId, id => id === message.id);
        const messageMenuPositionX = signal(0);
        const messageMenuPositionY = signal(0);
        const cardShown = signal(false);
        const reactions = message.reactions.map(reaction => {
            return {
                ...reaction,
                content: Store.get("reactions").value.find(r => r.id === reaction.id).content,
            };
        });

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
                    .classes("message-content", "full-width")
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
                        create("div")
                            .classes("relative")
                            .children(
                                ifjs(menuShown, ChatComponent.messageMenu(message, messages, messageMenuPositionX, messageMenuPositionY)),
                                create("span")
                                    .classes("message-timestamp", "text-small")
                                    .text(Time.messageTimestamp(timestamp))
                                    .build(),
                            ).build(),
                        ifjs(message.attachments.length > 0, create("div")
                            .classes("flex", "attachments", "full-width")
                            .children(
                                message.attachments.map(attachment => AttachmentTemplates.attachment(attachment)),
                            ).build()),
                        create("div")
                            .classes("flex-v", "message-text", "relative")
                            .children(
                                ifjs(message.text, create("span")
                                    .text(message.text)
                                    .build()),
                                ifjs(reactions.length > 0, ReactionTemplates.reactionDisplay(reactions, message)),
                                ReactionTemplates.reactionTrigger(message, messages),
                            ).build(),
                        create("div")
                            .classes("flex-v", "no-gap")
                            .children(
                                ifjs(edited, create("span")
                                    .classes("message-note")
                                    .text("edited " + Time.ago(new Date(message.updatedAt).getTime()))
                                    .build()),
                            ).build(),
                    ).build(),
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
}