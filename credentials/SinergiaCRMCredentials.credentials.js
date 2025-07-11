"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SinergiaCRMCredentials = void 0;
class SinergiaCRMCredentials {
    constructor() {
        this.name = 'sinergiaCRMCredentials';
        this.displayName = 'SinergiaCRM Credentials';
        this.properties = [
            {
                displayName: 'API URL',
                name: 'apiUrl',
                type: 'string',
                default: '',
                placeholder: 'https://tuservidor/api',
            },
            {
                displayName: 'Username',
                name: 'username',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Password',
                name: 'password',
                type: 'string',
                typeOptions: { password: true },
                default: '',
            },
        ];
    }
}
exports.SinergiaCRMCredentials = SinergiaCRMCredentials;
