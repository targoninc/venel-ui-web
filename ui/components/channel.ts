import {Live} from "../live/Live.ts";
import {truncate} from "../tooling/Text.ts";
import {testImage} from "../actions.ts";
import {compute, create, InputType, Signal, signal, signalMap, when} from "@targoninc/jess";
import {store} from "../compat";
import {Channel, Message} from "../models/models";
import {target} from "../index";

export class ChannelTemplates {
    static dmChannel(channel: Channel, messages: Signal<Message[]>, activeChannel: Signal<number | null>) {
        const activeClass = compute((id): string => id === channel.id ? "active" : "_", activeChannel);
        let lastMemberAvatar = channel.members.at(-1)?.avatar;
        if (channel.type === "dm" && channel.members.length > 1) {
            lastMemberAvatar = channel.members.find(member => member.id !== store().get("user").value.id)?.avatar ?? testImage;
        }

        return create("div")
            .classes("channel", "flex", "no-wrap", "full-width", activeClass)
            .onclick(() => {
                activeChannel.value = channel.id;
                window.history.pushState({}, "", `/chat/${channel.id}`);
            })
            .children(
                create("img")
                    .classes("channel-avatar")
                    .src(channel.avatar ?? lastMemberAvatar ?? testImage)
                    .build(),
                create("div")
                    .classes("flex-v", "no-gap")
                    .children(
                        create("span")
                            .classes("bold")
                            .text(channel.name)
                            .build(),
                        create("span")
                            .classes("text-small", "one-line")
                            .text(truncate(messages.value[channel.id]?.at(-1)?.text || "No messages", 100))
                            .build(),
                    ).build(),
            ).build();
    }

    static groupChannel(channel: Channel, messages: Signal<Message[]>, activeChannel: Signal<number | null>) {
        const activeClass = compute<string, [number | null]>((id) => id === channel.id ? "active" : "_", activeChannel);
        const editing = signal(false);

        return create("div")
            .classes("channel", "flex", "no-wrap", "full-width", activeClass)
            .onclick(() => {
                activeChannel.value = channel.id;
            })
            .children(
                when(editing, create("input")
                    .type(InputType.text)
                    .value(channel.name)
                    .onchange((e) => {
                        Live.send({
                            type: "updateChannel",
                            channelId: channel.id,
                            name: target(e).value,
                        });
                    }).build()),
                when(editing, create("span")
                    .text(channel.name)
                    .build(), true),
                create("span")
                    .classes("text-small")
                    .text("Group")
                    .build(),
            ).build();
    }

    static channelList(channels: Signal<Channel[]>, messages: Signal<Message[]>, activeChannel: Signal<number | null>) {
        return signalMap(channels,
            create("div")
                .classes("flex-v", "no-gap", "full-width", "full-height")
            , channel => {
                if (channel.type === "gr") {
                    return ChannelTemplates.groupChannel(channel, messages, activeChannel);
                } else {
                    return ChannelTemplates.dmChannel(channel, messages, activeChannel);
                }
            });
    }
}