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
    static async updateUser(username = null, displayname = null, description = null) {
        return await this.patch("/api/auth/updateUser", {username, displayname, description});
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
    static async getMessages(offset = null) {
        return await this.get("/api/channels/getMessages", {offset});
    }
    static async getChannels() {
        return await this.get("/api/channels/getChannels", {});
    }
}