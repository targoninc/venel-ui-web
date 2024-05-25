import {create, signal, signalMap} from "https://fjs.targoninc.com/f.js";
import {LayoutTemplates} from "../layout.mjs";
import {Store} from "../../api/Store.mjs";
import {CommonTemplates} from "../common.mjs";

export class ChatComponent {
    static render() {
        return LayoutTemplates.pageFull(ChatComponent.content());
    }

    static content() {
        const user = Store.get('user');

        return create("div")
            .classes("panes-v", "full-width", "full-height")
            .children(
                create("div")
                    .classes("full-width")
                    .children(
                        ChatComponent.actions(user),
                    ).build(),
                create("div")
                    .classes("panes", "full-width", "full-height")
                    .children(
                        LayoutTemplates.pane(ChatComponent.channelList(), "25%", "200px",),
                        LayoutTemplates.pane(ChatComponent.chat(), "75%", "300px"),
                    ).build()
            ).build();
    }

    static channelList() {
        const activeChannel = signal(Store.get("currentChannelId"));
        activeChannel.subscribe(channel => {
            Store.set("currentChannelId", channel);
        });
        const channels = Store.get("channels");

        return signalMap(channels,
            create("div")
                .classes("flex-v")
            , ChatComponent.channel);
    }

    static chat() {
        return create("div")
            .classes("flex-v")
            .children(
                create("div")
                    .classes("message")
                    .children(
                        create("span")
                            .text("User 1: Hello!")
                            .build(),
                    ).build(),
                create("div")
                    .classes("message")
                    .children(
                        create("span")
                            .text("User 2: Hi!")
                            .build(),
                    ).build(),
            ).build();
    }

    static actions(user) {
        return create("div")
            .classes("flex")
            .children(
                CommonTemplates.userInList("face_5", user.displayname, user.username, () => {})
            ).build();
    }

    static channel(channel) {
        return create("div")
            .classes("channel")
            .children(
                create("span")
                    .text(channel.name)
                    .build(),
            ).build();
    }
}