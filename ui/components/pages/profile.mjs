import {LayoutTemplates} from "../layout.mjs";
import {computedSignal, create, signalFromProperty, store} from "https://fjs.targoninc.com/f.js";
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

        return create("div")
            .classes("panes-v", "full-width", "full-height")
            .children(
                CommonTemplates.actions(),
                create("div")
                    .classes("panes", "full-width", "flex-grow")
                    .children(
                        LayoutTemplates.pane(LayoutTemplates.centeredContent(
                            create("div")
                                .classes("flex-v")
                                .children(
                                    ProfileComponent.avatarSection(user),
                                    ProfileComponent.basicInfoSection(user),
                                ).build()
                        ), "100%", "500px", "100%")
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

    static uploadAvatar(avatar) {
        const oldValue = avatar.value;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                avatar.value = base64;
                Api.updateAvatar(base64).then((res) => {
                    if (res.status !== 200) {
                        toast("Failed to update avatar: " + res.data.error, "error");
                        return;
                    }

                    toast("Avatar updated", "success");
                    avatar.value = oldValue;
                });
            };
            reader.readAsDataURL(input.files[0]);
        };
        input.click();
    }

    static avatarSection(user) {
        const avatar = signalFromProperty(user, "avatar");

        return create("div")
            .classes("flex-v")
            .children(
                create("img")
                    .classes("big-avatar")
                    .src(avatar)
                    .onclick(() => {
                        ProfileComponent.uploadAvatar(avatar);
                    }).build(),
                create("span")
                    .classes("text-small")
                    .text("Maximum size: 50MB")
                    .build(),
                CommonTemplates.buttonWithIcon("upload_file", "Upload avatar", () => {
                    ProfileComponent.uploadAvatar(avatar);
                })
            ).build();
    }
}