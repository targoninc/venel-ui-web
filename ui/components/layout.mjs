import {computedSignal, create, signal} from "https://fjs.targoninc.com/f.js";
import {CommonTemplates} from "./common.mjs";

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

    static pane(content, defaultWidth = "50%", minWidth = "300px", maxWidth = "100%") {
        return create("div")
            .classes("pane")
            .styles("width", defaultWidth)
            .styles("min-width", minWidth)
            .styles("max-width", maxWidth)
            .children(content)
            .build();
    }

    static flexPane(content, minWidth = "300px", maxWidth = "100%") {
        return create("div")
            .classes("flex-pane")
            .styles("min-width", minWidth)
            .styles("max-width", maxWidth)
            .children(content)
            .build();
    }

    static resizableFromRight(content, defaultWidth = "50%", minWidth = "300px", maxWidth = "100%") {
        const uniqueId = Math.random().toString(36).substring(7);

        return create("div")
            .classes("pane", "resizable")
            .styles("--width", defaultWidth)
            .styles("min-width", minWidth)
            .styles("max-width", maxWidth)
            .id(uniqueId)
            .children(
                LayoutTemplates.resizeIndicator(uniqueId, "v"),
                content
            ).build();
    }

    static resizeIndicator(refId, type = "v") {
        const propertyToSet = type === "v" ? "width" : "height";
        const clientProperty = type === "v" ? "clientX" : "clientY";

        return create("div")
            .classes("resize-indicator", type)
            .onmousedown(e => {
                const startPos = e[clientProperty];
                const pane = document.getElementById(refId);
                const startSize = parseInt(getComputedStyle(pane)[propertyToSet], 10);
                document.body.style.userSelect = "none";

                const onMouseMove = e => {
                    e.preventDefault();
                    const newSize = startSize + (e[clientProperty] - startPos);
                    pane.style.setProperty(propertyToSet, `${newSize}px`);
                };

                const onMouseUp = () => {
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                    document.body.style.userSelect = "";
                };

                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
            })
            .build();
    }

    static collapsible(text, content) {
        const uniqueId = Math.random().toString(36).substring(7);
        const toggled = signal(false);
        const icon = computedSignal(toggled, on => on ? "expand_circle_up" : "expand_circle_down");
        const display = computedSignal(toggled, on => on ? "block" : "none");

        return create("div")
            .classes("collapsible", "flex-v")
            .children(
                create("div")
                    .classes("collapsible-header", "flex", "align-center")
                    .onclick(() => {
                        toggled.value = !toggled.value;
                    }).children(
                        CommonTemplates.icon(icon),
                        create("span")
                            .classes("collapsible-title")
                            .text(text)
                            .build()
                    ).build(),
                create("div")
                    .classes("collapsible-content")
                    .styles("display", display)
                    .id(uniqueId)
                    .children(content)
                    .build()
            ).build();
    }
}