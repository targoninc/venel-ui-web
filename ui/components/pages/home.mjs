import {LayoutTemplates} from "../layout.mjs";
import {create} from "https://fjs.targoninc.com/f.js";
import {CommonTemplates} from "../common.mjs";

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