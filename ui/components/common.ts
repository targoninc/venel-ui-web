import {testImage} from "../actions.ts";
import {compute, create, HtmlPropertyValue, InputType, isSignal, Signal, StringOrSignal, when} from "@targoninc/jess";
import {router} from "../routing/RouterInstance.ts";
import {User} from "../models/models";
import {target} from "../index";
import {currentUser} from "../api/Store";
import {Popups} from "../api/Popups";

export class CommonTemplates {
    static icon(icon: StringOrSignal, classes: StringOrSignal[] = [], tag = "span") {
        if (!icon) {
            icon = testImage;
        }

        if ((icon.constructor === String && (icon.includes(".") || icon.startsWith("data:image"))) || (isSignal(icon) &&
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

    static buttonWithIcon(icon: StringOrSignal, text: StringOrSignal, onclick: Function, classes: StringOrSignal[] = [], iconClasses: StringOrSignal[] = []) {
        return create("button")
            .classes("flex", ...classes)
            .onclick(onclick)
            .children(
                CommonTemplates.icon(icon, iconClasses),
                when(text, create("span")
                    .text(text)
                    .build()),
            ).build();
    }

    static buttonWithSpinner(icon: StringOrSignal, text: StringOrSignal, id: StringOrSignal, onclick: Function, loadingState: Signal<boolean>, classes: StringOrSignal[] = []) {
        return create("button")
            .classes("flex", ...classes)
            .onclick(onclick)
            .id(id)
            .children(
                icon ? when(loadingState, CommonTemplates.icon(icon), true) : null,
                when(loadingState, create("span")
                    .text(text)
                    .build(), true),
                when(loadingState, CommonTemplates.spinner()),
                when(loadingState, create("span")
                    .text("Loading...")
                    .build()),
            ).build();
    }

    static select(label: StringOrSignal, options: Array<{ value: any, text: StringOrSignal }>, value: Signal<any>, onchange: Function) {
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
                                onchange(target(e).value);
                            })
                            .children(
                                ...options.map(option => {
                                    const selected = compute(v => option.value === v, value);

                                    return create("option")
                                        .text(option.text)
                                        .value(option.value)
                                        .selected(selected)
                                        .onclick(() => onchange(option.value))
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
        const currentRoute = router.currentRoute;
        const activeIfActive = (route: string) => {
            if (currentRoute.value) {
                return currentRoute.value.path === route ? "active" : "_";
            }
            return "_";
        };
        const avatar = compute(u => u && u.avatar ? u.avatar : testImage, currentUser);
        const hasAnyRole = compute(u => u && u.roles && u.roles.length > 0, currentUser);

        return create("nav")
            .classes("flex", "align-center", "full-width", "space-between", "padded", "fixed")
            .children(
                create("div")
                    .classes("flex", "align-center")
                    .children(
                        CommonTemplates.buttonWithIcon("chat", "Chat", () => router.navigate('chat'), [activeIfActive("chat")]),
                        CommonTemplates.buttonWithIcon("chat_add_on", "New", () => Popups.newDm()),
                        //CommonTemplates.buttonWithIcon("group", "Friends", () => window.router.navigate('friends'), [activeIfActive("friends")]),
                    ).build(),
                create("div")
                    .classes("flex", "align-center")
                    .children(
                        CommonTemplates.buttonWithIcon("settings", "Settings", () => router.navigate('settings'), [activeIfActive("settings")]),
                        CommonTemplates.buttonWithIcon(avatar, "Profile", () => router.navigate('profile'), [activeIfActive("profile")], ["small-avatar"]),
                    ).build()
            ).build();
    }

    static profileCard(user: User, shown: Signal<boolean>) {
        const cardStyle = compute((isShown): string => isShown ? "flex" : "none", shown);
        shown.subscribe(is => {
            if (is) {
                setTimeout(() => {
                    document.addEventListener("click", () => {
                        shown.value = false;
                    }, {once: true});
                }, 0);
            }
        })

        return create("div")
            .classes("flex-v", "profile-card")
            .styles("display", cardStyle)
            .children(
                create("img")
                    .classes("big-avatar")
                    .src(user.avatar ?? testImage)
                    .build(),
                create("span")
                    .classes("bold")
                    .text(user.displayname ?? user.username)
                    .build(),
                create("span")
                    .text(user.username)
                    .build(),
                create("p")
                    .text(user.description)
                    .build(),
            ).build();
    }

    static circleToggle(text: StringOrSignal, color: StringOrSignal = "var(--blue)", onclick = () => {
    }) {
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

    static userInList(image: string, name: StringOrSignal, text: StringOrSignal, onclick: Function, avatarClass: StringOrSignal = "channel-avatar") {
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
                        when(text, create("span")
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

    static input(type: InputType, id: StringOrSignal, label: StringOrSignal, placeholder: StringOrSignal,
                    value: HtmlPropertyValue, onchange: (e: KeyboardEvent) => void, required = true,
                    autocomplete = "off", onkeydown = (e: KeyboardEvent) => {
        }, ontype = (e: KeyboardEvent) => {
        }) {
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
                    .required(required)
                    .onchange(onchange)
                    .onkeydown((e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            onkeydown(e);
                        }
                        ontype(e);
                    })
                    .autocomplete(autocomplete)
                    .build()
            ).build();
    }

    static responsiveInput(type: InputType, id: HtmlPropertyValue, label: HtmlPropertyValue,
                           placeholder: HtmlPropertyValue, value: HtmlPropertyValue, oninput: Function,
                           required = true, autocomplete = "off", onkeydown = (e: KeyboardEvent) => {
        }) {
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
                    .required(required)
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

    static error(message: Signal<string | null>) {
        return create("span")
            .classes("error")
            .text(message as HtmlPropertyValue)
            .build();
    }

    static pageLink(text: StringOrSignal, target: string, classes: StringOrSignal[] = []) {
        const isExternal = target.startsWith("http");
        return create("a")
            .href(target)
            .target("_blank")
            .onclick((e) => {
                const middleClick = e.button === 1;
                if (!isExternal && !middleClick) {
                    e.preventDefault();
                    router.navigate(target);
                } else {
                    window.open((e.target as HTMLAnchorElement).href, "_blank");
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

    static textArea(value: Signal<string>, id: StringOrSignal, label: StringOrSignal | null = null,
                    placeholder: StringOrSignal | null = null, classes: StringOrSignal[] = [],
                    subClasses: string[] = [], onenter = (e: Event) => {
        }) {
        const resize = (area: HTMLInputElement) => {
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
                when(label, create("label")
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
                                resize(target(e));
                            }
                        }
                    })
                    .oninput((e) => {
                        value.value = target(e).value;
                        if (subClasses.includes("message-input")) {
                            resize(target(e));
                        }
                    })
                    .build()
            ).build();
    }

    static checkbox(id: StringOrSignal, label: StringOrSignal, value: HtmlPropertyValue, onchange: (val: boolean) => void) {
        return create("div")
            .classes("flex", "small-gap")
            .children(
                create("input")
                    .type(InputType.checkbox)
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

    static smallCard(icon: string, text: string) {
        return create("div")
            .classes("small-card", "flex", "align-center")
            .children(
                CommonTemplates.icon(icon),
                create("span")
                    .text(text)
                    .build()
            ).build();
    }

    static chatUser(avatar: string, name: string, onclick: Function, onlonghover = (e: MouseEvent) => {
    }, onhoverout = (e: MouseEvent) => {
    }) {
        let timeout: number | null = null;

        return create("div")
            .classes("flex", "align-center", "chat-user")
            .onclick(onclick)
            .onmouseenter(() => {
                timeout = setTimeout((e) => {
                    onlonghover(e);
                }, 1000);
            })
            .onmouseleave((e) => {
                if (timeout) {
                    clearTimeout(timeout);
                    onhoverout(e);
                }
            })
            .children(
                CommonTemplates.icon(avatar, ["round", "message-avatar"]),
                create("span")
                    .classes("bold", "message-username")
                    .text(name)
                    .build()
            ).build();
    }

    static smallIconButton(icon: StringOrSignal, title: StringOrSignal, onclick: Function, classes: StringOrSignal[] = []) {
        return create("div")
            .classes("small-icon-button", "flex", "align-center", ...classes)
            .onclick(onclick)
            .title(title)
            .children(
                CommonTemplates.icon(icon)
            ).build();
    }
}