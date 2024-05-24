import {create} from "https://fjs.targoninc.com/f.js";
import {LayoutTemplates} from "../layout.mjs";

export class LoginComponent {
    static render() {
        return LayoutTemplates.pageFull(create("span")
            .text("Login")
            .build());
    }
}