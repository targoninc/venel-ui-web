import {create} from "https://fjs.targoninc.com/f.js";

export class Page {
    static container = document.body;
    static get toasts() {
        return document.getElementById("toasts");
    }

    static empty() {
        Page.container.innerHTML = "";
        Page.initialize();
    }

    static initialize() {
        Page.container.appendChild(create("div").id("toasts").build());
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
    static componentExtension = ".mjs";

    static pageMap = {
        "chat": {
            path: "chat",
            component: "ChatComponent"
        },
        "login": {
            path: "login",
            component: "LoginComponent"
        },
        "register": {
            path: "register",
            component: "RegisterComponent"
        },
        "uitest": {
            path: "uitest",
            component: "UiTestComponent"
        }
    };
}