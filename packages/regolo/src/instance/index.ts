import { KeysHandler } from "../keys/index.js";
import { ModelsHandler } from "../models/index.js";
import { Conversation, ConversationLine } from "./structures/conversationModel.js";

export class RegoloInstance {
  conversation: Conversation;
  apiKey: string;
  chatModel: string | null;
  imageGenerationModel: string | null;
  embedderModel: string | null;
  audioTranscriptionModel: string | null;
  rerankerModel: string | null;
  baseUrl: string;

  constructor(
    chatModel: string | null,
    embedderModel: string | null,
    imageGenerationModel: string | null,
    audioTranscriptionModel: string | null,
    rerankerModel: string | null,
    apiKey: string,
    baseUrl: string,
    previousConversations?: Conversation,
  ) {
    this.conversation = previousConversations ?? new Conversation();
    this.apiKey = KeysHandler.checkKey(apiKey);
    this.chatModel = chatModel;
    this.imageGenerationModel = imageGenerationModel;
    this.audioTranscriptionModel = audioTranscriptionModel;
    this.embedderModel = embedderModel;
    this.rerankerModel = rerankerModel;
    this.baseUrl = baseUrl;
  }

  getApiKey(): string { return this.apiKey; }
  getModel(): string | null { return this.chatModel; }
  getBaseUrl(): string { return this.baseUrl; }
  getImageModel(): string | null { return this.imageGenerationModel; }
  getEmbedderModel(): string | null { return this.embedderModel; }
  getRerankerModel(): string | null { return this.rerankerModel; }

  async changeModel(newModel: string): Promise<void> {
    this.chatModel = await ModelsHandler.checkModel(newModel, this.baseUrl, this.apiKey);
  }

  getConversation(): ConversationLine[] {
    return this.conversation.getLines();
  }

  addLine(line: ConversationLine): void {
    this.conversation.lines.push(line);
  }

  overwriteConversation(conversation: Conversation): void {
    this.conversation = conversation;
  }

  clearConversation(): void {
    this.conversation = new Conversation();
  }

  addPromptAsRole(prompt: string, role: string): void {
    this.conversation.lines.push({ role, content: prompt });
  }
}
