import {create} from "https://fjs.targoninc.com/f.js";

export class LayoutTemplates {
    static pageFull(content) {
        return create("div")
            .classes("page")
            .children(
                LayoutTemplates.contentContainer(["full-height", "full-width"], content)
            ).build();
    }

    static contentContainer(classes = [], content) {
        return create("div")
            .classes("content-container", ...classes)
            .children(content)
            .build();
    }
}