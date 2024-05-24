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
}