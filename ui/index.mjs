import {Router} from "./routing/Router.mjs";
import {routes} from "./routing/Routes.mjs";
import {Page} from "./routing/Page.mjs";
import {Api} from "./api/Api.mjs";
import {Store} from "./api/Store.mjs";
import {Hooks} from "./api/Hooks.mjs";

Store.create();

window.router = new Router(routes, async (route, params) => {
    console.log(`Route changed to ${route.path}`);
    document.title = `Venel - ${route.title}`;

    const res = await Api.getUser();
    if (res.status === 200) {
        Store.set('user', res.data.user);
        Hooks.runUser(res.data.user);
    } else {
        Store.set('user', null);
        if (route.noUser) {
            window.router.navigate(route.noUser);
            return;
        }
    }
    Page.load(route.path, params, window.router);
});
