import { config } from "../config.js";
import { KeysHandler } from "../keys/index.js";
import { ModelsHandler } from "../models/index.js";
import { RegoloInstance } from "../instance/index.js";
import { Conversation, ConversationLine } from "../instance/structures/conversationModel.js";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const REGOLO_URL = "https://api.regolo.ai";
const COMPLETIONS_URL_PATH = "/v1/completions";
const CHAT_COMPLETIONS_URL_PATH = "/v1/chat/completions";
const IMAGE_GENERATION_URL_PATH = "/v1/images/generations";
const EMBEDDINGS_URL_PATH = "/v1/embeddings";
const AUDIO_TRANSCRIPTION_URL_PATH = "/v1/audio/transcriptions";
const RERANK_URL_PATH = "/v1/rerank";
const TIMEOUT_MS = 500_000;

export interface AvailableModelInfo {
  model_info: {
    mode: string
  }
  model_name: string
}

export interface GetAvailableModelsOptions {
  baseUrl?: string;
  modelInfo?: boolean;
}

export interface RegoloClientOptions {
  apiKey?: string | null;
  alternativeUrl?: string | null;
  audioTranscriptionModel?: string | null;
  chatModel?: string | null;
  embedderModel?: string | null;
  imageGenerationModel?: string | null;
  preExistentConversation?: Conversation;
  rerankerModel?: string | null;
}

export interface RunChatOptions {
  fullOutput?: boolean;
  maxTokens?: number;
  stream?: boolean;
  temperature?: number | null;
  topK?: number | null;
  topP?: number | null;
}

export interface AudioTranscriptionOptions {
  apiKey?: string | null;
  baseUrl?: string;
  chunkingStrategy?: string | Record<string, unknown> | null;
  fullOutput?: boolean;
  include?: string[] | null;
  language?: string | null;
  model?: string | null;
  prompt?: string | null;
  responseFormat?: string;
  stream?: boolean;
  temperature?: number | null;
  timestampGranularities?: string[] | null;
}

export interface RerankOptions {
  apiKey?: string | null;
  baseUrl?: string;
  fullOutput?: boolean;
  maxChunksPerDoc?: number | null;
  model?: string | null;
  rankFields?: string[] | null;
  returnDocuments?: boolean;
  topN?: number | null;
}

export interface EmbeddingsOptions {
  apiKey?: string | null;
  baseUrl?: string;
  fullOutput?: boolean;
  model?: string | null;
}

type Role = string;
type Content = string;
type OutputHandler<T> = (chunk: unknown) => T;
type AudioFileInput = string | Buffer | Blob | File;
type RerankDocument = string | Record<string, unknown>;

function stripNulls(payload: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== null && v !== undefined),
  );
}

async function safePost(
  url: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<Response> {
  const response = await fetch(url, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response;
}

export class RegoloClient {
  instance: RegoloInstance;

  constructor({
    chatModel,
    embedderModel,
    imageGenerationModel,
    audioTranscriptionModel,
    rerankerModel,
    apiKey,
    alternativeUrl,
    preExistentConversation,
  }: RegoloClientOptions = {}) {
    const resolvedKey = (apiKey ?? config.defaultKey) ?? "";
    const baseUrl = alternativeUrl ?? REGOLO_URL;

    this.instance = new RegoloInstance(
      chatModel ?? config.defaultChatModel,
      embedderModel ?? config.defaultEmbedderModel,
      imageGenerationModel ?? config.defaultImageGenerationModel,
      audioTranscriptionModel ?? config.defaultAudioTranscriptionModel,
      rerankerModel ?? config.defaultRerankerModel,
      resolvedKey,
      baseUrl,
      preExistentConversation,
    );
  }

  static fromInstance(instance: RegoloInstance, alternativeUrl?: string | null): RegoloClient {
    return new RegoloClient({
      chatModel: instance.chatModel,
      embedderModel: instance.embedderModel,
      imageGenerationModel: instance.imageGenerationModel,
      audioTranscriptionModel: instance.audioTranscriptionModel,
      rerankerModel: instance.rerankerModel,
      apiKey: instance.apiKey,
      alternativeUrl: alternativeUrl ?? instance.baseUrl,
      preExistentConversation: instance.conversation,
    });
  }

  static async *createStreamGenerator<T>(
    url: string,
    headers: Record<string, string>,
    payload?: Record<string, unknown> | null,
    formData?: FormData | null,
    fullOutput: boolean = false,
    outputHandler?: OutputHandler<T>,
  ): AsyncGenerator<unknown> {
    if (payload == null && formData == null) {
      throw new Error("Either payload (for JSON) or formData (for multipart) must be provided");
    }

    const fetchHeaders: Record<string, string> =
      payload != null ? { ...headers, "Content-Type": "application/json" } : { ...headers };

    const response = await fetch(url, {
      method: "POST",
      headers: fetchHeaders,
      body: payload != null ? JSON.stringify(payload) : formData!,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed === "data: [DONE]") return;

          let data = trimmed;
          if (data.startsWith("data:")) {
            data = data.slice("data:".length).trim();
          }

          let chunk: unknown;
          try {
            chunk = JSON.parse(data);
          } catch {
            continue;
          }

          if (fullOutput) {
            yield chunk;
          } else {
            yield outputHandler!(chunk);
          }
        }
      }

      // Flush any remaining buffer content
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed === "data: [DONE]") return;
        let data = trimmed;
        if (data.startsWith("data:")) data = data.slice("data:".length).trim();
        try {
          const chunk = JSON.parse(data);
          if (fullOutput) yield chunk;
          else yield outputHandler!(chunk);
        } catch {
          // ignore malformed chunk
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // ── Completions ──────────────────────────────────────────────────────────────

  static async completions(
    prompt: string,
    model?: string | null,
    apiKey?: string | null,
    stream: boolean = false,
    maxTokens: number = 200,
    temperature?: number | null,
    topP?: number | null,
    topK?: number | null,
    baseUrl: string = REGOLO_URL,
    fullOutput: boolean = false,
  ): Promise<string | object | AsyncGenerator<unknown>> {
    const resolvedKey = (apiKey ?? config.defaultKey) ?? "";
    const checkedKey = KeysHandler.checkKey(resolvedKey);
    const resolvedModel = (model ?? config.defaultChatModel) ?? "";
    await ModelsHandler.checkModel(resolvedModel, baseUrl, checkedKey);

    const payload = stripNulls({
      prompt,
      stream,
      model: resolvedModel,
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      top_k: topK,
    });

    const headers = { Authorization: checkedKey };

    if (stream) {
      return RegoloClient.createStreamGenerator(
        `${baseUrl}${COMPLETIONS_URL_PATH}`,
        headers,
        payload,
        null,
        fullOutput,
        (chunk: unknown): string | undefined => {
          const c = chunk as Record<string, unknown>;
          const choices = (c?.choices as Record<string, unknown>[]) ?? [{}];
          return choices[0]?.text as string | undefined;
        },
      );
    }

    const response = await safePost(`${baseUrl}${COMPLETIONS_URL_PATH}`, payload, headers);
    const json = (await response.json()) as Record<string, unknown>;
    if (fullOutput) return json;
    return ((json.choices as Record<string, unknown>[])[0].text) as string;
  }

  async completions(
    prompt: string,
    stream: boolean = false,
    maxTokens: number = 200,
    temperature?: number | null,
    topP?: number | null,
    topK?: number | null,
    fullOutput: boolean = false,
  ): Promise<string | object | AsyncGenerator<unknown>> {
    return RegoloClient.completions(
      prompt,
      this.instance.chatModel,
      this.instance.apiKey,
      stream,
      maxTokens,
      temperature,
      topP,
      topK,
      this.instance.baseUrl,
      fullOutput,
    );
  }

  // ── Chat completions ─────────────────────────────────────────────────────────

  static async chatCompletions(
    messages: ConversationLine[] | Conversation,
    model?: string | null,
    apiKey?: string | null,
    stream: boolean = false,
    maxTokens: number = 200,
    temperature?: number | null,
    topP?: number | null,
    topK?: number | null,
    baseUrl: string = REGOLO_URL,
    fullOutput: boolean = false,
  ): Promise<[Role, Content] | object | AsyncGenerator<unknown>> {
    const resolvedKey = (apiKey ?? config.defaultKey) ?? "";
    const checkedKey = KeysHandler.checkKey(resolvedKey);
    const resolvedModel = (model ?? config.defaultChatModel) ?? "";
    await ModelsHandler.checkModel(resolvedModel, baseUrl, checkedKey);

    const messageList = messages instanceof Conversation ? messages.getLines() : messages;

    const payload = stripNulls({
      model: resolvedModel,
      stream,
      messages: messageList,
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      top_k: topK,
    });

    const headers = { Authorization: checkedKey };

    const _state = { inReasoning: false };

    const chatOutputHandler = (chunk: unknown): [Role, Content] | null => {
      const resolve = (delta: Record<string, string>): [Role, Content] => {
        const content = delta.content;
        const reasoning = delta.reasoning_content;
        if (content) {
          _state.inReasoning = false;
          return ["", content];
        } else if (reasoning) {
          _state.inReasoning = true;
          return ["thinking", reasoning];
        }
        return ["", ""];
      };

      if (Array.isArray(chunk)) {
        const element = chunk[0] as Record<string, unknown>;
        const delta =
          ((element?.choices as Record<string, unknown>[])?.[0]?.delta as Record<string, string>) ??
          {};
        return resolve(delta);
      } else if (typeof chunk === "object" && chunk !== null) {
        const c = chunk as Record<string, unknown>;
        const choices = (c.choices as Record<string, unknown>[]) ?? [{}];
        const delta = (choices[0]?.delta as Record<string, string>) ?? {};
        return resolve(delta);
      }
      return null;
    };

    if (stream) {
      return RegoloClient.createStreamGenerator(
        `${baseUrl}${CHAT_COMPLETIONS_URL_PATH}`,
        headers,
        payload,
        null,
        fullOutput,
        chatOutputHandler,
      );
    }

    const response = await safePost(`${baseUrl}${CHAT_COMPLETIONS_URL_PATH}`, payload, headers);
    const json = (await response.json()) as Record<string, unknown>;
    if (fullOutput) return json;
    const msg = ((json.choices as Record<string, unknown>[])[0].message) as Record<string, string>;
    return [msg.role, msg.content] as [Role, Content];
  }

  addPromptToChat(prompt: string, role: string): void {
    this.instance.addPromptAsRole(prompt, role);
  }

  clearConversations(): void {
    this.instance.clearConversation();
  }

  async runChat(
    userPrompt?: string | null,
    { stream = false, maxTokens = 2048, temperature, topP, topK, fullOutput = false }: RunChatOptions = {},
  ): Promise<[Role, Content] | object | AsyncGenerator<unknown>> {
    if (userPrompt != null) {
      this.instance.addPromptAsRole(userPrompt, "user");
    }

    const response = await RegoloClient.chatCompletions(
      this.instance.getConversation(),
      this.instance.chatModel,
      this.instance.apiKey,
      stream,
      maxTokens,
      temperature,
      topP,
      topK,
      this.instance.baseUrl,
      fullOutput,
    );

    if (!stream) {
      let responseRole: Role;
      let responseText: Content;

      if (fullOutput) {
        const json = response as Record<string, unknown>;
        const msg = ((json.choices as Record<string, unknown>[])[0].message) as Record<
          string,
          string
        >;
        responseRole = msg.role;
        responseText = msg.content;
      } else {
        [responseRole, responseText] = response as [Role, Content];
      }

      this.instance.addLine({ role: responseRole, content: responseText });
    }

    if (stream) {
      return RegoloClient.streamingWithHistoryUpdate(
        response as AsyncGenerator<unknown>,
        this.instance,
      );
    }
    return response;
  }

  private static async *streamingWithHistoryUpdate(
    generator: AsyncGenerator<unknown>,
    instance: RegoloInstance,
  ): AsyncGenerator<unknown> {
    let accumulatedContent = "";
    for await (const chunk of generator) {
      if (chunk != null) {
        const [role, content] = chunk as [string, string];
        if (role !== "thinking" && content) {
          accumulatedContent += content;
        }
      }
      yield chunk;
    }
    if (accumulatedContent) {
      instance.addLine({ role: "assistant", content: accumulatedContent });
    }
  }

  // ── Image generation ─────────────────────────────────────────────────────────

  static async createImage(
    prompt: string,
    model?: string | null,
    apiKey?: string | null,
    n: number = 1,
    quality: string = "standard",
    size: string = "1024x1024",
    style: string = "realistic",
    baseUrl: string = REGOLO_URL,
    fullOutput: boolean = false,
  ): Promise<Buffer[] | object> {
    const resolvedKey = (apiKey ?? config.defaultKey) ?? "";
    const checkedKey = KeysHandler.checkKey(resolvedKey);
    const resolvedModel = (model ?? config.defaultImageGenerationModel) ?? "";
    await ModelsHandler.checkModel(resolvedModel, baseUrl, checkedKey);

    const payload = stripNulls({
      model: resolvedModel,
      prompt,
      n,
      quality,
      size,
      style,
    });

    const headers = { Authorization: checkedKey };
    const response = await safePost(`${baseUrl}${IMAGE_GENERATION_URL_PATH}`, payload, headers);
    const json = (await response.json()) as Record<string, unknown>;

    if (fullOutput) return json;
    return (json.data as Record<string, string>[]).map((img) =>
      Buffer.from(img.b64_json, "base64"),
    );
  }

  async createImage(
    prompt: string,
    n: number = 1,
    quality: string = "standard",
    size: string = "1024x1024",
    style: string = "realistic",
    fullOutput: boolean = false,
  ): Promise<Buffer[] | object> {
    return RegoloClient.createImage(
      prompt,
      this.instance.imageGenerationModel,
      this.instance.apiKey,
      n,
      quality,
      size,
      style,
      this.instance.baseUrl,
      fullOutput,
    );
  }

  // ── Embeddings ───────────────────────────────────────────────────────────────

  static async embeddings(
    inputText: string | string[],
    {
      model,
      apiKey,
      baseUrl = REGOLO_URL,
      fullOutput = false,
    }: EmbeddingsOptions = {},
  ): Promise<object> {
    const resolvedKey = (apiKey ?? config.defaultKey) ?? "";
    const checkedKey = KeysHandler.checkKey(resolvedKey);
    const resolvedModel = (model ?? config.defaultEmbedderModel) ?? "";
    await ModelsHandler.checkModel(resolvedModel, baseUrl, checkedKey);

    const payload = stripNulls({
      input: inputText,
      model: resolvedModel,
    });

    const headers = { Authorization: checkedKey };
    const response = await safePost(`${baseUrl}${EMBEDDINGS_URL_PATH}`, payload, headers);
    const json = (await response.json()) as Record<string, unknown>;

    if (fullOutput) return json;
    return json.data as object;
  }

  async embeddings(
    inputText: string | string[],
    options: Omit<EmbeddingsOptions, "apiKey" | "baseUrl"> = {},
  ): Promise<object> {
    return RegoloClient.embeddings(inputText, {
      ...options,
      model: options.model ?? this.instance.embedderModel,
      apiKey: this.instance.apiKey,
      baseUrl: this.instance.baseUrl,
    });
  }

  // ── Audio transcription ──────────────────────────────────────────────────────

  static async audioTranscription(
    file: AudioFileInput,
    {
      model,
      apiKey,
      chunkingStrategy,
      include,
      language,
      prompt,
      responseFormat = "json",
      stream = false,
      temperature,
      timestampGranularities,
      baseUrl = REGOLO_URL,
      fullOutput = false,
    }: AudioTranscriptionOptions = {},
  ): Promise<string | object | AsyncGenerator<unknown>> {
    const resolvedKey = (apiKey ?? config.defaultKey) ?? "";
    const checkedKey = KeysHandler.checkKey(resolvedKey);
    const resolvedModel = (model ?? config.defaultAudioTranscriptionModel) ?? "";
    await ModelsHandler.checkModel(resolvedModel, baseUrl, checkedKey);

    // Resolve file to a Blob
    let fileContent: Blob;
    let fileName: string;

    if (typeof file === "string") {
      const buffer = await readFile(file);
      fileName = basename(file);
      fileContent = new Blob([new Uint8Array(buffer)]);
    } else if (Buffer.isBuffer(file)) {
      fileName = "audio_file";
      fileContent = new Blob([new Uint8Array(file)]);
    } else if (file instanceof File) {
      fileName = file.name;
      fileContent = file;
    } else if (file instanceof Blob) {
      fileName = "audio_file";
      fileContent = file;
    } else {
      throw new Error("File must be a path string, Buffer, Blob, or File");
    }

    const formData = new FormData();
    formData.append("file", fileContent, fileName);
    formData.append("model", resolvedModel);
    formData.append("response_format", responseFormat);
    formData.append("stream", String(stream));

    if (chunkingStrategy != null) {
      if (typeof chunkingStrategy === "string") {
        formData.append("chunking_strategy", chunkingStrategy);
      } else {
        formData.append("chunking_strategy", JSON.stringify(chunkingStrategy));
      }
    }

    if (include != null) {
      for (const item of include) {
        formData.append("include[]", item);
      }
    }

    if (language != null) formData.append("language", language);
    if (prompt != null) formData.append("prompt", prompt);
    if (temperature != null) formData.append("temperature", String(temperature));

    if (timestampGranularities != null) {
      for (const g of timestampGranularities) {
        formData.append("timestamp_granularities[]", g);
      }
    }

    const headers = { Authorization: checkedKey };

    if (stream) {
      return RegoloClient.createStreamGenerator(
        `${baseUrl}${AUDIO_TRANSCRIPTION_URL_PATH}`,
        headers,
        null,
        formData,
        fullOutput,
        (chunk: unknown): string => {
          if (typeof chunk === "object" && chunk !== null) {
            return ((chunk as Record<string, unknown>).text as string) ?? "";
          }
          return "";
        },
      );
    }

    const response = await fetch(`${baseUrl}${AUDIO_TRANSCRIPTION_URL_PATH}`, {
      method: "POST",
      headers,
      body: formData,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const json = (await response.json()) as Record<string, unknown>;
    if (fullOutput) return json;
    return (json.text as string) ?? "";
  }

  async audioTranscription(
    file: AudioFileInput,
    options: Omit<AudioTranscriptionOptions, "apiKey" | "baseUrl"> = {},
  ): Promise<string | object | AsyncGenerator<unknown>> {
    return RegoloClient.audioTranscription(file, {
      ...options,
      model: options.model ?? this.instance.audioTranscriptionModel,
      apiKey: this.instance.apiKey,
      baseUrl: this.instance.baseUrl,
    });
  }

  // ── Rerank ───────────────────────────────────────────────────────────────────

  static async rerank(
    query: string,
    documents: RerankDocument[],
    {
      model,
      apiKey,
      topN,
      rankFields,
      returnDocuments = true,
      maxChunksPerDoc,
      baseUrl = REGOLO_URL,
      fullOutput = false,
    }: RerankOptions = {},
  ): Promise<object[] | object> {
    const resolvedKey = (apiKey ?? config.defaultKey) ?? "";
    const checkedKey = KeysHandler.checkKey(resolvedKey);
    const resolvedModel = (model ?? config.defaultRerankerModel) ?? "";
    await ModelsHandler.checkModel(resolvedModel, baseUrl, checkedKey);

    const payload = stripNulls({
      model: resolvedModel,
      query,
      documents,
      top_n: topN,
      rank_fields: rankFields,
      return_documents: returnDocuments,
      max_chunks_per_doc: maxChunksPerDoc,
    });

    const headers = { Authorization: checkedKey };
    const response = await safePost(`${baseUrl}${RERANK_URL_PATH}`, payload, headers);
    const json = (await response.json()) as Record<string, unknown>;

    if (fullOutput) return json;
    return (json.results as object[]) ?? [];
  }

  async rerank(
    query: string,
    documents: RerankDocument[],
    options: Omit<RerankOptions, "apiKey" | "baseUrl"> = {},
  ): Promise<object[] | object> {
    return RegoloClient.rerank(query, documents, {
      ...options,
      model: options.model ?? this.instance.rerankerModel,
      apiKey: this.instance.apiKey,
      baseUrl: this.instance.baseUrl,
    });
  }

  // ── Available models ─────────────────────────────────────────────────────────

  static async getAvailableModels(
    apiKey: string,
    { baseUrl = REGOLO_URL, modelInfo = false }: GetAvailableModelsOptions = {},
  ): Promise<string[] | AvailableModelInfo[]> {
    const checkedKey = KeysHandler.checkKey(apiKey);
    return ModelsHandler.getModels(baseUrl, checkedKey, modelInfo) as Promise<string[] | AvailableModelInfo[]>;
  }

  // ── Utilities ────────────────────────────────────────────────────────────────

  async changeModel(model: string): Promise<void> {
    try {
      await this.instance.changeModel(model);
    } catch (e) {
      console.error(e);
    }
  }
}
