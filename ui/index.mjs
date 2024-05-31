import {Router} from "./routing/Router.mjs";
import {routes} from "./routing/Routes.mjs";
import {Page} from "./routing/Page.mjs";
import {Api} from "./api/Api.mjs";
import {Store} from "./api/Store.mjs";
import {Hooks} from "./api/Hooks.mjs";
import {Live} from "./live/Live.mjs";
import {store} from "https://fjs.targoninc.com/f.js";

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
