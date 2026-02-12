import {Router} from "./Router.ts";

export let router: Router;

export function setRouter(r: Router) {
    router = r;
}
