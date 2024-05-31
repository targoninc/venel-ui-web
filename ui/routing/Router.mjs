export class Router {
    currentRoute = null;

    constructor(routes, preRouteChange = null, postRouteChange = null, onNoRouteFound = () => {}) {
        this.routes = routes;
        this.preRouteChange = preRouteChange;
        this.postRouteChange = postRouteChange;
        this.onNoRouteFound = onNoRouteFound;
        this.init();
    }

    init() {
        window.onpopstate = () => this.handleRouteChange();
        this.handleRouteChange().then();
    }

    loadCurrentRoute() {
        this.handleRouteChange().then();
    }

    async handleRouteChange() {
        const path = window.location.pathname.substring(1);
        const route = this.routes.find(r => {
            return path.startsWith(r.path) || (r.aliases && r.aliases.some(a => {
                if (a === "" || a === "/") {
                    return path === a;
                }

                return path.startsWith(a);
            }));
        });
        this.currentRoute = route;
        if (route) {
            const params = this.getParams(path, route);
            this.preRouteChange && await this.preRouteChange(route, params);
            route.handler && await route.handler(route, params);
            this.postRouteChange && await this.postRouteChange(route,params);
        } else {
            this.onNoRouteFound && await this.onNoRouteFound();
        }
    }

    getParams(fullPath, route) {
        const path = fullPath.split("/").filter(p => p !== "");
        const params = {};
        for (let i = 0; i < path.length; i++) {
            params["path_" + i] = path[i];
        }
        const urlParams = new URLSearchParams(window.location.search);
        for (let [key, value] of urlParams.entries()) {
            params[key] = value;
        }
        if (route.params) {
            for (let i = 0; i < route.params.length; i++) {
                params[route.params[i]] = params["path_" + (i + 1)];
            }
        }
        return params;
    }

    async navigate(path) {
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        history.pushState({}, "", path);
        await this.handleRouteChange();
    }

    reload() {
        this.handleRouteChange().then();
    }
}