import {create} from "https://fjs.targoninc.com/f.js";

export class LayoutTemplates {
    static pageFull(content) {
        return create("div")
            .classes("full-height")
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

    static centeredContent(content) {
        return create("div")
            .classes("centered-content")
            .children(content)
            .build();
    }

    static pane(content, defaultWidth = "50%", minWidth = "300px") {
        return create("div")
            .classes("pane")
            .styles("--width", defaultWidth)
            .styles("min-width", minWidth)
            .children(content)
            .build();
    }
}