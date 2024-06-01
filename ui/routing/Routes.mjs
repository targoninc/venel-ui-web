export const routes = [
    {
        path: 'home',
        title: 'Home',
        aliases: ['']
    },
    {
        path: 'login',
        title: 'Login'
    },
    {
        path: 'register',
        title: 'Register'
    },
    {
        path: 'logout',
        title: 'Logout',
        noUser: 'login'
    },
    {
        path: 'chat',
        title: 'Chat',
        noUser: 'login',
        params: ['channelId'],
    },
    {
        path: "uitest",
        title: "UI Test"
    },
    {
        path: "profile",
        title: "Profile",
        noUser: "login"
    },
    {
        path: "settings",
        title: "Settings",
        noUser: "login",
    }
];