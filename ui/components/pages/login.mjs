import {create, ifjs, signal} from "/f.js";
import {LayoutTemplates} from "../layout.mjs";
import {CommonTemplates} from "../common.mjs";
import {Api} from "../../api/Api.mjs";
import {Store} from "../../api/Store.mjs";
import {toast} from "../../actions.mjs";

export class LoginComponent {
    static render() {
        return LayoutTemplates.pageFull(
            LayoutTemplates.centeredContent(
                LoginComponent.content()
            )
        );
    }

    static content() {
        const user = Store.get('user');
        const username = signal("");
        const usernameError = signal(null);
        const password = signal("");
        const passwordError = signal(null);
        const validate = () => {
            if (username.value.length === 0) {
                usernameError.value = "Username cannot be empty.";
            } else {
                usernameError.value = null;
            }
            if (password.value.length === 0) {
                passwordError.value = "Password cannot be empty.";
            } else {
                passwordError.value = null;
            }
        }
        username.subscribe(validate);
        password.subscribe(validate);
        const actionError = signal(null);
        const loading = signal(false);

        return create("div")
            .classes("flex-v", "main-card")
            .children(
                create("div")
                    .classes("flex", "space-between")
                    .children(
                        create("div")
                            .classes("flex-v")
                            .children(
                                create("h1")
                                    .text("Login")
                                    .build(),
                                create("div")
                                    .classes("flex", "align-center")
                                    .children(
                                        create("span")
                                            .text("Instance")
                                            .build(),
                                        create("span")
                                            .classes("instance")
                                            .text(window.location.hostname)
                                            .build()
                                    ).build(),
                                ifjs(user, create("div")
                                    .classes("flex-v")
                                    .children(
                                        CommonTemplates.warning("You are already logged in. Logging in will log you out and switch you to the new user."),
                                        CommonTemplates.pageLink("Go to chat", "chat", ["positive"]),
                                        CommonTemplates.pageLink("Logout", "logout", ["negative"])
                                    ).build())
                            ).build(),
                        create("div")
                            .classes("flex-v")
                            .children(
                                CommonTemplates.input("text", "username", "Username", "Username", username, (e) => {
                                    username.value = e.target.value;
                                }, true, "username", () => {
                                    document.getElementById("password").focus();
                                }),
                                ifjs(usernameError, CommonTemplates.error(usernameError)),
                                CommonTemplates.input("password", "password", "Password", "Password", password, (e) => {
                                    password.value = e.target.value;
                                }, true, "current-password", (e) => {
                                    password.value = e.target.value;
                                    document.getElementById("login").click();
                                }),
                                ifjs(passwordError, CommonTemplates.error(passwordError)),
                                CommonTemplates.buttonWithSpinner("login", "Login", "login", () => {
                                    validate();
                                    if (usernameError.value || passwordError.value) {
                                        return;
                                    }

                                    loading.value = true;
                                    Api.authorize(username.value, password.value).then((res) => {
                                        loading.value = false;
                                        if (res.status !== 200) {
                                            actionError.value = res.data.error;
                                            toast("Login failed: " + res.data.error, "error");
                                        } else {
                                            actionError.value = null;
                                            toast("Login successful", "success");
                                            window.router.navigate("chat");
                                        }
                                    });
                                }, loading, ["positive"]),
                                ifjs(actionError, CommonTemplates.error(actionError)),
                            ).build(),
                    ).build(),
                ifjs(user, create("div")
                    .classes("flex-v")
                    .children(
                        CommonTemplates.pageLink("Register", "register"),
                        CommonTemplates.pageLink("Forgot password", "forgot-password"),
                    ).build(), true)
            ).build();
    }
}