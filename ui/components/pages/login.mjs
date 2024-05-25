import {create, ifjs, signal} from "https://fjs.targoninc.com/f.js";
import {LayoutTemplates} from "../layout.mjs";
import {CommonTemplates} from "../common.mjs";
import {Api} from "../../api/Api.mjs";

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
        const loading = signal(false);

        return create("div")
            .classes("flex-v", "padded")
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
                        console.log("Login: " + res.status);
                    }).catch(() => {
                        loading.value = false;
                        console.log("Login failed");
                    });
                }, loading, ["positive"]),
            ).build();
    }
}