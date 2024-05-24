import {LayoutTemplates} from "../layout.mjs";
import {create} from "https://fjs.targoninc.com/f.js";

export class HomeComponent {
    static render() {
        return LayoutTemplates.pageFull();
    }

    static content() {
        return create("div")
            .classes("center-content")
            .build();
    }
}