import {create, FjsObservable, ifjs} from "https://fjs.targoninc.com/f.js";

export class CommonTemplates {
    static icon(icon, tag = "span") {
        if ((icon.constructor === String && icon.includes(".")) || (icon.constructor === FjsObservable && icon.value.includes("."))) {
            return create("img")
                .classes("icon")
                .src(icon)
                .build();
        }

        return create(tag)
            .classes("material-symbols-outlined")
            .text(icon)
            .build();
    }

    static buttonWithIcon(icon, text, onclick, classes = []) {
        return create("button")
            .classes("flex", ...classes)
            .onclick(onclick)
            .children(
                CommonTemplates.icon(icon),
                create("span")
                    .text(text)
                    .build(),
            ).build();
    }

    static buttonWithSpinner(icon, text, id, onclick, loadingState, classes = []) {
        return create("button")
            .classes("flex", ...classes)
            .onclick(onclick)
            .id(id)
            .children(
                icon ? ifjs(loadingState, CommonTemplates.icon(icon), true) : null,
                ifjs(loadingState, create("span")
                    .text(text)
                    .build(), true),
                ifjs(loadingState, CommonTemplates.spinner()),
                ifjs(loadingState, create("span")
                    .text("Loading...")
                    .build()),
            ).build();
    }

    static select(options, onchange) {
        return create("div")
            .classes("select")
            .children(
                create("select")
                    .onchange(onchange)
                    .children(
                        ...options.map(option => {
                            return create("option")
                                .text(option)
                                .build();
                        })
                    ).build()
            ).build();
    }

    static spinner(circleCount = 4, delay = 0.2) {
        return create("div")
            .classes("spinner")
            .children(
                ...Array.from({length: circleCount}, (_, i) => {
                    return create("div")
                        .classes("spinner-circle")
                        .styles("animation-delay", `-${i * delay}s`)
                        .build();
                })
            ).build();
    }

    static userInList(image, name, text, onclick) {
        return create("button")
            .classes("flex")
            .onclick(onclick)
            .children(
                create("img")
                    .classes("round", "icon", "doublesize")
                    .src(image)
                    .build(),
                create("div")
                    .classes("flex-v", "no-gap")
                    .children(
                        create("span")
                            .classes("bold")
                            .text(name)
                            .build(),
                        create("span")
                            .text(text)
                            .build(),
                    ).build(),
            ).build();
    }

    static input(type, id, label, placeholder, value, onchange, required = true, autocomplete = "off", onkeydown = () => {}) {
        return create("div")
            .classes("flex-v", "card")
            .children(
                create("label")
                    .for(id)
                    .text(label)
                    .build(),
                create("input")
                    .type(type)
                    .id(id)
                    .placeholder(placeholder)
                    .value(value)
                    .onchange(onchange)
                    .onkeydown((e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            onkeydown(e);
                        }
                    })
                    .autocomplete(autocomplete)
                    .build()
            ).build();
    }

    static error(message) {
        return create("p")
            .classes("error")
            .text(message)
            .build();
    }

    static pageLink(text, onclick, classes = []) {
        return create("button")
            .classes("page-link", ...classes)
            .onclick(onclick)
            .text(text)
            .build();
    }
}