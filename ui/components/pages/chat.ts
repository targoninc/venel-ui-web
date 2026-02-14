import {LayoutTemplates} from "../layout.ts";
import {channels, currentChannelId, currentUser, messages, reactions} from "../../api/Store.ts";
import {CommonTemplates} from "../common.ts";
import {Hooks, removeMessage} from "../../api/Hooks.ts";
import {Time} from "../../tooling/Time.ts";
import {Live} from "../../live/Live.ts";
import {ChannelTemplates} from "../channel.ts";
import {testImage} from "../../actions.ts";
import {Popups} from "../../api/Popups.ts";
import {ReactionTemplates} from "../reaction.ts";
import {AttachmentTemplates} from "../attachment.ts";
import {VirtualList} from "../../tooling/VirtualList.ts";
import {create, signal, compute, signalMap, when, Signal} from "@targoninc/jess";
import {target} from "../../index";
import {Id, Message} from "../../models/models";

export class ChatComponent {
    static render(params) {
        return LayoutTemplates.pageFull(ChatComponent.content(params));
    }

    static content(params) {
        const pathChannelId = params.channelId ? parseInt(params.channelId) : null;
        const activeChannel = signal(pathChannelId || currentChannelId.value || channels[0]?.id || null);
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
            currentChannelId.value = channel;
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
                        LayoutTemplates.resizableFromRight(
                            ChannelTemplates.channelList(displayChannels, messages, activeChannel), inverseRefId,
                            "20%", "10%", "50%"
                        ),
                        when(activeChannel, LayoutTemplates.flexPane(ChatComponent.chat(activeChannel), "300px", "100%", inverseRefId)),
                        when(activeChannel, LayoutTemplates.flexPane(create("span").text("No channel selected").build(), "300px", "100%", inverseRefId), true)
                    ).build()
            ).build();
    }

    static chat(activeChannel: Signal<Id | null>) {
        const sending = signal(false);
        const messageText = signal("");
        const displayedMsgs = compute((msgs, a) => {
            if (!a) {
                return [];
            }

            const out = msgs[a] || [];
            return out.sort((a, b) => {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });
        }, messages, activeChannel);
        const menuShownForMessageId = signal<Id | null>(null);
        const toBeSentAttachments = signal([]);
        const hasAttachments = compute(attachments => {
            console.log(attachments);
            return attachments.length > 0;
        }, toBeSentAttachments);

        return create("div")
            .classes("flex-v", "full-height")
            .children(
                create("div")
                    .classes("chat-content", "flex-v", "no-gap")
                    .children(
                        VirtualList.render(displayedMsgs,
                            message => ChatComponent.message(message, displayedMsgs, menuShownForMessageId),
                            {
                                itemHeight: 80, // Estimate
                                scanCount: 10,
                                classes: ["chat-messages", "flex-v", "flex-grow", "no-gap"],
                                styles: []
                            }
                        ),
                        when(hasAttachments, create("div")
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
                                AttachmentTemplates.voiceButton(activeChannel, messageText),
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
                                        ChatComponent.sendButton(sending, displayedMsgs, toBeSentAttachments, activeChannel, messageText),
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

    static message(message: Message, messages: Signal<Message[]>, menuShownForMessageId: Signal<Id | null>) {
        const messageIndex = messages.value.indexOf(message);
        const previousMessage = messages.value[messageIndex - 1];
        let shouldDisplaySender = true;
        if (previousMessage && previousMessage.sender.id === message.sender.id) {
            shouldDisplaySender = false;
        }
        const edited = message.createdAt !== message.updatedAt;
        const timestamp = new Date(message.createdAt).getTime();
        const menuShown = compute(id => id === message.id, menuShownForMessageId);
        const messageMenuPositionX = signal(0);
        const messageMenuPositionY = signal(0);
        const cardShown = signal(false);
        const reacts = message.reactions.map(reaction => {
            return {
                ...reaction,
                content: reactions.value.find(r => r.id === reaction.reactionId)?.content,
            };
        });

        return create("div")
            .classes("chat-message", "flex-v", "no-gap")
            .children(
                when(shouldDisplaySender, create("div")
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
                        messageMenuPositionX.value = e.clientX - target(e).getBoundingClientRect().left;
                        messageMenuPositionY.value = e.clientY - target(e).getBoundingClientRect().top;
                        document.addEventListener("click", () => {
                            menuShownForMessageId.value = null;
                        }, {once: true});
                    })
                    .children(
                        create("div")
                            .classes("relative")
                            .children(
                                when(menuShown, ChatComponent.messageMenu(message, messages, messageMenuPositionX, messageMenuPositionY)),
                                create("span")
                                    .classes("message-timestamp", "text-small")
                                    .text(Time.messageTimestamp(timestamp))
                                    .build(),
                            ).build(),
                        when(message.attachments.length > 0, create("div")
                            .classes("flex", "attachments", "full-width")
                            .children(
                                ...message.attachments.map(attachment => AttachmentTemplates.attachment(attachment)),
                            ).build()),
                        create("div")
                            .classes("flex-v", "message-text", "relative")
                            .children(
                                when(message.text, create("span")
                                    .text(message.text)
                                    .build()),
                                when(reacts.length > 0, ReactionTemplates.reactionDisplay(reacts, message)),
                                ReactionTemplates.reactionTrigger(message, messages),
                            ).build(),
                        create("div")
                            .classes("flex-v", "no-gap")
                            .children(
                                when(edited, create("span")
                                    .classes("message-note")
                                    .text("edited " + Time.ago(new Date(message.updatedAt).getTime()))
                                    .build()),
                            ).build(),
                    ).build(),
            ).build();
    }

    static messageMenu(message: Message, messages: Signal<Message[]>, posX: Signal<number>, posY: Signal<number>) {
        const posXR = compute(x => x + "px", posX);
        const posYR = compute(y => y + "px", posY);
        const permissions = compute((u: any) => u.permissions, currentUser);
        const sameUser = compute((u: any) => u.id === message.sender.id, currentUser);
        const hasDeletePermission = compute(p => p.some(perm => perm.name === "deleteMessage"), permissions);
        const canDelete = compute(isSame => isSame || hasDeletePermission.value, sameUser);
        const menuClass = compute((can): string => (can || sameUser.value) ? "_" : "no-content", canDelete);

        return create("div")
            .classes("message-menu", "flex-v", menuClass)
            .styles("top", posYR, "left", posXR)
            .children(
                when(sameUser, CommonTemplates.buttonWithIcon("edit", "Edit", () => {
                    Popups.editMessage(message, messages);
                })),
                when(canDelete, CommonTemplates.buttonWithIcon("delete", "Delete", () => {
                    Live.send({
                        type: "removeMessage",
                        messageId: message.id,
                    });
                    removeMessage(message.channelId, message.id);
                })),
            ).build();
    }
}