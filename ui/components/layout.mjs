import {computedSignal, create, signal} from "/f.js";
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

    static flexPane(content, minWidth = "300px", maxWidth = "100%", id = null) {
        return create("div")
            .classes("flex-pane")
            .styles("min-width", minWidth)
            .styles("max-width", maxWidth)
            .styles("width", maxWidth)
            .children(content)
            .id(id)
            .build();
    }

    static resizableFromRight(content, inverseRefId = null, defaultWidth = "50%", minWidth = "300px", maxWidth = "100%") {
        const uniqueId = Math.random().toString(36).substring(7);

        return create("div")
            .classes("resizable")
            .styles("width", defaultWidth)
            .styles("min-width", minWidth)
            .styles("max-width", maxWidth)
            .id(uniqueId)
            .children(
                LayoutTemplates.resizeIndicator(uniqueId, "v", minWidth, maxWidth, inverseRefId),
                content
            ).build();
    }

    /**
     *
     * @param refId
     * @param type
     * @param minSize percentage of parent
     * @param maxSize percentage of parent
     * @param inverseRefId
     * @returns {*}
     */
    static resizeIndicator(refId, type = "v", minSize, maxSize, inverseRefId = null) {
        const propertyToSet = type === "v" ? "width" : "height";
        const clientProperty = type === "v" ? "clientX" : "clientY";
        const minSizeAsNumber = parseInt(minSize.replaceAll("%", ""));
        const maxSizeAsNumber = parseInt(maxSize.replaceAll("%", ""));

        return create("div")
            .classes("resize-indicator", type)
            .onmousedown(e => {
                const startPos = e[clientProperty];
                const pane = document.getElementById(refId);
                const inversePane = inverseRefId ? document.getElementById(inverseRefId) : null;
                const startSize = pane.getBoundingClientRect()[propertyToSet];
                document.body.style.userSelect = "none";

                const onMouseMove = e => {
                    e.preventDefault();
                    const newSize = startSize + (e[clientProperty] - startPos);
                    const parentSize = pane.parentElement.getBoundingClientRect()[propertyToSet];
                    const newPercent = newSize / parentSize * 100;
                    if (newPercent < minSizeAsNumber || newPercent > maxSizeAsNumber) {
                        return;
                    }
                    pane.style.setProperty(propertyToSet, `${newPercent}%`);
                    if (inversePane) {
                        inversePane.style.setProperty(propertyToSet, `${100 - newPercent}%`);
                    }
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
        const iconClass = computedSignal(toggled, on => on ? "rot90" : "rot0");
        const gapClass = computedSignal(toggled, v => v ? "gap" : "no-gap");
        let contentElement;
        const setMaxHeight = () => {
            if (toggled.value) {
                contentElement.style.maxHeight = contentElement.scrollHeight + 'px';
            } else {
                contentElement.style.maxHeight = '0';
            }
        };

        contentElement = create("div")
            .classes("collapsible-content")
            .id(uniqueId)
            .children(content)
            .build()

        return create("div")
            .classes("collapsible", "flex-v", gapClass)
            .children(
                create("div")
                    .classes("collapsible-header", "flex", "align-center")
                    .onclick(() => {
                        toggled.value = !toggled.value;
                        setMaxHeight();
                    })
                    .children(
                        CommonTemplates.icon("expand_circle_right", [iconClass]),
                        create("span")
                            .classes("collapsible-title")
                            .text(text)
                            .build()
                    ).build(),
                contentElement
            ).build();
    }
}