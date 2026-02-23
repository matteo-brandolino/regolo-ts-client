export const VERSION = "1.9.1";

export const config = {
  enableModelChecks: true,
  defaultKey: null as string | null,
  defaultChatModel: null as string | null,
  defaultImageGenerationModel: null as string | null,
  defaultEmbedderModel: null as string | null,
  defaultAudioTranscriptionModel: null as string | null,
  defaultRerankerModel: null as string | null,
};

export function tryLoadingFromEnv(): void {
  if (process.env.API_KEY)                   config.defaultKey = process.env.API_KEY;
  if (process.env.LLM)                       config.defaultChatModel = process.env.LLM;
  if (process.env.IMAGE_GENERATION_MODEL)    config.defaultImageGenerationModel = process.env.IMAGE_GENERATION_MODEL;
  if (process.env.EMBEDDER_MODEL)            config.defaultEmbedderModel = process.env.EMBEDDER_MODEL;
  if (process.env.AUDIO_TRANSCRIPTION_MODEL) config.defaultAudioTranscriptionModel = process.env.AUDIO_TRANSCRIPTION_MODEL;
}
