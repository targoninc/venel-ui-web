import {create} from "https://fjs.targoninc.com/f.js";
import {Page} from "./routing/Page.mjs";
import {Api} from "./api/Api.mjs";

/**
 *
 * @param message {string}
 * @param type {"info" | "success" | "warning" | "error"}
 * @param timeout {number} seconds
 */
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
    }, timeout * 1000);
}

export function notify(image, title, subtitle, message, onclick = () => {}, timeout = 7) {
    const notification = create("div")
        .classes("card", "flex", "notification")
        .styles("animation-duration", `${timeout}s`)
        .onclick(onclick)
        .children(
            create("img")
                .classes("notification-image")
                .src(image)
                .build(),
            create("div")
                .classes("flex-v", "no-gap", "notification-content")
                .children(
                    create("div")
                        .classes("notification-title", "bold")
                        .text(title)
                        .build(),
                    create("div")
                        .classes("notification-subtitle")
                        .text(subtitle)
                        .build(),
                    create("span")
                        .classes("notification-message")
                        .text(message)
                        .build()
                ).build()
        ).build();

    Page.notifications.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, timeout * 1000);
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

export const testImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAIAAAB7GkOtAAAACXBIWXMAAC4jAAAuIwF4pT92AAAG/mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4wLWMwMDEgNzkuYzAyMDRiMiwgMjAyMy8wMi8wOS0wNjoyNjoxNCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI0LjQgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyMy0wNC0yNlQxNToyMDozNSswMjowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjMtMDQtMjZUMTU6MjQ6MDErMDI6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjMtMDQtMjZUMTU6MjQ6MDErMDI6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjVjM2ZlZjA0LTkwNzgtMWY0MS05Y2QxLTVjMTY5MjRjMzUyYiIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjE3MWU5NjNkLWY0YzctZGQ0Yi05ZjQ0LWJhZTRhYWNiYzRjNiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjVkMDdiNjZkLThjYzktNmE0Yy04NDlkLWFhN2ZlYWE1ZjBkNCI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NWQwN2I2NmQtOGNjOS02YTRjLTg0OWQtYWE3ZmVhYTVmMGQ0IiBzdEV2dDp3aGVuPSIyMDIzLTA0LTI2VDE1OjIwOjM1KzAyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjQuNCAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNvbnZlcnRlZCIgc3RFdnQ6cGFyYW1ldGVycz0iZnJvbSBhcHBsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIHRvIGltYWdlL3BuZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZWZhODM2MjAtZWFkZi1hMzRlLThmYWMtZDIxNTAyOTg4NWFhIiBzdEV2dDp3aGVuPSIyMDIzLTA0LTI2VDE1OjIxOjMzKzAyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjQuNCAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjVjM2ZlZjA0LTkwNzgtMWY0MS05Y2QxLTVjMTY5MjRjMzUyYiIgc3RFdnQ6d2hlbj0iMjAyMy0wNC0yNlQxNToyNDowMSswMjowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI0LjQgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNj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";

export function toggleAllowlist(instances, instance) {
    Api.toggleAllowlist(instance.id).then(res => {
        if (res.status === 200) {
            toast("Allowlist toggled", "success");
            instances.value = instances.value.map(i => {
                if (i.id === instance.id) {
                    return {
                        ...i,
                        useAllowlist: !i.useAllowlist
                    };
                }
                return i;
            });
        } else {
            toast("Failed to toggle allowlist: " + res.data.error, "error");
        }
    });
}

export function toggleInstanceEnabled(instances, instance) {
    Api.toggleEnabled(instance.id).then(res => {
        if (res.status === 200) {
            toast("Instance enabled toggled", "success");
            instances.value = instances.value.map(i => {
                if (i.id === instance.id) {
                    return {
                        ...i,
                        enabled: !i.enabled
                    };
                }
                return i;
            });
        } else {
            toast("Failed to toggle instance enabled: " + res.data.error, "error");
        }
    });
}

export function playSound(name) {
    const audio = new Audio(`/sounds/${name}`);
    audio.play();
}

export function playLoop(name) {
    if (!window.playingLoops) {
        window.playingLoops = [];
    }

    stopPlayingLoop();
    const audio = new Audio(`/loops/${name}`);
    audio.loop = true;
    audio.play();
    window.playingLoops.push(audio);

    return () => {
        audio.pause();
        audio.remove();
    };
}

export function stopPlayingLoop() {
    if (window.playingLoops) {
        window.playingLoops.forEach(audio => {
            audio.pause();
            audio.remove();
        });
    }
}

export function playReactionAnimation(content, x, y, count = 12) {
    const directions = ["top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left"];

    for (let i = 0; i < count; i++) {
        const direction = directions[Math.floor(Math.random() * directions.length)];
        const particle = create("div")
            .classes("reaction-particle")
            .styles("left", `${x}px`, "top", `${y}px`)
            .styles("animation-name", `reaction-${direction}`)
            .styles("animation-delay", `${Math.random()}s`)
            .text(content)
            .build();

        document.body.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, 2000);
    }
}