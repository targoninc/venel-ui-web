import {create} from "@targoninc/jess";

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
        const pageData = Page.pageMap[page];
        if (!pageData) {
            console.error(`Page ${page} not found`);

            return;
        }
        import(this.componentBasePath + "pages/" + pageData.path + this.componentExtension).then((module) => {
            const component = module[pageData.component].render(params, router);
            Page.container.appendChild(component);
        });
    }

    static componentBasePath = "../components/";
    static componentExtension = ".ts";

    static pageMap = {
        "chat": {
            path: "chat",
            component: "ChatComponent"
        },
        "home": {
            path: "home",
            component: "HomeComponent"
        },
        "login": {
            path: "login",
            component: "LoginComponent"
        },
        "register": {
            path: "register",
            component: "RegisterComponent"
        },
        "logout": {
            path: "logout",
            component: "LogoutComponent"
        },
        "uitest": {
            path: "uitest",
            component: "UiTestComponent"
        },
        "profile": {
            path: "profile",
            component: "ProfileComponent"
        },
        "settings": {
            path: "settings",
            component: "SettingsComponent"
        }
    };
}