import { Flags } from "@oclif/core";
import { KeysHandler, RegoloClient } from "@regolo/sdk";
import * as fs from "node:fs";

import { BaseCommand } from "../base-command.js";

type EmbeddingItem = {
  index?: number;
  embedding?: number[];
};

export default class Embeddings extends BaseCommand {
  static override description = "Generate embeddings for one or more input texts";
  static override examples = [
    '<%= config.bin %> <%= command.id %> --apiKey YOUR_KEY --model MODEL --input "hello world"',
    '<%= config.bin %> <%= command.id %> --apiKey YOUR_KEY --model MODEL --input "text 1" --input "text 2" --format table',
    '<%= config.bin %> <%= command.id %> --apiKey YOUR_KEY --model MODEL --input-file inputs.json --save-path out.json',
  ];
  static override flags = {
    apiKey: Flags.string({
      aliases: ["api-key"],
      description: "The API key used for generating embeddings.",
      required: true,
    }),
    model: Flags.string({
      description: "The embedding model to use.",
      required: false,
    }),
    input: Flags.string({
      description: "Input text to embed (can be specified multiple times).",
      multiple: true,
      required: false,
    }),
    inputFile: Flags.string({
      aliases: ["input-file"],
      description: "Path to a JSON file containing an array of input strings.",
      required: false,
    }),
    savePath: Flags.string({
      aliases: ["save-path"],
      description: "Path to save the embeddings output as JSON.",
      required: false,
    }),
    fullOutput: Flags.boolean({
      aliases: ["full-output"],
      default: false,
      description: "Return the full API response instead of just the data array.",
      required: false,
    }),
    outputFormat: Flags.string({
      aliases: ["format"],
      default: "json",
      description: "Output format: 'json' (default) or 'table'.",
      options: ["json", "table"],
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Embeddings);
    const { apiKey, model, input, inputFile, savePath, fullOutput, outputFormat } = flags;

    try {
      KeysHandler.checkKey(apiKey);

      let inputData: string | string[];

      if (inputFile) {
        let raw: unknown;
        try {
          raw = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
        } catch (e) {
          this.error(`Failed to read input file: ${e}`);
        }
        if (!Array.isArray(raw) || raw.some((v) => typeof v !== "string")) {
          this.error("Input file must contain a JSON array of strings");
        }
        inputData = raw as string[];
      } else {
        if (!input?.length) {
          this.error("Either --input or --input-file must be specified");
        }
        inputData = input.length === 1 ? input[0] : input;
      }

      const count = Array.isArray(inputData) ? inputData.length : 1;
      this.log(`Generating embeddings for ${count} input(s)...`);

      const response = await RegoloClient.embeddings(inputData, {
        apiKey,
        model: model ?? null,
        fullOutput,
      });

      let output: string;

      if (outputFormat === "json") {
        output = JSON.stringify(response, null, 2);
      } else {
        let items: EmbeddingItem[];

        if (fullOutput && !Array.isArray(response)) {
          items = ((response as { data?: EmbeddingItem[] }).data) ?? [];
        } else {
          items = response as EmbeddingItem[];
        }

        const lines: string[] = [`\nEmbedding Results (${items.length} vector(s)):\n`];

        for (const [i, item] of items.entries()) {
          const index = item.index ?? i;
          const vec = item.embedding ?? [];
          const dims = vec.length;
          const preview = vec.slice(0, 5).map((v) => v.toFixed(4)).join(", ");
          const suffix = dims > 5 ? ", ..." : "";

          lines.push(`  ${i + 1}. Index #${index} - Dimensions: ${dims}`);
          lines.push(`     Values: [${preview}${suffix}]`);
          lines.push("");
        }

        output = lines.join("\n");
      }

      if (savePath) {
        fs.writeFileSync(savePath, JSON.stringify(response, null, 2));
        this.log(`Embeddings saved to: ${savePath}`);
      } else {
        this.log(output);
      }
    } catch (e) {
      this.error(`Embeddings failed: ${e}`);
    }
  }
}
