import {LayoutTemplates} from "../layout.ts";
import {create} from "/f.js";
import {CommonTemplates} from "../common.ts";

export class HomeComponent {
    static render() {
        return LayoutTemplates.pageFull(
            LayoutTemplates.centeredContent(
                HomeComponent.content()
            )
        );
    }

    static content() {
        return create("div")
            .classes("flex-v")
            .children(
                CommonTemplates.pageLink("Login", "login"),
                CommonTemplates.pageLink("Register", "register"),
                CommonTemplates.pageLink("Chat", "chat"),
                CommonTemplates.pageLink("UI Test", "uitest")
            ).build();
    }
}