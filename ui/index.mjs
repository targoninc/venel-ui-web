import {Router} from "./routing/Router.mjs";
import {routes} from "./routing/Routes.mjs";
import {Page} from "./routing/Page.mjs";
import {Api} from "./api/Api.mjs";
import {Store} from "./api/Store.mjs";

Store.create();

window.router = new Router(routes, async (route, params) => {
    console.log(`Route changed to ${route.path}`);
    document.title = `Venel - ${route.title}`;

    await Api.getUser().then((res) => {
        if (res.status === 200) {
            Store.set('user', res.data);
        } else {
            Store.set('user', null);
        }
    });
    Page.load(route.path, params, window.router);
});
