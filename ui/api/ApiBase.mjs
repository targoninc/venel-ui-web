export class ApiBase {
    static usualHeaders = {
        'Content-Type': 'application/json'
    };
    static apiBaseUrl = "http://localhost:3000";

    static async post(url, body = {}, sendCredentials = true) {
        const res = await fetch(this.apiBaseUrl + url, {
            method: 'POST',
            headers: this.usualHeaders,
            body: JSON.stringify(body),
            credentials: sendCredentials ? 'include' : 'omit'
        });
        return await this.basicResponseHandling(res);
    }

    static async get(url, params = {}, sendCredentials = true) {
        const urlWithParams = new URL(this.apiBaseUrl + url);
        Object.keys(params).forEach(key => urlWithParams.searchParams.append(key, params[key]));
        const res = await fetch(urlWithParams, {
            method: 'GET',
            headers: this.usualHeaders,
            credentials: sendCredentials ? 'include' : 'omit'
        });
        return await this.basicResponseHandling(res);
    }

    static async delete(url, body = {}, sendCredentials = true) {
        const res = await fetch(this.apiBaseUrl + url, {
            method: 'DELETE',
            headers: this.usualHeaders,
            body: JSON.stringify(body),
            credentials: sendCredentials ? 'include' : 'omit'
        });
        return await this.basicResponseHandling(res);
    }

    static async patch(url, body = {}, sendCredentials = true) {
        const res = await fetch(this.apiBaseUrl + url, {
            method: 'PATCH',
            headers: this.usualHeaders,
            body: JSON.stringify(body),
            credentials: sendCredentials ? 'include' : 'omit'
        });
        return await this.basicResponseHandling(res);
    }

    static async basicResponseHandling(res) {
        const text = await res.text();
        try {
            return {
                status: res.status,
                data: JSON.parse(text)
            };
        } catch (e) {
            return {
                status: res.status,
                data: text
            };
        }
    }
}