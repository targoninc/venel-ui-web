import {create} from "https://fjs.targoninc.com/f.js";
import {LayoutTemplates} from "../layout.mjs";

export class ChatComponent {
    static render() {
        return LayoutTemplates.pageFull(create("span")
            .text("Chat")
            .build());
    }
}