import {create, ifjs, signal, signalMap} from "https://fjs.targoninc.com/f.js";
import {CommonTemplates} from "./common.mjs";

export class PopupComponents {
    static popup(content, classes = []) {
        return create("div")
            .classes(...classes)
            .children(
                create("div")
                    .classes("popup-content")
                    .children(content)
                    .build()
            ).build();
    }

    static searchPopup(onclose, onsearch, onselect, searchResults, renderResult = (result) => PopupComponents.searchResult(result, onselect), title = "Search", inputLabel = "", classes = []) {
        return create("div")
            .classes("card", ...classes)
            .children(
                create("div")
                    .classes("flex-v")
                    .children(
                        create("div")
                            .classes("flex", "space-between")
                            .children(
                                ifjs(title, create("h3").text(title).build()),
                                PopupComponents.closeButton(onclose),
                            ).build(),
                        CommonTemplates.responsiveInput("text", "search", inputLabel, inputLabel, "", onsearch),
                        ifjs(searchResults, signalMap(searchResults,
                            create("div")
                                .classes("flex-v"),
                            renderResult
                        )),
                        ifjs(searchResults, create("div")
                            .classes("no-results")
                            .text("No results found")
                            .build(), true),
                    ).build()
            ).build();
    }

    static closeButton(onclose) {
        return CommonTemplates.buttonWithIcon("close", "Close", onclose, ["no-border", "self-end"])
    }

    static searchResult(result, onselect) {
        return create("div")
            .classes("search-result")
            .onclick(() => onselect(result))
            .children(
                create("span")
                    .text(result)
                    .build()
            ).build();
    }

    static confirmPopup(message, onconfirm, oncancel, title = "Confirm", textConfirm = "Confirm", textCancel = "Cancel", iconConfirm = "check", iconCancel = "close") {
        return create("div")
            .classes("card")
            .children(
                create("div")
                    .classes("flex-v")
                    .children(
                        create("h3")
                            .text(title)
                            .build(),
                        create("p")
                            .text(message)
                            .build(),
                        create("div")
                            .classes("flex", "space-between")
                            .children(
                                CommonTemplates.buttonWithIcon(iconCancel, textCancel, oncancel),
                                CommonTemplates.buttonWithIcon(iconConfirm, textConfirm, onconfirm),
                            ).build()
                    ).build()
            ).build();
    }

    static changePassword(onconfirm = (oldPass, newPass, errorState) => {}, oncancel = () => {}) {
        const oldPassword = signal("");
        const newPassword = signal("");
        const confirmPassword = signal("");
        const errorState = signal(null);
        const validate = () => {
            if (newPassword.value !== confirmPassword.value) {
                errorState.value = "Passwords do not match";
                return;
            }
            if (newPassword.value.length < 8) {
                errorState.value = "Password must be at least 8 characters";
                return;
            }
            if (newPassword.value === oldPassword.value) {
                errorState.value = "New password must be different from old password";
                return;
            }
            errorState.value = null;
        }
        oldPassword.subscribe(validate);
        newPassword.subscribe(validate);
        confirmPassword.subscribe(validate);

        return create("div")
            .classes("card")
            .children(
                create("div")
                    .classes("flex-v")
                    .children(
                        create("h3")
                            .text("Change password")
                            .build(),
                        CommonTemplates.input("password", "old-password", "Old password", "Old password", oldPassword, (e) => {
                            oldPassword.value = e.target.value;
                        }, true, "old-password"),
                        CommonTemplates.input("password", "new-password", "New password", "New password", newPassword, (e) => {
                            newPassword.value = e.target.value;
                        }, true, "new-password"),
                        CommonTemplates.input("password", "confirm-password", "Confirm new password", "Confirm new password", confirmPassword, (e) => {
                            confirmPassword.value = e.target.value;
                        }, true, "confirm-password"),
                        ifjs(errorState, create("p")
                            .classes("error")
                            .text(errorState)
                            .build()),
                        create("div")
                            .classes("flex", "space-between")
                            .children(
                                CommonTemplates.buttonWithIcon("close", "Cancel", oncancel),
                                CommonTemplates.buttonWithIcon("check", "Confirm", () => onconfirm(oldPassword.value, newPassword.value, errorState)),
                            ).build()
                    ).build()
            ).build();
    }
}