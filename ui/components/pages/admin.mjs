import {LayoutTemplates} from "../layout.mjs";
import {create, ifjs, signal, signalFromProperty, signalMap} from "https://fjs.targoninc.com/f.js";
import {CommonTemplates} from "../common.mjs";
import {Store} from "../../api/Store.mjs";
import {Api} from "../../api/Api.mjs";
import {popup, removePopups, toast} from "../../actions.mjs";
import {PopupComponents} from "../popup.mjs";

export class AdminComponent {
    static render() {
        return LayoutTemplates.pageFull(AdminComponent.content());
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
                                .classes("flex-v", "padded")
                                .children(
                                    create("h1")
                                        .text("Administration")
                                        .build(),
                                    AdminComponent.roleList(user),
                                    AdminComponent.permissionList(user),
                                    AdminComponent.bridgeInstanceSettings()
                                ).build()
                        ), "100%", "500px", "100%")
                    ).build()
            ).build();
    }

    static roleList(user) {
        const roles = signalFromProperty(user, 'roles');

        return create("div")
            .classes("flex-v", "card")
            .children(
                create("h2")
                    .text("Your Roles")
                    .build(),
                signalMap(roles,
                    create("div")
                        .classes("flex", "max800"),
                    role => AdminComponent.role(role)),
            ).build();
    }

    static role(role) {
        return create("span")
            .classes("pill")
            .text(role.name)
            .title(role.description)
            .build();
    }

    static permissionList(user) {
        const permissions = signalFromProperty(user, 'permissions');

        return create("div")
            .classes("flex-v", "card")
            .children(
                create("h2")
                    .text("Your Permissions")
                    .build(),
                signalMap(permissions,
                    create("div")
                        .classes("flex", "max800"),
                    permission => AdminComponent.permission(permission)),
            ).build();
    }

    static permission(permission) {
        return create("span")
            .classes("pill")
            .text(permission.name)
            .title(permission.description)
            .build();
    }

    static bridgeInstanceSettings() {
        const bridgedInstances = signal([]);
        const loading = signal(true);
        Api.getInstances().then(res => {
            loading.value = false;
            if (res.status === 200) {
                bridgedInstances.value = res.data;
            } else {
                toast("Failed to fetch bridged instances", "negative");
            }
        });

        return create("div")
            .classes("flex-v", "card")
            .children(
                create("h2")
                    .text("Bridged Instances")
                    .build(),
                AdminComponent.bridgeInstanceActions(bridgedInstances),
                ifjs(loading, CommonTemplates.spinner()),
                signalMap(bridgedInstances,
                    create("div")
                        .classes("flex-v", "max800"),
                    instance => AdminComponent.bridgeInstance(instance)),
            ).build();
    }

    static bridgeInstanceActions(bridgedInstances) {
        return create("div")
            .classes("flex-v")
            .children(
                create("p")
                    .text("Bridged instances allow you to connect to other instances of Venel.")
                    .build(),
                create("div")
                    .classes("flex", "max800")
                    .children(
                        CommonTemplates.buttonWithIcon("add_link", "Add Bridged Instance", () => {
                            popup(AdminComponent.addBridgedInstancePopup(() => {
                                removePopups();
                            }, bridgedInstances));
                        }),
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
                    .classes("flex-v", "max800")
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
                                    bridgedInstances.value.push(res.data);
                                    onclose();
                                } else {
                                    toast("Failed to add bridged instance", "negative");
                                }
                            });
                        }),
                    ).build(),
            ).build();
    }

    static bridgeInstance(instance) {
        return create("div")
            .classes("flex", "max800")
            .children(
                create("span")
                    .classes("instance")
                    .text(instance.url)
                    .build(),
                ifjs(instance.useAllowlist, CommonTemplates.circleIndicator("Only allowed users", "var(--green)")),
                ifjs(instance.enabled, CommonTemplates.circleIndicator("Enabled", "var(--green)")),
                ifjs(instance.enabled, CommonTemplates.circleIndicator("Disabled", "var(--red)"), true),
            ).build();
    }
}