import {Router} from "./routing/Router.ts";
import {routes} from "./routing/Routes.ts";
import {Page} from "./routing/Page.ts";
import {Api} from "./api/Api.ts";
import {Store} from "./api/Store.ts";
import {Hooks} from "./api/Hooks.ts";
import {Live} from "./live/Live.ts";
import {store} from "./compat";
import "./reset.css";
import "./base.css";
import "./classes.css";
import {setRouter} from "./routing/RouterInstance.ts";

Store.create();

const router = new Router(routes, async (route, params) => {
    console.log(`Route changed to ${route.path} with params:`, params);
    document.title = `Venel - ${route.title}`;

    const res = await Api.getUser();
    if (res.status === 200) {
        store().setSignalValue('user', res.data.user);
        Hooks.runUser(res.data.user);
    } else {
        store().setSignalValue('user', null);
        if (route.noUser) {
            router.navigate(route.noUser);
            return;
        }
        Live.stop();
    }
    Page.load(route.path, params, router);
});

setRouter(router);
router.init();

export function target(event: Event) {
    return event.target as HTMLElement;
}