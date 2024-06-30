import {CommonTemplates} from "./common.mjs";
import {computedSignal, create, ifjs, signal, store} from "https://fjs.targoninc.com/f.js";
import {toast} from "../actions.mjs";
import {Live} from "../live/Live.mjs";
import hljs from "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/es/highlight.min.js";

export class AttachmentTemplates {
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
                AttachmentTemplates.attachmentPreviewContent(attachment),
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

        const baseType = attachment.type.split("/")[0];
        switch (baseType) {
            case "image":
                return AttachmentTemplates.imageAttachment(attachment, url);
            case "video":
                return AttachmentTemplates.videoAttachment(attachment, url);
            case "audio":
                return AttachmentTemplates.audioAttachment(attachment, url);
            case "application":
                return AttachmentTemplates.applicationAttachment(attachment, url);
            case "text":
                return AttachmentTemplates.textAttachment(attachment, url);
            default:
                return AttachmentTemplates.fileAttachment(attachment, url);
        }
    }

    static textAttachment(attachment, url) {
        const fileContent = signal(null);
        const id = Math.random().toString(36).substring(7);
        fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        }).then(async text => {
            fileContent.value = await text.text();
            hljs.highlightElement(document.getElementById(id));
        });

        return create("div")
            .classes("attachment", "text", "relative")
            .children(
                create("pre")
                    .children(
                        create("code")
                            .id(id)
                            .text(fileContent)
                            .build()
                    ).build(),
                create("div")
                    .classes("attachment-floating-buttons", "flex")
                    .children(
                        CommonTemplates.smallIconButton("content_copy", "Copy", () => {
                            const content = fileContent.value;
                            navigator.clipboard.writeText(content);
                            toast("Copied to clipboard", "success");
                        }),
                        CommonTemplates.smallIconButton("download", "Download", () => {
                            const link = document.createElement('a');
                            const content = fileContent.value;
                            const blob = new Blob([content], {type: "text/plain"});
                            link.href = URL.createObjectURL(blob);
                            link.download = attachment.filename;
                            link.click();
                        }),
                    ).build(),
            ).build();
    }

    static applicationAttachment(attachment, url) {
        switch (attachment.type.split("/")[1]) {
            case "pdf":
                return AttachmentTemplates.pdfAttachment(attachment, url);
            case "json":
                return AttachmentTemplates.textAttachment(attachment, url);
            default:
                return AttachmentTemplates.fileAttachment(attachment, url);
        }
    }

    static pdfAttachment(attachment, url) {
        return create("div")
            .classes("attachment", "pdf")
            .children(
                create("iframe")
                    .src(url)
                    .attributes("width", "100%")
                    .attributes("height", "100%")
                    .attributes("scrolling", "no")
                    .attributes("frameborder", "0")
                    .attributes("allowfullscreen", "true")
                    .build()
            ).build();
    }

    static fileAttachment(attachment, url) {
        return CommonTemplates.buttonWithIcon("download", attachment.filename, () => {
            const link = document.createElement('a');
            link.href = url;
            link.download = attachment.filename;
            link.click();
        });
    }

    static imageAttachment(attachment, url) {
        const isFullImage = signal(false);
        const imageClass = computedSignal(isFullImage, isFull => isFull ? "full-image" : `attachment-${attachment.type.split("/")[0]}`);

        return create("div")
            .classes("attachment", attachment.type.split("/")[0])
            .onclick(() => {
                isFullImage.value = !isFullImage.value;
            })
            .children(
                create("img")
                    .classes(imageClass)
                    .src(url)
                    .attributes("loading", "lazy")
                    .build()
            ).build();
    }

    static videoAttachment(attachment, url) {
        return create("div")
            .classes("attachment", attachment.type.split("/")[0])
            .children(
                create("video")
                    .src(url)
                    .attributes("controls", "controls")
                    .attributes("type", "video/mp4")
                    .build()
            ).build();
    }

    static audioAttachment(attachment, url) {
        return create("div")
            .classes("attachment", attachment.type.split("/")[0])
            .children(
                create("audio")
                    .src(url)
                    .attributes("controls", "controls")
                    .build()
            ).build();
    }

    static voiceButton(activeChannel, messageText) {
        const recording = signal(false);
        const icon = computedSignal(recording, recording => recording ? "send" : "mic");
        const data = signal(null);
        const dontSend = signal(false);
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
            .classes("flex", "align-center")
            .children(
                create("div")
                    .classes("voice-button", "relative")
                    .children(
                        create("div")
                            .classes("recording-indicator", identifierClass)
                            .build(),
                        CommonTemplates.buttonWithIcon(icon, null, async () => {
                            if (!recording.value) {
                                recording.value = true;
                                dontSend.value = false;
                                const stream = await navigator.mediaDevices.getUserMedia({audio: true});
                                mediaRecorder = new MediaRecorder(stream);
                                mediaRecorder.ondataavailable = (e) => {
                                    if (dontSend.value) {
                                        return;
                                    }
                                    data.value = e.data;
                                };
                                mediaRecorder.start();
                            } else {
                                recording.value = false;
                                mediaRecorder.stop();
                                mediaRecorder = null;
                            }
                        }, ["icon-button"]),
                    ).build(),
                ifjs(recording, CommonTemplates.buttonWithIcon("stop", "Discard", () => {
                    dontSend.value = true;
                    recording.value = false;
                    mediaRecorder.stop();
                    mediaRecorder = null;
                }))
            ).build();
    }
}