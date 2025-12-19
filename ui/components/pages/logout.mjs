import {create} from "/f.js";
import {LayoutTemplates} from "../layout.mjs";
import {Api} from "../../api/Api.mjs";
import {toast} from "../../actions.mjs";

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