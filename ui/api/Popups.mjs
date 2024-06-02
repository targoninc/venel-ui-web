import {popup, removePopups, toast} from "../actions.mjs";
import {PopupComponents} from "../components/popup.mjs";
import {Api} from "./Api.mjs";
import {Live} from "../live/Live.mjs";
import {CommonTemplates} from "../components/common.mjs";
import {signal} from "https://fjs.targoninc.com/f.js";
import {Store} from "./Store.mjs";

export class Popups {
    static newDm() {
        const userSearchResults = signal([]);
        const channels = Store.get("channels");

        popup(PopupComponents.searchPopup(() => {
            removePopups();
        }, (e) => {
            const query = e.target.value;
            if (query.length < 3) {
                userSearchResults.value = [];
                return;
            }

            Api.search(query).then((res) => {
                if (res.status !== 200) {
                    toast("Failed to search for users: " + res.data.error, "error");
                    return;
                }
                userSearchResults.value = res.data.filter(user => {
                    return !channels.value.some(channel => {
                        if (channel.type === "dm" && channel.members.length === 1) {
                            return channel.members[0].id === user.id;
                        }

                        return channel.type === "dm" && channel.members[1].id === user.id;
                    });
                });
            })
        }, () => {}, userSearchResults, (result) => {
            return CommonTemplates.chatWithButton(result.username, () => {
                Api.createDirect(result.id).then((res) => {
                    if (res.status !== 200) {
                        toast("Failed to create DM: " + res.data.error, "error");
                        removePopups();
                        return;
                    }
                    toast("DM created", "success");
                    Live.send({
                        type: "createChannel",
                        channelId: res.data.id,
                    });
                    removePopups();
                    window.router.navigate(`/chat/${res.data.id}`);
                });
            });
        }, "New DM", "Search for users"));
    }

    static newBridgedUser(instance, allowList) {
        const userSearchResults = signal([]);

        popup(PopupComponents.searchPopup(() => {
            removePopups();
        }, (e) => {
            const query = e.target.value;
            if (query.length < 3) {
                userSearchResults.value = [];
                return;
            }

            Api.search(query).then((res) => {
                if (res.status !== 200) {
                    toast("Failed to search for users: " + res.data.error, "error");
                    return;
                }
                userSearchResults.value = res.data.filter(user => {
                    return !allowList.value.some(bridgedUser => bridgedUser.id === user.id);
                });
            })
        }, () => {}, userSearchResults, (result) => {
            return CommonTemplates.addUserButton(result.username, () => {
                Api.addBridgedUser(result.id, instance.id).then((res) => {
                    if (res.status !== 200) {
                        toast("Failed to add user: " + res.data.error, "error");
                        removePopups();
                        return;
                    }
                    toast("User added", "success");
                    allowList.value = [...allowList.value, result];
                    removePopups();
                });
            });
        }, "Add bridged user", "Search for users"));
    }

    static deleteUserPopup(users, user) {
        popup(PopupComponents.confirmPopup("Are you sure you want to delete this user?", () => {
            Api.deleteUser(user.id).then((res) => {
                if (res.status !== 200) {
                    toast("Failed to delete user: " + res.data.error, "error");
                    removePopups();
                    return;
                }
                toast("User deleted", "success");
                users.value = users.value.filter(u => u.id !== user.id);
                removePopups();
            });
        }, () => {
            removePopups();
        }, "Delete user", "Yes", "No", "delete", "close"));
    }

    static removeBridgedUserPopup(user, instance, onRemove) {
        popup(PopupComponents.confirmPopup(`Are you sure you want to remove ${user.username} from bridged users on ${instance.url}?`, () => {
            onRemove();
            removePopups();
        }, () => {
            removePopups();
        }, "Remove user", "Yes", "No", "delete", "close"));
    }

    static updatePassword() {
        popup(PopupComponents.changePassword((oldPassword, newPassword, errorState) => {
            Api.changePassword(oldPassword, newPassword).then((res) => {
                if (res.status !== 200) {
                    errorState.value = res.data.error;
                    toast("Failed to update password: " + res.data.error, "error");
                    return;
                }
                toast("Password updated", "success");
                removePopups();
            });
        }));
    }

    static deleteAccount(user) {
        popup(PopupComponents.confirmPopup("Are you sure you want to delete your account?", () => {
            Api.deleteUser(user.value.id).then((res) => {
                if (res.status !== 200) {
                    toast("Failed to delete user: " + res.data.error, "error");
                    removePopups();
                    return;
                }
                toast("User deleted", "success");
                window.router.navigate("/logout");
            });
        }, () => {
            removePopups();
        }, "Delete account", "Yes", "No", "delete", "close"));
    }

    static removeInstancePopup(instance, instances) {
        popup(PopupComponents.confirmPopup(`Are you sure you want to remove ${instance.url} from bridged instances?`, () => {
            Api.removeInstance(instance.id).then(res => {
                if (res.status === 200) {
                    toast("Bridged instance removed", "success");
                    instances.value = instances.value.filter(i => i.id !== instance.id);
                } else {
                    toast("Failed to remove bridged instance: " + res.data.error, "error");
                }
            });
        }, () => {
            removePopups();
        }, "Remove instance", "Yes", "No", "delete", "close"));
    }
}