import {computedSignal, create, when, signal, signalMap, store} from "/f.js";
import {Live} from "../live/Live.ts";
import {truncate} from "../tooling/Text.ts";
import {testImage} from "../actions.ts";

export class ChannelTemplates {
    static dmChannel(channel, messages, activeChannel) {
        const activeClass = computedSignal(activeChannel, id => {
            return id === channel.id ? "active" : "_";
        });
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

    static groupChannel(channel, messages, activeChannel) {
        const activeClass = computedSignal(activeChannel, (id) => id === channel.id ? "active" : "_");
        const editing = signal(false);

        return create("div")
            .classes("channel", "flex", "no-wrap", "full-width", activeClass)
            .onclick(() => {
                activeChannel.value = channel.id;
            })
            .children(
                when(editing, create("input")
                    .type("text")
                    .value(channel.name)
                    .onchange((e) => {
                        Live.send({
                            type: "updateChannel",
                            channelId: channel.id,
                            name: e.target.value,
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

    static channelList(channels, messages, activeChannel) {
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