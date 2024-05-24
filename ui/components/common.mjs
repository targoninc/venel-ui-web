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
}