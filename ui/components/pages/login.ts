import {LayoutTemplates} from "../layout.ts";
import {CommonTemplates} from "../common.ts";
import {Api} from "../../api/Api.ts";
import {toast} from "../../actions.ts";
import {create, InputType, signal, when} from "@targoninc/jess";
import {router} from "../../routing/RouterInstance.ts";
import {currentUser} from "../../api/Store";
import {target} from "../../index";

export class LoginComponent {
    static render() {
        return LayoutTemplates.pageFull(
            LayoutTemplates.centeredContent(
                LoginComponent.content()
            )
        );
    }

    static content() {
        const username = signal("");
        const usernameError = signal<string | null>(null);
        const password = signal("");
        const passwordError = signal<string | null>(null);
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
                                when(currentUser, create("div")
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
                                CommonTemplates.input(InputType.text, "username", "Username", "Username", username, (e) => {
                                    username.value = target(e).value;
                                }, true, "username", () => {
                                    document.getElementById("password")?.focus();
                                }),
                                when(usernameError, CommonTemplates.error(usernameError)),
                                CommonTemplates.input(InputType.password, "password", "Password", "Password", password, (e) => {
                                    password.value = target(e).value;
                                }, true, "current-password", (e) => {
                                    password.value = target(e).value;
                                    document.getElementById("login")?.click();
                                }),
                                when(passwordError, CommonTemplates.error(passwordError)),
                                CommonTemplates.buttonWithSpinner("login", "Login", "login", () => {
                                    validate();
                                    if (usernameError.value || passwordError.value) {
                                        return;
                                    }

                                    loading.value = true;
                                    Api.authorize(username.value, password.value).then((res) => {
                                        loading.value = false;
                                        if (res.status === 200) {
                                            toast("Logged in successfully", "success");
                                            router.navigate("chat");
                                        } else {
                                            toast("Failed to log in: " + res.data.error, "error");
                                        }
                                    });
                                }, loading, ["positive"]),
                                when(actionError, CommonTemplates.error(actionError)),
                            ).build(),
                    ).build(),
                when(currentUser, create("div")
                    .classes("flex-v")
                    .children(
                        CommonTemplates.pageLink("Register", "register"),
                        CommonTemplates.pageLink("Forgot password", "forgot-password"),
                    ).build(), true)
            ).build();
    }
}