import {LayoutTemplates} from "../layout.ts";
import {CommonTemplates} from "../common.ts";
import {Store} from "../../api/Store.ts";
import {Api} from "../../api/Api.ts";
import {testImage, toast} from "../../actions.ts";
import {Live} from "../../live/Live.ts";
import {Popups} from "../../api/Popups.ts";
import {compute, create, signal} from "@targoninc/jess";
import {store} from "../../compat";

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
                    .classes("panes", "full-width", "flex-grow", "nav-margin")
                    .children(
                        LayoutTemplates.pane(LayoutTemplates.centeredContent(
                            create("div")
                                .classes("flex-v")
                                .children(
                                    ProfileComponent.avatarSection(user),
                                    ProfileComponent.basicInfoSection(user),
                                    ProfileComponent.accountSection(user),
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
                    toast("Failed to update user info: " + res.data.error, "error");
                    return;
                }
                toast("User info updated", "success");
                Api.getUser().then((res) => {
                    if (res.status !== 200) {
                        toast("Failed to get user info: " + res.data.error, "error");
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
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.toString();
                avatar.value = base64;
                Live.send({
                    type: "updateAvatar",
                    avatar: base64
                });
                Store.get('user').value = {
                    ...Store.get('user').value,
                    avatar: base64
                };
            };
            reader.readAsDataURL(input.files[0]);
        };
        input.click();
    }

    static avatarSection(user) {
        const realAvatar = compute(u => u.avatar, user);
        const avatar = compute(av => av ?? testImage, realAvatar);
        const buttonText = signal("Upload avatar");

        return create("div")
            .classes("flex-v")
            .children(
                create("img")
                    .classes("big-avatar")
                    .src(avatar)
                    .onclick(() => {
                        buttonText.value = "Uploading...";
                        ProfileComponent.uploadAvatar(avatar);
                        buttonText.value = "Upload avatar";
                    }).build(),
                create("span")
                    .classes("text-small")
                    .text("Maximum size: 50MB")
                    .build(),
                CommonTemplates.buttonWithIcon("upload_file", buttonText, () => {
                    buttonText.value = "Uploading...";
                    ProfileComponent.uploadAvatar(avatar);
                    buttonText.value = "Upload avatar";
                }),
                CommonTemplates.buttonWithIcon("delete", "Delete avatar", () => {
                    Live.send({
                        type: "updateAvatar",
                        avatar: null
                    });
                    Store.get('user').value = {
                        ...Store.get('user').value,
                        avatar: null
                    };
                }, ["negative"])
            ).build();
    }

    static accountSection(user) {
        return LayoutTemplates.collapsible("Account",
            create("div")
                .classes("flex-v")
                .children(
                    CommonTemplates.buttonWithIcon("password", "Change password", () => {
                        Popups.updatePassword(user);
                    }, ["sensitive"]),
                    CommonTemplates.buttonWithIcon("delete", "Delete account", () => {
                        Popups.deleteAccount(user);
                    }, ["negative"])
                ).build()
        );
    }
}