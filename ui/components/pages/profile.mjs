import {LayoutTemplates} from "../layout.mjs";
import {create, signalFromProperty, store} from "https://fjs.targoninc.com/f.js";
import {CommonTemplates} from "../common.mjs";
import {Store} from "../../api/Store.mjs";
import {Api} from "../../api/Api.mjs";
import {toast} from "../../actions.mjs";

export class ProfileComponent {
    static render() {
        return LayoutTemplates.pageFull(ProfileComponent.content());
    }

    static content() {
        const user = Store.get('user');
        const channels = Store.get("channels");

        return create("div")
            .classes("panes-v", "full-width", "full-height")
            .children(
                CommonTemplates.actions(user, channels),
                create("div")
                    .classes("panes", "full-width", "flex-grow")
                    .children(
                        LayoutTemplates.pane(LayoutTemplates.centeredContent(ProfileComponent.basicInfoSection(user)), "100%", "500px", "100%")
                    ).build()
            ).build();
    }

    static basicInfoSection(user) {
        const username = signalFromProperty(user, "username");
        const displayname = signalFromProperty(user, "displayname");
        const description = signalFromProperty(user, "description");
        const updateUser = () => {
            Api.updateUser(username.value, displayname.value, description.value).then((res) => {
                if (res.status !== 200) {
                    toast("Failed to update user info", "error");
                    return;
                }
                toast("User info updated", "success");
                Api.getUser().then((res) => {
                    if (res.status !== 200) {
                        toast("Failed to get user info", "error");
                        return;
                    }
                    store().setSignalValue('user', res.data.user);
                });
            });
        };

        return create("div")
            .classes("flex-v")
            .children(
                create("div")
                    .classes("flex")
                    .children(
                        create("div")
                            .classes("flex-v")
                            .children(
                                CommonTemplates.input("text", "username", "Username", "New username", username, (e) => {
                                    username.value = e.target.value;
                                    updateUser();
                                }, true),
                                CommonTemplates.input("text", "displayname", "Display name", "New display name", displayname, (e) => {
                                    displayname.value = e.target.value;
                                    updateUser();
                                }, true),
                                CommonTemplates.input("text", "description", "Description", "New description", description, (e) => {
                                    description.value = e.target.value;
                                    updateUser();
                                }, true),
                            ).build(),
                    ).build(),
            ).build();
    }
}