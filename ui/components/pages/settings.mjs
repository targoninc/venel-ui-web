import {LayoutTemplates} from "../layout.mjs";
import {computedSignal, create, ifjs, signal, signalFromProperty, signalMap} from "https://fjs.targoninc.com/f.js";
import {CommonTemplates} from "../common.mjs";
import {Store} from "../../api/Store.mjs";
import {Api} from "../../api/Api.mjs";
import {
    playLoop,
    playSound,
    popup,
    removePopups, stopPlayingLoop,
    testImage,
    toast,
    toggleAllowlist,
    toggleInstanceEnabled
} from "../../actions.mjs";
import {PopupComponents} from "../popup.mjs";
import {Popups} from "../../api/Popups.mjs";
import {
    currentCallSound,
    currentSound,
    localNotificationsEnabled, setCurrentCallSound, setCurrentSound,
    setLocalNotificationsEnabled, setSoundEnabled, setSystemNotificationsEnabled, soundEnabled,
    systemNotificationsEnabled
} from "../../api/LocalSetting.mjs";

export class SettingsComponent {
    static render() {
        return LayoutTemplates.pageFull(SettingsComponent.content());
    }

    static content() {
        const user = Store.get('user');
        const permissions = signalFromProperty(user, 'permissions');

        return create("div")
            .classes("panes-v", "full-width", "full-height")
            .children(
                CommonTemplates.actions(),
                create("div")
                    .classes("panes", "full-width", "flex-grow", "nav-margin")
                    .children(
                        LayoutTemplates.pane(LayoutTemplates.centeredContent(
                            create("div")
                                .classes("flex-v", "padded", "max800")
                                .children(
                                    create("h1")
                                        .text("Settings")
                                        .build(),
                                    SettingsComponent.settings(),
                                    create("h1")
                                        .text("Administration")
                                        .build(),
                                    SettingsComponent.yourInfo(user),
                                    SettingsComponent.usersSettings(permissions),
                                    SettingsComponent.bridgeInstanceSettings(permissions)
                                ).build()
                        ), "100%", "500px", "100%")
                    ).build()
            ).build();
    }

    static yourInfo(user) {
        const roles = signalFromProperty(user, 'roles');
        const permissions = signalFromProperty(user, 'permissions');

        return create("div")
            .classes("flex-v", "card")
            .children(
                create("h2")
                    .text("Your Access as @" + user.value.username)
                    .build(),
                LayoutTemplates.collapsible("Roles", signalMap(roles,
                    create("div")
                        .classes("flex"),
                    role => SettingsComponent.role(role))),
                LayoutTemplates.collapsible("Permissions", signalMap(permissions,
                    create("div")
                        .classes("flex"),
                    permission => SettingsComponent.permission(permission)))
            ).build();
    }

    static role(role) {
        return create("span")
            .classes("pill")
            .text(role.name)
            .title(role.description)
            .build();
    }

    static permission(permission) {
        return create("span")
            .classes("pill")
            .text(permission.name)
            .title(permission.description)
            .build();
    }

    static bridgeInstanceSettings(permissions) {
        const hasViewPermission = computedSignal(permissions, ps => ps && ps.some(p => p.name === "viewBridgedInstances"));

        const bridgedInstances = signal([]);
        const loading = signal(hasViewPermission.value);
        if (hasViewPermission.value) {
            Api.getInstances().then(res => {
                loading.value = false;
                if (res.status === 200) {
                    bridgedInstances.value = res.data;
                } else {
                    toast("Failed to fetch bridged instances", "negative");
                }
            });
        }

        return create("div")
            .classes("flex-v", "card")
            .children(
                create("h2")
                    .text("Bridged Instances")
                    .build(),
                ifjs(hasViewPermission, create("div")
                    .classes("flex-v")
                    .children(
                        SettingsComponent.bridgeInstanceActions(bridgedInstances, permissions),
                        ifjs(loading, CommonTemplates.spinner()),
                        signalMap(bridgedInstances,
                            create("div")
                                .classes("flex-v"),
                            instance => SettingsComponent.bridgeInstance(bridgedInstances, instance, permissions)),
                    ).build()),
                ifjs(hasViewPermission, create("span")
                    .classes("error")
                    .text("You do not have permission to view bridged instances")
                    .build(), true),
            ).build();
    }

    static bridgeInstanceActions(bridgedInstances, permissions) {
        const hasAddPermission = computedSignal(permissions, ps => ps && ps.some(p => p.name === "addBridgedInstance"));

        return create("div")
            .classes("flex-v")
            .children(
                create("p")
                    .text("Bridged instances allow you to connect to other instances of Venel.")
                    .build(),
                create("div")
                    .classes("flex")
                    .children(
                        ifjs(hasAddPermission, CommonTemplates.buttonWithIcon("add_link", "Add Bridged Instance", () => {
                            popup(SettingsComponent.addBridgedInstancePopup(() => {
                                removePopups();
                            }, bridgedInstances));
                        })),
                    ).build(),
            ).build();
    }

    static addBridgedInstancePopup(onclose, bridgedInstances) {
        const instanceInfo = signal({
            url: "",
            useAllowlist: false,
            enabled: true
        });
        const url = signalFromProperty(instanceInfo, 'url');
        const useAllowlist = signalFromProperty(instanceInfo, 'useAllowlist');
        const enabled = signalFromProperty(instanceInfo, 'enabled');

        return create("div")
            .classes("flex-v", "card")
            .children(
                create("div")
                    .classes("flex", "space-between")
                    .children(
                        create("h3").text("Add instance").build(),
                        PopupComponents.closeButton(onclose),
                    ).build(),
                create("div")
                    .classes("flex-v")
                    .children(
                        CommonTemplates.input("url", "url", "URL", "URL of the instance", url, (e) => {
                            instanceInfo.value = {
                                ...instanceInfo.value,
                                url: e.target.value
                            };
                        }, true),
                        CommonTemplates.checkbox("useAllowlist", "Use Allowlist", useAllowlist, (e) => {
                            instanceInfo.value = {
                                ...instanceInfo.value,
                                useAllowlist: e.target.checked
                            };
                        }),
                        CommonTemplates.checkbox("enabled", "Enabled", enabled, (e) => {
                            instanceInfo.value = {
                                ...instanceInfo.value,
                                enabled: e.target.checked
                            };
                        }),
                    ).build(),
                create("div")
                    .classes("flex", "space-between")
                    .children(
                        CommonTemplates.buttonWithIcon("close", "Cancel" , onclose),
                        CommonTemplates.buttonWithIcon("add_link", "Add", () => {
                            if (!url.value) {
                                toast("URL is required", "negative");
                                return;
                            }

                            Api.addInstance(url.value, useAllowlist.value, enabled.value).then(res => {
                                if (res.status === 200) {
                                    toast("Bridged instance added", "positive");
                                    bridgedInstances.value = [...bridgedInstances.value, res.data];
                                    onclose();
                                } else {
                                    toast("Failed to add bridged instance", "negative");
                                }
                            });
                        }),
                    ).build(),
            ).build();
    }

    static bridgeInstance(instances, instance, permissions) {
        const hasRemovePermission = computedSignal(permissions, ps => ps && ps.some(p => p.name === "removeBridgedInstance"));

        return create("div")
            .classes("flex-v")
            .children(
                create("div")
                    .classes("flex", "space-between")
                    .children(
                        create("span")
                            .classes("instance")
                            .text(instance.url)
                            .build(),
                        create("div")
                            .classes("flex")
                            .children(
                                ifjs(instance.useAllowlist, CommonTemplates.circleToggle("Only allowed users", "var(--purple)", () => toggleAllowlist(instances, instance))),
                                ifjs(instance.useAllowlist, CommonTemplates.circleToggle("All users", "var(--green)", () => toggleAllowlist(instances, instance)), true),
                                ifjs(instance.enabled, CommonTemplates.circleToggle("Enabled", "var(--green)", () => toggleInstanceEnabled(instances, instance))),
                                ifjs(instance.enabled, CommonTemplates.circleToggle("Disabled", "var(--red)", () => toggleInstanceEnabled(instances, instance)), true),
                                ifjs(hasRemovePermission, CommonTemplates.buttonWithIcon("delete", "Remove", () => {
                                    Api.removeInstance(instance.id).then(res => {
                                        if (res.status === 200) {
                                            toast("Bridged instance removed", "positive");
                                            instances.value = instances.value.filter(i => i.id !== instance.id);
                                        } else {
                                            toast("Failed to remove bridged instance", "negative");
                                        }
                                    });
                                })),
                            ).build(),
                    ).build(),
                ifjs(instance.bridgedUsers, LayoutTemplates.collapsible("Allowlist", SettingsComponent.allowlist(instance))),
            ).build();
    }

    static usersSettings(permissions) {
        const hasViewPermission = computedSignal(permissions, ps => ps && ps.some(p => p.name === "viewUsers"));
        const users = signal([]);
        const loading = signal(hasViewPermission.value);
        if (hasViewPermission.value) {
            Api.getUsers().then(res => {
                loading.value = false;
                if (res.status === 200) {
                    users.value = res.data.users;
                } else {
                    toast("Failed to fetch users", "negative");
                }
            });
        }

        return create("div")
            .classes("flex-v", "card")
            .children(
                create("h2")
                    .text("Users")
                    .build(),
                ifjs(hasViewPermission, create("div")
                    .classes("flex-v")
                    .children(
                        SettingsComponent.userActions(users, permissions),
                        ifjs(loading, CommonTemplates.spinner()),
                        signalMap(users,
                            create("div")
                                .classes("flex-v"),
                            user => SettingsComponent.user(users, user, permissions)),
                    ).build()),
                ifjs(hasViewPermission, create("span")
                    .classes("error")
                    .text("You do not have permission to view users")
                    .build(), true),
            ).build();
    }

    static userActions(users, permissions) {
        return create("div")
            .classes("flex-v")
            .children(
                create("div")
                    .classes("flex")
                    .children(
                        CommonTemplates.buttonWithIcon("add", "Add User", () => {}),
                    ).build(),
            ).build();
    }

    static user(users, user, permissions) {
        const hasEditPermission = computedSignal(permissions, ps => ps && ps.some(p => p.name === "editUser"));
        const hasDeletePermission = computedSignal(permissions, ps => ps && ps.some(p => p.name === "deleteUser"));

        return create("div")
            .classes("flex-v")
            .children(
                create("div")
                    .classes("flex", "space-between")
                    .children(
                        CommonTemplates.userInList(user.avatar ? user.avatar : testImage, user.displayname, user.username, () => {}),
                        create("div")
                            .classes("flex")
                            .children(
                                ifjs(hasEditPermission, CommonTemplates.buttonWithIcon("edit", "Edit", () => {})),
                                ifjs(hasDeletePermission, CommonTemplates.buttonWithIcon("delete", "Delete", () => {
                                    Popups.deleteUserPopup(users, user);
                                })),
                            ).build(),
                    ).build(),
                ifjs(user.roles.length > 0, LayoutTemplates.collapsible("Roles", SettingsComponent.userRoles(user))),
                ifjs(user.roles.length > 0, CommonTemplates.error("No roles"), true),
                ifjs(user.permissions.length > 0, LayoutTemplates.collapsible("Permissions", SettingsComponent.userPermissions(user))),
                ifjs(user.permissions.length > 0, CommonTemplates.smallCard("info", "No permissions"), true),
            ).build();
    }

    static userRoles(user) {
        return create("div")
            .classes("flex")
            .children(
                user.roles.map(role => SettingsComponent.role(role)),
            ).build();
    }

    static userPermissions(user) {
        return create("div")
            .classes("flex")
            .children(
                user.permissions.map(permission => SettingsComponent.permission(permission)),
            ).build();
    }

    static allowlist(instance) {
        const allowList = signal(instance.bridgedUsers);

        return create("div")
            .classes("flex-v")
            .children(
                SettingsComponent.allowListActions(instance, allowList),
                create("div")
                    .classes("flex-v")
                    .children(
                        signalMap(allowList,
                            create("div")
                                .classes("flex-v"),
                            user => CommonTemplates.userInList(user.avatar, user.displayname, user.username, () => {})),
                    ).build(),
            ).build();
    }

    static allowListActions(instance, allowList) {
        return create("div")
            .classes("flex-v")
            .children(
                create("div")
                    .classes("flex")
                    .children(
                        CommonTemplates.buttonWithIcon("add", "Add User", () => {
                            Popups.newBridgedUser(instance, allowList);
                        }),
                    ).build(),
            ).build();
    }

    static settings() {
        const notifs_on = signal(localNotificationsEnabled());
        const notifs_color = computedSignal(notifs_on, on => on ? "var(--green)" : "var(--red)");
        notifs_on.subscribe(v => {
            setLocalNotificationsEnabled(v ? "true" : "false");
        });
        const system_notifs_on = signal(systemNotificationsEnabled());
        const system_notifs_color = computedSignal(system_notifs_on, on => on ? "var(--green)" : "var(--red)");
        system_notifs_on.subscribe(v => {
            setSystemNotificationsEnabled(v);
        });
        const notifText = computedSignal(notifs_on, on => on ? "Disable local notifications (in-window popups)" : "Enable local notifications (in-window popups)");
        const systemNotifText = computedSignal(system_notifs_on, on => on ? "Disable system notifications" : "Enable system notifications");
        const sound_on = signal(soundEnabled());
        sound_on.subscribe(v => {
            setSoundEnabled(v);
        });
        const sound_color = computedSignal(sound_on, on => on ? "var(--green)" : "var(--red)");
        const soundText = computedSignal(sound_on, on => on ? "Disable sound" : "Enable sound");
        const sound = signal(currentSound());
        sound.subscribe(v => {
            setCurrentSound(v);
        });
        const callSound = signal(currentCallSound());
        callSound.subscribe(v => {
            setCurrentCallSound(v);
        });
        const playingLoop = signal(false);

        return create("div")
            .classes("flex-v", "card")
            .children(
                create("h2")
                    .text("Notifications")
                    .build(),
                create("div")
                    .classes("flex-v")
                    .children(
                        CommonTemplates.circleToggle(notifText, notifs_color, () => { notifs_on.value = !notifs_on.value }),
                        CommonTemplates.circleToggle(systemNotifText, system_notifs_color, () => { system_notifs_on.value = !system_notifs_on.value }),
                        CommonTemplates.circleToggle(soundText, sound_color, () => { sound_on.value = !sound_on.value }),
                        CommonTemplates.select("New message sound", [
                            { text: "Bloom", value: "bloom.mp3" },
                            { text: "Chord", value: "chord.mp3" },
                            { text: "Drop", value: "drop.mp3" },
                            { text: "Sky", value: "sky.mp3" },
                            { text: "Affirm", value: "affirm.wav" },
                            { text: "Hello", value: "hello.wav" },
                            { text: "In", value: "in.wav" },
                            { text: "Log", value: "log.wav" },
                            { text: "Out", value: "out.wav" },
                        ], sound, (value) => {
                            sound.value = value;
                            playSound(sound.value);
                        }),
                        create("div")
                            .classes("flex")
                            .children(
                                CommonTemplates.select("Call sound", [
                                    { text: "Blossom", value: "blossom.mp3" },
                                ], callSound, (value) => {
                                    callSound.value = value;
                                    playingLoop.value = true;
                                    playLoop(callSound.value);
                                }),
                                ifjs(playingLoop, CommonTemplates.buttonWithIcon("stop", "Stop playing", () => {
                                    stopPlayingLoop();
                                    playingLoop.value = false;
                                }))
                            ).build(),
                    ).build(),
            ).build();
    }
}