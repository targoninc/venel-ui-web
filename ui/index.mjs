import {Router} from "./routing/Router.mjs";
import {routes} from "./routing/Routes.mjs";
import {Page} from "./routing/Page.mjs";
import {Api} from "./api/Api.mjs";
import {Store} from "./api/Store.mjs";

Store.create();

window.router = new Router(routes, async (route, params) => {
    console.log(`Route changed to ${route.path}`);
    document.title = `botanika - ${route.title}`;

    const user = await Api.getUser();
    Store.set('user', user);
    Page.load(route.path, params, window.router);
});
