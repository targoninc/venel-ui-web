import {LayoutTemplates} from "../layout.ts";
import {CommonTemplates} from "../common.ts";
import {Api} from "../../api/Api.ts";
import {
    playLoop,
    playSound,
    popup,
    removePopups, stopPlayingLoop,
    testImage,
    toast,
    toggleAllowlist,
    toggleInstanceEnabled
} from "../../actions.ts";
import {PopupComponents} from "../popup.ts";
import {Popups} from "../../api/Popups.ts";
import {
    currentCallSound,
    currentSound,
    localNotificationsEnabled, setCurrentCallSound, setCurrentSound,
    setLocalNotificationsEnabled, setSoundEnabled, setSystemNotificationsEnabled, soundEnabled,
    systemNotificationsEnabled
} from "../../api/Setting.ts";
import {compute, create, signal, signalMap, when} from "@targoninc/jess";
import {currentUser} from "../../api/Store";

export class SettingsComponent {
    static render() {
        return LayoutTemplates.pageFull(SettingsComponent.content());
    }

    static content() {
        const permissions = compute(u => u?.permissions, currentUser);

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
                                    SettingsComponent.yourInfo(),
                                    SettingsComponent.usersSettings(permissions),
                                ).build()
                        ), "100%", "500px", "100%")
                    ).build()
            ).build();
    }

    static yourInfo() {
        const roles = compute(u => u?.roles, currentUser);
        const permissions = compute(u => u?.permissions, currentUser);

        return create("div")
            .classes("flex-v", "card")
            .children(
                create("h2")
                    .text("Your Access as @" + currentUser.value?.username)
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

    static usersSettings(permissions) {
        const hasViewPermission = compute(ps => ps && ps.some(p => p.name === "viewUsers"), permissions);
        const users = signal([]);
        const loading = signal(hasViewPermission.value);
        if (hasViewPermission.value) {
            Api.getUsers().then(res => {
                loading.value = false;
                if (res.status === 200) {
                    users.value = res.data.users;
                } else {
                    toast("Failed to fetch users: " + res.data.error, "error");
                }
            });
        }

        return create("div")
            .classes("flex-v", "card")
            .children(
                create("h2")
                    .text("Users")
                    .build(),
                when(hasViewPermission, create("div")
                    .classes("flex-v")
                    .children(
                        SettingsComponent.userActions(users, permissions),
                        when(loading, CommonTemplates.spinner()),
                        signalMap(users,
                            create("div")
                                .classes("flex-v"),
                            user => SettingsComponent.user(users, user, permissions)),
                    ).build()),
                when(hasViewPermission, create("span")
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
        const hasEditPermission = compute(ps => ps && ps.some(p => p.name === "editUser"), permissions);
        const hasDeletePermission = compute(ps => ps && ps.some(p => p.name === "deleteUser"), permissions);

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
                                when(hasEditPermission, CommonTemplates.buttonWithIcon("edit", "Edit", () => {})),
                                when(hasDeletePermission, CommonTemplates.buttonWithIcon("delete", "Delete", () => {
                                    Popups.deleteUserPopup(users, user);
                                })),
                            ).build(),
                    ).build(),
                when(user.roles.length > 0, LayoutTemplates.collapsible("Roles", SettingsComponent.userRoles(user))),
                when(user.roles.length > 0, CommonTemplates.error("No roles"), true),
                when(user.permissions.length > 0, LayoutTemplates.collapsible("Permissions", SettingsComponent.userPermissions(user))),
                when(user.permissions.length > 0, CommonTemplates.smallCard("info", "No permissions"), true),
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

    static settings() {
        const notifs_on = signal(localNotificationsEnabled());
        const notifs_color = compute(on => on ? "var(--green)" : "var(--red)", notifs_on);
        notifs_on.subscribe(v => {
            setLocalNotificationsEnabled(v ? "true" : "false");
        });
        const system_notifs_on = signal(systemNotificationsEnabled());
        const system_notifs_color = compute(on => on ? "var(--green)" : "var(--red)", system_notifs_on);
        system_notifs_on.subscribe(v => {
            setSystemNotificationsEnabled(v);
        });
        const notifText = compute(on => on ? "Disable local notifications (in-window popups)" : "Enable local notifications (in-window popups)", notifs_on);
        const systemNotifText = compute(on => on ? "Disable system notifications" : "Enable system notifications", system_notifs_on);
        const sound_on = signal(soundEnabled());
        sound_on.subscribe(v => {
            setSoundEnabled(v);
        });
        const sound_color = compute(on => on ? "var(--green)" : "var(--red)", sound_on);
        const soundText = compute(on => on ? "Disable sound" : "Enable sound", sound_on);
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
                                    { text: "Heartbeat", value: "heartbeat.mp3" },
                                    { text: "Classic", value: "classic.mp3" },
                                ], callSound, (value) => {
                                    callSound.value = value;
                                    playingLoop.value = true;
                                    playLoop(callSound.value);
                                }),
                                when(playingLoop, CommonTemplates.buttonWithIcon("stop", "Stop playing", () => {
                                    stopPlayingLoop();
                                    playingLoop.value = false;
                                }))
                            ).build(),
                    ).build(),
            ).build();
    }
}