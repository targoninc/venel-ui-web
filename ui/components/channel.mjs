import {computedSignal, create, ifjs, signal, signalMap} from "https://fjs.targoninc.com/f.js";
import {Live} from "../live/Live.mjs";
import {truncate} from "../tooling/Text.mjs";

export class ChannelTemplates {
    static dmChannel(channel, messages, activeChannel) {
        const activeClass = computedSignal(activeChannel, (id) => id === channel.id ? "active" : "_");

        return create("div")
            .classes("channel", "flex-v", "no-gap", "full-width", activeClass)
            .onclick(() => {
                activeChannel.value = channel.id;
                window.history.pushState({}, "", `/chat/${channel.id}`);
            })
            .children(
                create("span")
                    .text(channel.name)
                    .build(),
                create("span")
                    .classes("text-small", "one-line")
                    .text(truncate(messages.value[channel.id]?.at(-1)?.text || "No messages", 100))
                    .build(),
            ).build();
    }

    static groupChannel(channel, messages, activeChannel) {
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

    static channelList(channels, messages, activeChannel) {
        return signalMap(channels,
            create("div")
                .classes("flex-v", "no-gap")
            , channel => {
                if (channel.type === "gr") {
                    return ChannelTemplates.groupChannel(channel, messages, activeChannel);
                } else {
                    return ChannelTemplates.dmChannel(channel, messages, activeChannel);
                }
            });
    }
}