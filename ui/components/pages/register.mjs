import {create, ifjs, signal} from "https://fjs.targoninc.com/f.js";
import {LayoutTemplates} from "../layout.mjs";
import {CommonTemplates} from "../common.mjs";
import {Api} from "../../api/Api.mjs";
import {toast} from "../../actions.mjs";

export class RegisterComponent {
    static render() {
        return LayoutTemplates.pageFull(
            LayoutTemplates.centeredContent(
                RegisterComponent.content()
            )
        );
    }

    static content() {
        const username = signal("");
        const usernameError = signal(null);
        const password = signal("");
        const passwordError = signal(null);
        const password2 = signal("");
        const password2Error = signal(null);
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
            if (password2.value.length === 0) {
                password2Error.value = "Password cannot be empty.";
            } else if (password.value !== password2.value) {
                password2Error.value = "Passwords do not match.";
            } else {
                password2Error.value = null;
            }
        }
        username.subscribe(validate);
        password.subscribe(validate);
        password2.subscribe(validate);
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
                                    .text("Register")
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
                                    document.getElementById("password2").focus();
                                }),
                                ifjs(passwordError, CommonTemplates.error(passwordError)),
                                CommonTemplates.input("password", "password2", "Password", "Password", password2, (e) => {
                                    password2.value = e.target.value;
                                }, true, "new-password", (e) => {
                                    password2.value = e.target.value;
                                    document.getElementById("register").click();
                                }),
                                ifjs(password2Error, CommonTemplates.error(password2Error)),
                                CommonTemplates.buttonWithSpinner("person_add", "Register", "register", () => {
                                    validate();
                                    if (usernameError.value || passwordError.value || password2Error.value) {
                                        return;
                                    }

                                    loading.value = true;
                                    Api.register(username.value, password.value).then((res) => {
                                        loading.value = false;
                                        if (res.status === 200) {
                                            toast("Registration successful", "success");
                                            window.router.navigate("chat");
                                        } else {
                                            toast("Registration failed: " + res.data.error, "error");
                                        }
                                    }).catch(() => {
                                        loading.value = false;
                                        console.log("Register failed");
                                    });
                                }, loading, ["positive"]),
                            ).build(),
                    ).build(),
                create("div")
                    .classes("flex-v")
                    .children(
                        CommonTemplates.pageLink("Login", "login"),
                    ).build(),
            ).build();
    }
}