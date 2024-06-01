import {ApiBase} from "./ApiBase.mjs";

export class Api extends ApiBase {
    static async logout() {
        return await this.post("/api/auth/logout", {});
    }
    static async authorize(username = null, password = null) {
        return await this.post("/api/auth/authorize", {username, password});
    }
    static async register(username = null, password = null) {
        return await this.post("/api/auth/register", {username, password});
    }
    static async getUser() {
        return await this.get("/api/auth/getUser", {});
    }
    static async getUsers() {
        return await this.get("/api/auth/getUsers", {});
    }
    static async updateUser(username = null, displayname = null, description = null) {
        return await this.patch("/api/auth/updateUser", {username, displayname, description});
    }
    static async updateAvatar(avatar = null) {
        return await this.post("/api/auth/updateAvatar", {avatar});
    }
    static async deleteUser(userId = null) {
        return await this.delete("/api/auth/deleteUser", {userId});
    }
    static async roles() {
        return await this.get("/api/auth/roles", {});
    }
    static async createRole(name = null, description = null) {
        return await this.post("/api/auth/createRole", {name, description});
    }
    static async addPermissionToRole(roleId = null, permissionId = null) {
        return await this.post("/api/auth/addPermissionToRole", {roleId, permissionId});
    }
    static async permissions(roleId = null) {
        return await this.get("/api/auth/permissions", {roleId});
    }
    static async getUserRoles(userId = null) {
        return await this.get("/api/auth/getUserRoles", {userId});
    }
    static async getUserPermissions(userId = null) {
        return await this.get("/api/auth/getUserPermissions", {userId});
    }
    static async addRoleToUser(userId = null, roleId = null) {
        return await this.post("/api/auth/addRoleToUser", {userId, roleId});
    }
    static async removeRoleFromUser(userId = null, roleId = null) {
        return await this.delete("/api/auth/removeRoleFromUser", {userId, roleId});
    }
    static async sendMessage(channelId = null, text = null) {
        return await this.post("/api/messaging/sendMessage", {channelId, text});
    }
    static async deleteMessage(messageId = null) {
        return await this.delete("/api/messaging/deleteMessage", {messageId});
    }
    static async editMessage(messageId = null, text = null) {
        return await this.patch("/api/messaging/editMessage", {messageId, text});
    }
    static async createDirect(targetUserId = null) {
        return await this.post("/api/channels/createDirect", {targetUserId});
    }
    static async getMessages(channelId = null, offset = null) {
        return await this.get("/api/channels/getMessages", {channelId, offset});
    }
    static async getChannels() {
        return await this.get("/api/channels/getChannels", {});
    }
    static async getConnectionSid() {
        return await this.get("/api/auth/getConnectionSid", {});
    }
    static async url() {
        return await this.get("/api/live/url", {});
    }
    static async search(query = null) {
        return await this.get("/api/users/search", {query});
    }
    static async getInstances() {
        return await this.get("/api/bridging/getInstances", {});
    }
    static async addInstance(url = null, useAllowlist = null, enabled = null) {
        return await this.post("/api/bridging/addInstance", {url, useAllowlist, enabled});
    }
    static async removeInstance(id = null) {
        return await this.delete("/api/bridging/removeInstance", {id});
    }
    static async toggleAllowlist(id = null) {
        return await this.patch("/api/bridging/toggleAllowlist", {id});
    }
    static async toggleEnabled(id = null) {
        return await this.patch("/api/bridging/toggleEnabled", {id});
    }
    static async addBridgedUser(userId = null, instanceId = null) {
        return await this.post("/api/bridging/addBridgedUser", {userId, instanceId});
    }
    static async removeBridgedUser(userId = null, instanceId = null) {
        return await this.delete("/api/bridging/removeBridgedUser", {userId, instanceId});
    }
}