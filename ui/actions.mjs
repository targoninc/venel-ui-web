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

export function popup(popup, classes = []) {
    const container = create("div")
        .classes("popup-container", ...classes)
        .children(popup)
        .build();

    Page.popups.appendChild(container);

    setTimeout(() => {
        document.addEventListener("click", (event) => {
            if (!container.contains(event.target)) {
                container.remove();
            }
        }, {once: true});
    }, 10);
}

export function removePopups() {
    Page.popups.innerHTML = "";
}