import {ux} from '@oclif/core'
import * as fs from 'node:fs'
import * as os from 'node:os'
import {dirname, join} from 'node:path'

interface AuthHeaders extends Record<string, string> {
  Authorization: string
}

interface AuthResponse {
  access_token: string
  refresh_token: string
}

interface ModelInfo {
  id: string
  name: string
  provider: string
}

type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'

interface RegisterModelPayload {
  api_key?: string
  force: boolean
  name: string
  provider: string
  url?: string
}

interface LoadModelPayload {
  force: boolean
  gpu: string
  model_name: string
  vllm_config?: Record<string, unknown>
}

export class ModelManagementClient {
  private static readonly CONFIG_FILE = join(os.homedir(), '.regolo_config.json')
  private refreshToken: null | string = null
  private readonly timeoutSeconds: number = 60
  private token: null | string = null

  constructor(private baseUrl: string = 'https://devmid.regolo.ai') {
    this.loadConfig()
  }

  addSshKey(title: string, key: string): Promise<unknown> {
    return this.makeRequest('POST', '/ssh-keys', {
      body: JSON.stringify({key, title}),
      headers: {'Content-Type': 'application/json'},
    })
  }

  async authenticate(username: string, password: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      body: JSON.stringify({password, username}),
      headers: {'Content-Type': 'application/json'},
      method: 'POST',
    })

    const data: AuthResponse = await response.json()
    if (!response.ok) {
      ux.error((data as unknown as {detail?: string})?.detail ?? 'Authentication failed')
    }

    this.token = data.access_token
    this.refreshToken = data.refresh_token
    this.saveConfig()
  }

  deleteSshKey(keyId: string): Promise<unknown> {
    return this.makeRequest('DELETE', `/ssh-keys/${keyId}`)
  }

  getAvailableGpus(): Promise<unknown> {
    return this.makeRequest('GET', '/inference/gpus')
  }

  getLoadedModels(): Promise<unknown> {
    return this.makeRequest('GET', '/inference/loaded-models')
  }

  getModel(modelName: string): Promise<ModelInfo> {
    return this.makeRequest('GET', `/models/${modelName}`) as Promise<ModelInfo>
  }

  getSshKeys(): Promise<unknown> {
    return this.makeRequest('GET', '/ssh-keys')
  }

  getUserInferenceStatus(month?: string, timeRangeStart?: string, timeRangeEnd?: string): Promise<unknown> {
    const params = new URLSearchParams()
    if (month) params.set('month', month)
    if (timeRangeStart) params.set('time_range_start', timeRangeStart)
    if (timeRangeEnd) params.set('time_range_end', timeRangeEnd)

    const query = params.size > 0 ? `?${params.toString()}` : ''
    return this.makeRequest('GET', `/inference/user-status${query}`)
  }

  loadModelForInference(
    modelName: string,
    gpu: string,
    force: boolean = false,
    vllmConfig?: Record<string, unknown>,
  ): Promise<unknown> {
    const data: LoadModelPayload = {force, gpu, model_name: modelName}
    if (vllmConfig) data.vllm_config = vllmConfig

    return this.makeRequest('POST', '/inference/load', {
      body: JSON.stringify(data),
      headers: {'Content-Type': 'application/json'},
    })
  }

  registerModel(
    name: string,
    provider: string,
    url?: string,
    apiKey?: string,
    force: boolean = false,
  ): Promise<ModelInfo> {
    const data: RegisterModelPayload = {force, name, provider}
    if (url) data.url = url
    if (apiKey) data.api_key = apiKey

    return this.makeRequest('POST', '/models/load', {
      body: JSON.stringify(data),
      headers: {'Content-Type': 'application/json'},
    }) as Promise<ModelInfo>
  }

  unloadModelFromInference(sessionId: number): Promise<unknown> {
    return this.makeRequest('POST', '/inference/unload', {
      body: JSON.stringify({session_id: sessionId}),
      headers: {'Content-Type': 'application/json'},
    })
  }

  private async getRefreshToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        body: JSON.stringify({refresh_token: this.refreshToken}),
        headers: {'Content-Type': 'application/json'},
        method: 'POST',
      })
      if (!response.ok) return false
      const data: AuthResponse = await response.json()
      this.token = data.access_token
      this.refreshToken = data.refresh_token
      this.saveConfig()
      return true
    } catch {
      return false
    }
  }

  private headers(): AuthHeaders {
    if (!this.token) {
      ux.error(`Not authenticated. Please run 'regolo auth login' first.`, {exit: 1})
    }

    return {Authorization: `Bearer ${this.token}`}
  }

  private loadConfig(): void {
    if (fs.existsSync(ModelManagementClient.CONFIG_FILE)) {
      try {
        const config = JSON.parse(fs.readFileSync(ModelManagementClient.CONFIG_FILE, 'utf8'))
        this.token = config.access_token ?? null
        this.refreshToken = config.refresh_token ?? null
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        ux.error(`Failed to load config: ${message}`)
      }
    }
  }

  private async makeRequest(method: HttpMethod, endpoint: string, options?: RequestInit): Promise<unknown> {
    const url = `${this.baseUrl}${endpoint}`

    const doFetch = () =>
      fetch(url, {
        headers: this.headers(),
        method,
        signal: AbortSignal.timeout(this.timeoutSeconds * 1000),
        ...options,
      })

    let response = await doFetch()

    if (response.status === 401 && this.refreshToken) {
      if (await this.getRefreshToken()) {
        response = await doFetch()
      } else {
        ux.error('Authentication failed. Please login again.')
      }
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      ux.error(`API Error: ${response.statusText}. Request error: ${JSON.stringify(errorBody)}`)
    }

    const text = await response.text()
    return text ? JSON.parse(text) : {}
  }

  private saveConfig(): void {
    const config = {
      access_token: this.token,
      refresh_token: this.refreshToken,
    }
    fs.mkdirSync(dirname(ModelManagementClient.CONFIG_FILE), {recursive: true})
    fs.writeFileSync(ModelManagementClient.CONFIG_FILE, JSON.stringify(config))
  }
}
