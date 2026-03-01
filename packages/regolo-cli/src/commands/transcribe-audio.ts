import { Flags } from "@oclif/core";
import { KeysHandler, RegoloClient } from "@regolo/sdk";
import * as fs from "node:fs";

import { BaseCommand } from "../base-command.js";

export default class TranscribeAudio extends BaseCommand {
  static override description = "Transcribes audio files using speech-to-text models";
  static override examples = [
    "<%= config.bin %> <%= command.id %> --apiKey YOUR_KEY --model whisper-1 --file-path audio.mp3",
    "<%= config.bin %> <%= command.id %> --apiKey YOUR_KEY --model whisper-1 --file-path audio.mp3 --save-path out.txt",
    "<%= config.bin %> <%= command.id %> --apiKey YOUR_KEY --model whisper-1 --file-path audio.mp3 --stream",
  ];
  static override flags = {
    apiKey: Flags.string({
      aliases: ["api-key"],
      description: "The API key used for transcription.",
      required: true,
    }),
    model: Flags.string({
      description: "The speech-to-text model to use.",
      required: true,
    }),
    filePath: Flags.string({
      aliases: ["file-path"],
      description: "Path to the audio file to transcribe.",
      required: true,
    }),
    savePath: Flags.string({
      aliases: ["save-path"],
      description: "Path to save the transcription output.",
      required: false,
    }),
    language: Flags.string({
      description: "The language of the audio (ISO-639-1 code).",
      required: false,
    }),
    prompt: Flags.string({
      description: "Optional prompt to guide the transcription.",
      required: false,
    }),
    responseFormat: Flags.string({
      aliases: ["response-format"],
      default: "json",
      description: "The format of the transcription output. (Defaults to 'json')",
      options: ["json", "text", "srt", "verbose_json", "vtt"],
      required: false,
    }),
    temperature: Flags.string({
      description: "Sampling temperature between 0 and 1.",
      required: false,
    }),
    chunkingStrategy: Flags.string({
      aliases: ["chunking-strategy"],
      description: "The chunking strategy to use for the audio.",
      required: false,
    }),
    includeLogprobs: Flags.boolean({
      aliases: ["include-logprobs"],
      default: false,
      description: "Include log probabilities in the output.",
      required: false,
    }),
    timestampGranularities: Flags.string({
      aliases: ["timestamp-granularities"],
      description: "Timestamp granularities to include (word, segment).",
      multiple: true,
      options: ["word", "segment"],
      required: false,
    }),
    stream: Flags.boolean({
      default: false,
      description: "Stream the transcription output.",
      required: false,
    }),
    fullOutput: Flags.boolean({
      aliases: ["full-output"],
      default: false,
      description: "Return the full JSON response instead of just the text.",
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(TranscribeAudio);
    const {
      apiKey,
      model,
      filePath,
      savePath,
      language,
      prompt,
      responseFormat,
      temperature,
      chunkingStrategy,
      includeLogprobs,
      timestampGranularities,
      stream,
      fullOutput,
    } = flags;

    try {
      KeysHandler.checkKey(apiKey);

      const result = await RegoloClient.audioTranscription(filePath, {
        apiKey,
        model,
        chunkingStrategy: chunkingStrategy ?? null,
        include: includeLogprobs ? ["logprobs"] : null,
        language: language ?? null,
        prompt: prompt ?? null,
        responseFormat,
        stream,
        temperature: temperature !== undefined ? parseFloat(temperature) : null,
        timestampGranularities: timestampGranularities?.length ? timestampGranularities : null,
        fullOutput,
      });

      if (stream) {
        const generator = result as AsyncGenerator<string | object>;
        let output = "";
        for await (const chunk of generator) {
          const text = typeof chunk === "string" ? chunk : JSON.stringify(chunk, null, 2);
          process.stdout.write(text);
          output += text;
        }
        process.stdout.write("\n");

        if (savePath) {
          fs.writeFileSync(savePath, output);
          this.log(`Saved: ${savePath}`);
        }
      } else {
        let text: string;
        if (fullOutput) {
          text = JSON.stringify(result, null, 2);
        } else if (responseFormat === "json" && typeof result === "object") {
          text = (result as { text?: string }).text ?? JSON.stringify(result);
        } else {
          text = String(result);
        }

        if (savePath) {
          fs.writeFileSync(savePath, text);
          this.log(`Saved: ${savePath}`);
        } else {
          this.log(text);
        }
      }
    } catch (e) {
      this.error(`Transcription failed: ${e}`);
    }
  }
}
