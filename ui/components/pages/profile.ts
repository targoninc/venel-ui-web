import {LayoutTemplates} from "../layout.ts";
import {CommonTemplates} from "../common.ts";
import {Api} from "../../api/Api.ts";
import {testImage, toast} from "../../actions.ts";
import {Live} from "../../live/Live.ts";
import {Popups} from "../../api/Popups.ts";
import {compute, create, InputType, Signal, signal} from "@targoninc/jess";
import {User} from "../../models/models";
import {currentUser} from "../../api/Store";

export class ProfileComponent {
    static render() {
        return LayoutTemplates.pageFull(ProfileComponent.content());
    }

    static content() {
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
                                    ProfileComponent.avatarSection(currentUser),
                                    ProfileComponent.basicInfoSection(currentUser),
                                    ProfileComponent.accountSection(currentUser),
                                ).build()
                        ), "100%", "500px", "100%")
                    ).build()
            ).build();
    }

    static basicInfoSection(user: Signal<User | null>) {
        const username = compute((u) => u?.username, user);
        const displayname = compute((u) => u?.displayname, user);
        const description = compute((u) => u?.description, user);
        const updateUser = (): void => {
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
                    currentUser.value = res.data.user;
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
                                CommonTemplates.input(InputType.text, "username", "Username", "New username", username, (e) => {
                                    username.value = e.target.value;
                                    updateUser();
                                }, true),
                                CommonTemplates.input(InputType.text, "displayname", "Display name", "New display name", displayname, (e) => {
                                    displayname.value = e.target.value;
                                    updateUser();
                                }, true),
                                CommonTemplates.input(InputType.text, "description", "Description", "New description", description, (e) => {
                                    description.value = e.target.value;
                                    updateUser();
                                }, true),
                            ).build(),
                    ).build(),
            ).build();
    }

    static uploadAvatar(avatar: Signal<string>) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (): void => {
            const reader = new FileReader();
            reader.onload = (): void => {
                const base64 = reader.result?.toString();
                if (base64) {
                    avatar.value = base64;
                }
                Live.send({
                    type: "updateAvatar",
                    avatar: base64
                });
                Store.get('user').value = {
                    ...Store.get('user').value,
                    avatar: base64
                };
            };
            reader.readAsDataURL(input.files?.[0] || new File([], ''));
        };
        input.click();
    }

    static avatarSection(user: Signal<User | null>) {
        const realAvatar = compute((u: User) => u.avatar, user);
        const avatar = compute((av: Buffer | null) => {
            if (av instanceof Buffer) {
                return av.toString('base64');
            }
            return testImage;
        }, realAvatar);
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

    static accountSection(user: Signal<User | null>) {
        return LayoutTemplates.collapsible("Account",
            create("div")
                .classes("flex-v")
                .children(
                    CommonTemplates.buttonWithIcon("password", "Change password", () => {
                        Popups.updatePassword();
                    }, ["sensitive"]),
                    CommonTemplates.buttonWithIcon("delete", "Delete account", () => {
                        Popups.deleteAccount(user);
                    }, ["negative"])
                ).build()
        );
    }
}