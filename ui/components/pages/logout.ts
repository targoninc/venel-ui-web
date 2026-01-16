import {LayoutTemplates} from "../layout.ts";
import {Api} from "../../api/Api.ts";
import {toast} from "../../actions.ts";
import {create} from "@targoninc/jess";

export class LogoutComponent {
    static render() {
        Api.logout().then((res) => {
            if (res.status === 200) {
                window.router.navigate('login');
            } else {
                toast("Failed to log out: " + res.data.error, "error");
            }
        });

        return LayoutTemplates.pageFull(
            LayoutTemplates.centeredContent(
                create("span")
                    .text("Logging out...")
                    .build()
            )
        );
    }
}