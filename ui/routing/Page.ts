import {create} from "@targoninc/jess";
import {ChatComponent} from "../components/pages/chat.ts";
import {HomeComponent} from "../components/pages/home.ts";
import {LoginComponent} from "../components/pages/login.ts";
import {RegisterComponent} from "../components/pages/register.ts";
import {LogoutComponent} from "../components/pages/logout.ts";
import {UiTestComponent} from "../components/pages/uitest.ts";
import {ProfileComponent} from "../components/pages/profile.ts";
import {SettingsComponent} from "../components/pages/settings.ts";

export class Page {
    static container = document.body;
    static get toasts() {
        const toasts = document.getElementById("toasts");
        if (!toasts) {
            Page.initialize();
            return Page.toasts;
        } else {
            return toasts;
        }
    }

    static get popups() {
        const popups = document.getElementById("popups");
        if (!popups) {
            Page.initialize();
            return Page.popups;
        } else {
            return popups;
        }
    }

    static get notifications() {
        const notifications = document.getElementById("notifications");
        if (!notifications) {
            Page.initialize();
            return Page.notifications;
        } else {
            return notifications;
        }
    }

    static empty() {
        Page.container.innerHTML = "";
        Page.initialize();
    }

    static initialize() {
        Page.container.appendChild(create("div").id("toasts").build());
        Page.container.appendChild(create("div").id("popups").build());
        Page.container.appendChild(create("div").id("notifications").build());
    }

    static load(page, params, router) {
        Page.empty();
        const pageComponent = Page.pageMap[page];
        if (!pageComponent) {
            console.error(`Page ${page} not found`);

            return;
        }

        const component = pageComponent.render(params, router);
        Page.container.appendChild(component);
    }

    static pageMap = {
        "chat": ChatComponent,
        "home": HomeComponent,
        "login": LoginComponent,
        "register": RegisterComponent,
        "logout": LogoutComponent,
        "uitest": UiTestComponent,
        "profile": ProfileComponent,
        "settings": SettingsComponent
    };
}