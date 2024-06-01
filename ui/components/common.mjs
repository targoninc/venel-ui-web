import {computedSignal, create, FjsObservable, ifjs} from "https://fjs.targoninc.com/f.js";
import {Popups} from "../api/Popups.mjs";
import {Store} from "../api/Store.mjs";
import {testImage} from "../actions.mjs";

export class CommonTemplates {
    static icon(icon, classes = [], tag = "span") {
        if (!icon) {
            icon = testImage;
        }

        if ((icon.constructor === String && (icon.includes(".") || icon.startsWith("data:image"))) || (icon.constructor === FjsObservable && icon.value &&
            (icon.value.includes(".") || icon.value.startsWith("data:image")))) {
            return create("img")
                .classes("icon", ...classes)
                .src(icon)
                .build();
        }

        return create(tag)
            .classes("material-symbols-outlined", ...classes)
            .text(icon)
            .build();
    }

    static buttonWithIcon(icon, text, onclick, classes = [], iconClasses = []) {
        return create("button")
            .classes("flex", ...classes)
            .onclick(onclick)
            .children(
                CommonTemplates.icon(icon, iconClasses),
                create("span")
                    .text(text)
                    .build(),
            ).build();
    }

    static buttonWithSpinner(icon, text, id, onclick, loadingState, classes = []) {
        return create("button")
            .classes("flex", ...classes)
            .onclick(onclick)
            .id(id)
            .children(
                icon ? ifjs(loadingState, CommonTemplates.icon(icon), true) : null,
                ifjs(loadingState, create("span")
                    .text(text)
                    .build(), true),
                ifjs(loadingState, CommonTemplates.spinner()),
                ifjs(loadingState, create("span")
                    .text("Loading...")
                    .build()),
            ).build();
    }

    static select(label, options, value, onchange) {
        return create("div")
            .classes("flex", "align-center")
            .children(
                create("span")
                    .text(label)
                    .build(),
                create("div")
                    .classes("select")
                    .children(
                        create("select")
                            .onchange((e) => {
                                onchange(e.target.value);
                            })
                            .children(
                                ...options.map(option => {
                                    const selected = computedSignal(value, value => option.value === value);

                                    return create("option")
                                        .text(option.text)
                                        .value(option.value)
                                        .selected(selected)
                                        .onclick(() => {
                                            onchange(option.value);
                                        })
                                        .build();
                                })
                            ).build()
                    ).build()
            ).build();
    }

    static spinner(circleCount = 4, delay = 0.2) {
        return create("div")
            .classes("spinner")
            .children(
                ...Array.from({length: circleCount}, (_, i) => {
                    return create("div")
                        .classes("spinner-circle")
                        .styles("animation-delay", `-${i * delay}s`)
                        .build();
                })
            ).build();
    }

    static actions() {
        const currentRoute = window.router.currentRoute;
        const activeIfActive = page => {
            return (currentRoute && currentRoute.path === page) ? "active" : "_";
        };
        const user = Store.get('user');
        const avatar = computedSignal(user, user => user && user.avatar ? user.avatar : testImage);
        const hasAnyRole = computedSignal(user, user => user && user.roles && user.roles.length > 0);

        return create("nav")
            .classes("flex", "align-center", "full-width", "space-between", "padded", "fixed")
            .children(
                create("div")
                    .classes("flex", "align-center")
                    .children(
                        CommonTemplates.buttonWithIcon("chat", "Chat", () => window.router.navigate('chat'), [activeIfActive("chat")]),
                        CommonTemplates.buttonWithIcon("person_add", "New DM", () => Popups.newDm()),
                    ).build(),
                ifjs(hasAnyRole, create("div")
                    .classes("flex", "align-center")
                    .children(
                        CommonTemplates.buttonWithIcon("settings", "Settings", () => window.router.navigate('settings'), [activeIfActive("settings")]),
                    ).build()),
                create("div")
                    .classes("flex", "align-center")
                    .children(
                        CommonTemplates.buttonWithIcon(avatar, "Profile", () => window.router.navigate('profile'), [activeIfActive("profile")], ["small-avatar"]),
                        CommonTemplates.pageLink("Logout", "logout")
                    ).build(),
            ).build();
    }

    static circleToggle(text, color = "var(--blue)", onclick = () => {}) {
        return create("div")
            .classes("flex", "align-center", "circle-toggle")
            .onclick(onclick)
            .children(
                create("span")
                    .classes("circle")
                    .styles("background-color", color)
                    .build(),
                create("span")
                    .text(text)
                    .build()
            ).build();
    }

    static userInList(image, name, text, onclick, avatarClass = "channel-avatar") {
        return create("button")
            .classes("flex")
            .onclick(onclick)
            .children(
                CommonTemplates.icon(image, ["round", avatarClass]),
                create("div")
                    .classes("flex-v", "no-gap")
                    .children(
                        create("span")
                            .classes("bold")
                            .text(name)
                            .build(),
                        ifjs(text, create("span")
                            .text(text)
                            .build()),
                    ).build(),
            ).build();
    }

    static chatWithButton(username, onclick) {
        return create("button")
            .classes("flex", "align-center", "small-gap", "full-width", "space-between")
            .onclick(onclick)
            .children(
                CommonTemplates.icon("chat"),
                create("span")
                    .classes("bold")
                    .text(username)
                    .build(),
            ).build();
    }

    static addUserButton(username, onclick) {
        return create("button")
            .classes("flex", "align-center", "small-gap", "full-width", "space-between")
            .onclick(onclick)
            .children(
                CommonTemplates.icon("person_add"),
                create("span")
                    .classes("bold")
                    .text(username)
                    .build(),
            ).build();
    }

    static input(type, id, label, placeholder, value, onchange, required = true, autocomplete = "off", onkeydown = () => {}) {
        return create("div")
            .classes("flex-v", "small-gap")
            .children(
                create("label")
                    .for(id)
                    .text(label)
                    .build(),
                create("input")
                    .type(type)
                    .id(id)
                    .placeholder(placeholder)
                    .value(value)
                    .onchange(onchange)
                    .onkeydown((e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            onkeydown(e);
                        }
                    })
                    .autocomplete(autocomplete)
                    .build()
            ).build();
    }

    static responsiveInput(type, id, label, placeholder, value, oninput, required = true, autocomplete = "off", onkeydown = () => {}) {
        return create("div")
            .classes("flex-v", "small-gap")
            .children(
                create("label")
                    .for(id)
                    .text(label)
                    .build(),
                create("input")
                    .type(type)
                    .id(id)
                    .placeholder(placeholder)
                    .value(value)
                    .oninput(oninput)
                    .onkeydown((e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            onkeydown(e);
                        }
                    })
                    .autocomplete(autocomplete)
                    .build()
            ).build();
    }

    static error(message) {
        return create("span")
            .classes("error")
            .text(message)
            .build();
    }

    static pageLink(text, target, classes = []) {
        const isExternal = target.startsWith("http");
        return create("a")
            .href(target)
            .target("_blank")
            .onclick((e) => {
                const middleClick = e.button === 1;
                if (!isExternal && !middleClick) {
                    e.preventDefault();
                    window.router.navigate(target);
                } else {
                    window.open(e.target.href, "_blank");
                }
            })
            .classes("page-link", "flex", "align-center", ...classes)
            .children(
                create("span")
                    .text(text)
                    .build(),
                CommonTemplates.icon(isExternal ? "open_in_new" : "arrow_forward")
            ).build();
    }

    static warning(text) {
        return create("div")
            .classes("warning", "flex")
            .children(
                CommonTemplates.icon("warning"),
                create("span")
                    .text(text)
                    .build()
            ).build();
    }

    static textArea(value, id, label = null, placeholder = null, classes = [], subClasses = [], onenter = () => {}) {
        const resize = (area) => {
            area.style.height = "auto";
            if (area.scrollHeight > 100) {
                area.style.overflowY = "scroll";
                area.style.height = "100px";
            } else {
                area.style.height = `${area.scrollHeight - 8}px`;
            }
        }

        return create("div")
            .classes("flex-v", "small-gap", ...classes)
            .children(
                ifjs(label, create("label")
                    .for(id)
                    .text(label)
                    .build()),
                create("textarea")
                    .id(id)
                    .classes(...subClasses)
                    .placeholder(placeholder)
                    .value(value)
                    .attributes("rows", "1")
                    .onkeydown((e) => {
                        if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
                            e.preventDefault();
                            onenter(e);
                        } else {
                            if (subClasses.includes("message-input")) {
                                resize(e.target);
                            }
                        }
                    })
                    .oninput((e) => {
                        value.value = e.target.value;
                        if (subClasses.includes("message-input")) {
                            resize(e.target);
                        }
                    })
                    .build()
            ).build();
    }

    static checkbox(id, label, value, onchange) {
        return create("div")
            .classes("flex", "small-gap")
            .children(
                create("input")
                    .type("checkbox")
                    .id(id)
                    .checked(value)
                    .onchange(onchange)
                    .build(),
                create("label")
                    .for(id)
                    .text(label)
                    .build()
            ).build();
    }

    static smallCard(icon, text) {
        return create("div")
            .classes("small-card", "flex", "align-center")
            .children(
                CommonTemplates.icon(icon),
                create("span")
                    .text(text)
                    .build()
            ).build();
    }

    static chatUser(avatar, name, onclick) {
        return create("div")
            .classes("flex", "align-center", "chat-user")
            .onclick(onclick)
            .children(
                CommonTemplates.icon(avatar, ["round", "message-avatar"]),
                create("span")
                    .classes("bold", "message-username")
                    .text(name)
                    .build()
            ).build();
    }
}