export class Page {
    static container = document.body;

    static empty() {
        Page.container.innerHTML = "";
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
        }
    };
}