import {
    computedSignal,
    create,
    ifjs,
    signal,
    signalFromProperty,
    signalMap,
    store
} from "https://fjs.targoninc.com/f.js";
import {LayoutTemplates} from "../layout.mjs";
import {Store} from "../../api/Store.mjs";
import {CommonTemplates} from "../common.mjs";
import {Hooks, removeMessage} from "../../api/Hooks.mjs";
import {Time} from "../../tooling/Time.mjs";
import {Live} from "../../live/Live.mjs";
import {ChannelTemplates} from "../channel.mjs";
import {testImage, toast} from "../../actions.mjs";
import {Popups} from "../../api/Popups.mjs";
import {ReactionTemplates} from "../reaction.mjs";

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
                                    attachment => ChatComponent.attachmentPreview(attachment, toBeSentAttachments)),
                            ).build()),
                        create("div")
                            .classes("background-2", "chat-input", "flex", "align-center")
                            .children(
                                ChatComponent.attachmentButton(activeChannel, messageText, toBeSentAttachments),
                                ChatComponent.voiceButton(activeChannel, messageText, toBeSentAttachments),
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
                                message.attachments.map(attachment => ChatComponent.attachment(attachment)),
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

    static attachmentButton(activeChannel, messageText, toBeSentAttachments) {
        return CommonTemplates.buttonWithIcon("attach_file", "", () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.onchange = () => {
                for (const file of input.files) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        let base64 = reader.result.split(',')[1];
                        if (base64.constructor.name === "Buffer") {
                            base64 = base64.toString("base64");
                        }

                        const maxPayloadSizeInMb = store().get("maxPayloadSizeInMb");
                        if (maxPayloadSizeInMb && base64.length > maxPayloadSizeInMb * 1024 * 1024) {
                            toast("File is too large, must be smaller than " + maxPayloadSizeInMb + "MB", "error");
                            return;
                        }

                        toBeSentAttachments.value = [...toBeSentAttachments.value, {
                            filename: file.name,
                            type: file.type,
                            data: base64,
                        }];
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        }, ["icon-button"]);
    }

    static attachmentPreview(attachment, toBeSentAttachments) {
        return create("div")
            .classes("flex-v", "align-center", "relative")
            .children(
                ChatComponent.attachmentPreviewContent(attachment),
                CommonTemplates.smallIconButton("delete", "Delete", () => {
                    toBeSentAttachments.value = toBeSentAttachments.value.filter(a => a.filename !== attachment.filename);
                }, ["attachment-remove-button"]),
            ).build();
    }

    static attachmentPreviewContent(attachment) {
        let tag, source = `data:${attachment.type};base64,${attachment.data}`;
        const baseType = attachment.type.split("/")[0];
        switch (baseType) {
            case "image":
                tag = "img";
                break;
            case "video":
                tag = "video";
                break;
            case "audio":
                tag = "audio";
                break;
            default:
                tag = "div";
                break;
        }
        const content = create(tag)
            .classes(baseType ? `attachment-preview-${baseType}` : "attachment-preview-file")
            .src(source);

        if (tag === "audio") {
            content.attributes("controls", "controls");
        } else if (tag === "img") {
            content.attributes("loading", "lazy");
        } else if (tag === "video") {
            content.attributes("controls", "controls");
            content.attributes("type", "video/mp4");
            content.title("Video previews are not supported yet");
        } else {
            return create("div")
                .classes("attachment-preview-file", "align-center")
                .text(attachment.filename)
                .build();
        }

        return content.build();
    }

    static attachment(attachment) {
        const apiUrl = sessionStorage.getItem("apiUrl");
        const url = apiUrl + `/attachments/${encodeURIComponent(attachment.messageId)}/${encodeURIComponent(attachment.filename)}`;
        let tag;
        switch (attachment.type.split("/")[0]) {
            case "image":
                tag = "img";
                break;
            case "video":
                tag = "video";
                break;
            case "audio":
                tag = "audio";
                break;
            default:
                tag = "div";
                break;
        }
        const isFullImage = signal(false);
        const imageClass = computedSignal(isFullImage, isFull => isFull && tag === "img" ? "full-image" : `attachment-${attachment.type.split("/")[0]}`);

        const content = create(tag)
            .classes(imageClass)
            .src(url);

        if (tag === "audio") {
            content.attributes("controls", "controls");
        } else if (tag === "img") {
            content.attributes("loading", "lazy");
        } else if (tag === "video") {
            content.attributes("controls", "controls");
        } else {
            return CommonTemplates.buttonWithIcon("download", attachment.filename, () => {
                const link = document.createElement('a');
                link.href = url;
                link.download = attachment.filename;
                link.click();
            });
        }

        return create("div")
            .classes("attachment", attachment.type.split("/")[0])
            .onclick(() => {
                isFullImage.value = !isFullImage.value;
            })
            .children(
                content.build()
            ).build();
    }

    static voiceButton(activeChannel, messageText) {
        const recording = signal(false);
        const icon = computedSignal(recording, recording => recording ? "stop" : "mic");
        const data = signal(null);
        const identifierClass = computedSignal(recording, rec => rec ? "recording" : "stopped");
        data.subscribe(data => {
            if (!data) {
                return;
            }

            const reader = new FileReader();
            reader.readAsDataURL(data);
            reader.onloadend = () => {
                let base64 = reader.result.split(',')[1];
                if (base64.constructor.name === "Buffer") {
                    base64 = base64.toString("base64");
                }

                Live.send({
                    type: "message",
                    channelId: activeChannel.value,
                    attachments: [{
                        filename: "voice_recording.ogg",
                        type: "audio/ogg",
                        data: base64,
                    }],
                });
            };
            messageText.value = "";
        });
        let mediaRecorder;

        return create("div")
            .classes("voice-button", "relative")
            .children(
                create("div")
                    .classes("recording-indicator", identifierClass)
                    .build(),
                CommonTemplates.buttonWithIcon(icon, null, async () => {
                    if (!recording.value) {
                        recording.value = true;
                        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
                        mediaRecorder = new MediaRecorder(stream);
                        mediaRecorder.ondataavailable = (e) => {
                            data.value = e.data;
                        };
                        mediaRecorder.start();
                    } else {
                        recording.value = false;
                        mediaRecorder.stop();
                        mediaRecorder = null;
                    }
                }, ["icon-button"])
            ).build();
    }
}