import {CommonTemplates} from "./common.ts";
import {AnyElement, AnyNode, compute, create, signal, StringOrSignal} from "@targoninc/jess";

export class LayoutTemplates {
    static pageFull(content: AnyNode) {
        return create("div")
            .classes("full-height")
            .children(
                LayoutTemplates.contentContainer(["full-height", "full-width"], content)
            ).build();
    }

    static contentContainer(classes: StringOrSignal[] = [], content: AnyNode) {
        return create("div")
            .classes("content-container", ...classes)
            .children(content)
            .build();
    }

    static centeredContent(content: AnyNode) {
        return create("div")
            .classes("centered-content")
            .children(content)
            .build();
    }

    static pane(content: AnyNode, defaultWidth = "50%", minWidth = "300px", maxWidth = "100%") {
        return create("div")
            .classes("pane")
            .styles("width", defaultWidth)
            .styles("min-width", minWidth)
            .styles("max-width", maxWidth)
            .children(content)
            .build();
    }

    static flexPane(content: AnyNode, minWidth = "300px", maxWidth = "100%", id: string | null = null) {
        return create("div")
            .classes("flex-pane")
            .styles("min-width", minWidth)
            .styles("max-width", maxWidth)
            .styles("width", maxWidth)
            .children(content)
            .id(id)
            .build();
    }

    static resizableFromRight(content: AnyElement, inverseRefId: string | null = null, defaultWidth = "50%", minWidth = "300px", maxWidth = "100%") {
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
    static resizeIndicator(refId: string, type = "v", minSize: string, maxSize: string, inverseRefId: string | null = null) {
        const propertyToSet = type === "v" ? "width" : "height";
        const clientProperty = type === "v" ? "clientX" : "clientY";
        const minSizeAsNumber = parseInt(minSize.replaceAll("%", ""));
        const maxSizeAsNumber = parseInt(maxSize.replaceAll("%", ""));

        return create("div")
            .classes("resize-indicator", type)
            .onmousedown(e => {
                const startPos = e[clientProperty];
                const pane = document.getElementById(refId);
                if (!pane) {
                    return;
                }
                const inversePane = inverseRefId ? document.getElementById(inverseRefId) : null;
                const startSize = pane.getBoundingClientRect()[propertyToSet];
                document.body.style.userSelect = "none";

                const onMouseMove = e => {
                    e.preventDefault();
                    const newSize = startSize + (e[clientProperty] - startPos);
                    const parentSize = pane.parentElement?.getBoundingClientRect()[propertyToSet] ?? 1;
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

    static collapsible(text: string, content: AnyElement) {
        const uniqueId = Math.random().toString(36).substring(7);
        const toggled = signal(false);
        const iconClass = compute((on): string => on ? "rot90" : "rot0", toggled);
        const gapClass = compute((v): string => v ? "gap" : "no-gap", toggled);
        let contentElement: AnyElement;
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