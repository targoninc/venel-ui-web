import {Route, Router} from "./routing/Router.ts";
import {routes} from "./routing/Routes.ts";
import {Page} from "./routing/Page.ts";
import {Api} from "./api/Api.ts";
import {Hooks} from "./api/Hooks.ts";
import {Live} from "./live/Live.ts";
import "./reset.css";
import "./base.css";
import "./classes.css";
import {setRouter} from "./routing/RouterInstance.ts";
import {currentUser} from "./api/Store";

const router = new Router(routes, async (route: Route, params: Record<string, string>) => {
    console.log(`Route changed to ${route.path} with params:`, params);
    document.title = `Venel - ${route.title}`;

    const res = await Api.getUser();
    if (res.status === 200) {
        currentUser.value = res.data.user;
        Hooks.runUser(res.data.user);
    } else {
        currentUser.value = null;
        if (route.noUser) {
            await router.navigate(route.noUser);
            return;
        }
        Live.stop();
    }
    Page.load(route.path, params, router);
});

setRouter(router);
router.init();

export function target(event: Event) {
    return event.target as HTMLInputElement;
}