import {create} from "https://fjs.targoninc.com/f.js";
import {LayoutTemplates} from "../layout.mjs";
import {CommonTemplates} from "../common.mjs";

export class UiTestComponent {
    static render() {
        return LayoutTemplates.pageFull(UiTestComponent.content());
    }

    static content() {
        return create("div")
            .classes("flex-v", "padded")
            .children(
                UiTestComponent.headingsAndText(),
                UiTestComponent.interactables(),
            )
            .build();
    }

    static headingsAndText() {
        return create("div")
            .classes("flex-v")
            .children(
                create("h1")
                    .text("Main heading")
                    .build(),
                create("p")
                    .text("Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.")
                    .build(),
                create("h2")
                    .text("Sub heading")
                    .build(),
                create("p")
                    .text("Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat.")
                    .build(),
            ).build();
    }

    static interactables() {
        return create("div")
            .classes("flex-v")
            .children(
                CommonTemplates.buttonWithIcon("add", "Add", () => {
                    console.log("Button clicked");
                }),
                create("input")
                    .type("text")
                    .placeholder("Enter text")
                    .oninput((e) => {
                        console.log(e.target.value);
                    })
                    .build(),
                create("textarea")
                    .placeholder("Enter text")
                    .oninput((e) => {
                        console.log(e.target.value);
                    })
                    .build(),
                create("select")
                    .children(
                        create("option")
                            .text("Option 1")
                            .build(),
                        create("option")
                            .text("Option 2")
                            .build(),
                        create("option")
                            .text("Option 3")
                            .build(),
                    )
                    .onchange((e) => {
                        console.log(e.target.value);
                    })
                    .build(),
            ).build();
    }
}
