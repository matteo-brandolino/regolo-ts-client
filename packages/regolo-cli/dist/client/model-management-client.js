import { ux } from '@oclif/core';
import * as fs from 'node:fs';
import * as os from 'node:os';
import { dirname, join } from 'node:path';
export class ModelManagementClient {
    baseUrl;
    static CONFIG_FILE = join(os.homedir(), '.regolo_config.json');
    refreshToken = null;
    timeoutSeconds = 60;
    token = null;
    constructor(baseUrl = 'https://devmid.regolo.ai') {
        this.baseUrl = baseUrl;
        this.loadConfig();
    }
    addSshKey(title, key) {
        return this.makeRequest('POST', '/ssh-keys', {
            body: JSON.stringify({ key, title }),
            headers: { 'Content-Type': 'application/json' },
        });
    }
    async authenticate(username, password) {
        let response;
        try {
            response = await fetch(`${this.baseUrl}/auth/login`, {
                body: JSON.stringify({ password, username }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            });
        }
        catch {
            ux.error('Network error: could not reach the server');
        }
        const data = await response.json();
        if (!response.ok) {
            ux.error(data?.detail ?? 'Authentication failed');
        }
        this.token = data.access_token;
        this.refreshToken = data.refresh_token;
        this.saveConfig();
        console.log('Login successful.');
    }
    deleteModel(modelName) {
        return this.makeRequest('DELETE', `/models/${modelName}`);
    }
    deleteSshKey(keyId) {
        return this.makeRequest('DELETE', `/ssh-keys/${keyId}`);
    }
    getAvailableGpus() {
        return this.makeRequest('GET', '/inference/gpus');
    }
    getLoadedModels() {
        return this.makeRequest('GET', '/inference/loaded-models');
    }
    getModel(modelName) {
        return this.makeRequest('GET', `/models/${modelName}`);
    }
    getModels() {
        return this.makeRequest('GET', '/models');
    }
    getSshKeys() {
        return this.makeRequest('GET', '/ssh-keys');
    }
    getUserInferenceStatus(month, timeRangeStart, timeRangeEnd) {
        const params = new URLSearchParams();
        if (month)
            params.set('month', month);
        if (timeRangeStart)
            params.set('time_range_start', timeRangeStart);
        if (timeRangeEnd)
            params.set('time_range_end', timeRangeEnd);
        const query = params.size > 0 ? `?${params.toString()}` : '';
        return this.makeRequest('GET', `/inference/user-status${query}`);
    }
    loadModelForInference(modelName, gpu, force = false, vllmConfig) {
        const data = { force, gpu, model_name: modelName };
        if (vllmConfig)
            data.vllm_config = vllmConfig;
        return this.makeRequest('POST', '/inference/load', {
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        });
    }
    logout() {
        if (fs.existsSync(ModelManagementClient.CONFIG_FILE)) {
            fs.rmSync(ModelManagementClient.CONFIG_FILE);
        }
        this.token = null;
        this.refreshToken = null;
        console.log('Successfully logged out!');
    }
    registerModel(name, provider, url, apiKey, force = false) {
        const data = { force, name, provider };
        if (url)
            data.url = url;
        if (apiKey)
            data.api_key = apiKey;
        return this.makeRequest('POST', '/models/load', {
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        });
    }
    unloadModelFromInference(sessionId) {
        return this.makeRequest('POST', '/inference/unload', {
            body: JSON.stringify({ session_id: sessionId }),
            headers: { 'Content-Type': 'application/json' },
        });
    }
    async getRefreshToken() {
        if (!this.refreshToken) {
            return false;
        }
        try {
            const response = await fetch(`${this.baseUrl}/auth/refresh`, {
                body: JSON.stringify({ refresh_token: this.refreshToken }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            });
            if (!response.ok)
                return false;
            const data = await response.json();
            this.token = data.access_token;
            this.refreshToken = data.refresh_token;
            this.saveConfig();
            return true;
        }
        catch {
            return false;
        }
    }
    headers() {
        if (!this.token) {
            ux.error(`Not authenticated. Please run 'regolo auth login' first.`, { exit: 1 });
        }
        return { Authorization: `Bearer ${this.token}` };
    }
    loadConfig() {
        if (fs.existsSync(ModelManagementClient.CONFIG_FILE)) {
            try {
                const config = JSON.parse(fs.readFileSync(ModelManagementClient.CONFIG_FILE, 'utf8'));
                this.token = config.access_token ?? null;
                this.refreshToken = config.refresh_token ?? null;
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                ux.error(`Failed to load config: ${message}`);
            }
        }
    }
    async makeRequest(method, endpoint, options) {
        const url = `${this.baseUrl}${endpoint}`;
        const doFetch = () => fetch(url, {
            ...options,
            headers: {
                ...options?.headers,
                ...this.headers(),
            },
            method,
            signal: AbortSignal.timeout(this.timeoutSeconds * 1000),
        });
        let response = await doFetch();
        if (response.status === 401 && this.refreshToken) {
            if (await this.getRefreshToken()) {
                response = await doFetch();
            }
            else {
                ux.error('Authentication failed. Please login again.');
            }
        }
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            ux.error(`API Error: ${response.statusText}. Request error: ${JSON.stringify(errorBody)}`);
        }
        const text = await response.text();
        return text ? JSON.parse(text) : {};
    }
    saveConfig() {
        const config = {
            access_token: this.token,
            refresh_token: this.refreshToken,
        };
        fs.mkdirSync(dirname(ModelManagementClient.CONFIG_FILE), { recursive: true });
        fs.writeFileSync(ModelManagementClient.CONFIG_FILE, JSON.stringify(config));
    }
}
