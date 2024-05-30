import {create, FjsObservable, ifjs, signal, signalFromProperty} from "https://fjs.targoninc.com/f.js";
import {popup, removePopups, toast} from "../actions.mjs";
import {PopupComponents} from "./popup.mjs";
import {Api} from "../api/Api.mjs";
import {Live} from "../live/Live.mjs";
import {Popups} from "../api/Popups.mjs";

export class CommonTemplates {
    static icon(icon, classes = [], tag = "span") {
        if ((icon.constructor === String && icon.includes(".")) || (icon.constructor === FjsObservable && icon.value.includes("."))) {
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

    static buttonWithIcon(icon, text, onclick, classes = []) {
        return create("button")
            .classes("flex", ...classes)
            .onclick(onclick)
            .children(
                CommonTemplates.icon(icon),
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

    static actions(userSignal) {
        const username = signalFromProperty(userSignal, "username");
        const displayname = signalFromProperty(userSignal, "displayname");

        return create("div")
            .classes("flex", "align-center", "full-width", "space-between", "padded")
            .children(
                CommonTemplates.buttonWithIcon("chat", "Chat", () => window.router.navigate('chat')),
                CommonTemplates.buttonWithIcon("person_add", "New DM", () => Popups.newDm()),
                create("div")
                    .classes("padded")
                    .children(
                        CommonTemplates.userInList("face_5", displayname, username, () => {
                            window.router.navigate('profile');
                        })
                    ).build(),
                CommonTemplates.pageLink("Logout", "logout")
            ).build();
    }

    static userInList(image, name, text, onclick) {
        return create("button")
            .classes("flex")
            .onclick(onclick)
            .children(
                CommonTemplates.icon(image, ["round", "doublesize"]),
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
}