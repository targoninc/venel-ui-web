import {Router} from "./routing/Router.ts";
import {routes} from "./routing/Routes.ts";
import {Page} from "./routing/Page.ts";
import {Api} from "./api/Api.ts";
import {Store} from "./api/Store.ts";
import {Hooks} from "./api/Hooks.ts";
import {Live} from "./live/Live.ts";
import {store} from "/f.js";

Store.create();

window.router = new Router(routes, async (route, params) => {
    console.log(`Route changed to ${route.path} with params:`, params);
    document.title = `Venel - ${route.title}`;

    const res = await Api.getUser();
    if (res.status === 200) {
        store().setSignalValue('user', res.data.user);
        Hooks.runUser(res.data.user);
    } else {
        store().setSignalValue('user', null);
        if (route.noUser) {
            window.router.navigate(route.noUser);
            return;
        }
        Live.stop();
    }
    Page.load(route.path, params, window.router);
});
