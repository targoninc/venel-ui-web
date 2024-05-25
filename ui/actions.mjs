import {create} from "https://fjs.targoninc.com/f.js";
import {Page} from "./routing/Page.mjs";

export function toast(message, type = "info", timeout = 5) {
    const toast = create("div")
        .classes("toast", type)
        .children(
            create("span")
                .text(message)
                .build()
        ).build();

    Page.toasts.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, timeout * 10000);
}