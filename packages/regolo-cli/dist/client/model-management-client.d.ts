interface ModelInfo {
    created_at?: string;
    email?: string;
    id: string;
    name: string;
    provider: string;
    url?: string;
}
interface ModelsListResponse {
    models: ModelInfo[];
    total: number;
}
export declare class ModelManagementClient {
    private baseUrl;
    private static readonly CONFIG_FILE;
    private refreshToken;
    private readonly timeoutSeconds;
    private token;
    constructor(baseUrl?: string);
    addSshKey(title: string, key: string): Promise<unknown>;
    authenticate(username: string, password: string): Promise<void>;
    deleteModel(modelName: string): Promise<unknown>;
    deleteSshKey(keyId: string): Promise<unknown>;
    getAvailableGpus(): Promise<unknown>;
    getLoadedModels(): Promise<unknown>;
    getModel(modelName: string): Promise<ModelInfo>;
    getModels(): Promise<ModelsListResponse>;
    getSshKeys(): Promise<unknown>;
    getUserInferenceStatus(month?: string, timeRangeStart?: string, timeRangeEnd?: string): Promise<unknown>;
    loadModelForInference(modelName: string, gpu: string, force?: boolean, vllmConfig?: Record<string, unknown>): Promise<unknown>;
    logout(): void;
    registerModel(name: string, provider: string, url?: string, apiKey?: string, force?: boolean): Promise<ModelInfo>;
    unloadModelFromInference(sessionId: number): Promise<unknown>;
    private getRefreshToken;
    private headers;
    private loadConfig;
    private makeRequest;
    private saveConfig;
}
export {};
