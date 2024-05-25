import {create} from "https://fjs.targoninc.com/f.js";

export class CommonTemplates {
    static buttonWithIcon(icon, text, onclick) {
        return create("button")
            .classes("flex")
            .onclick(onclick)
            .children(
                create("i")
                    .classes("material-symbols-outlined")
                    .text(icon)
                    .build(),
                create("span")
                    .text(text)
                    .build(),
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
}