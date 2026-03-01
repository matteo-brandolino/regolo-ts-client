import { Flags } from "@oclif/core";
import { KeysHandler, RegoloClient } from "@regolo/sdk";
import * as fs from "node:fs";

import { BaseCommand } from "../base-command.js";

type RerankResult = {
  index?: number;
  relevance_score?: number;
  document?: string | Record<string, unknown>;
};

export default class Rerank extends BaseCommand {
  static override description = "Rerank documents based on relevance to a query";
  static override examples = [
    '<%= config.bin %> <%= command.id %> --apiKey YOUR_KEY --model MODEL --query "search query" --documents "doc 1" --documents "doc 2"',
    '<%= config.bin %> <%= command.id %> --apiKey YOUR_KEY --model MODEL --query "search query" --documents-file docs.json --format json',
  ];
  static override flags = {
    apiKey: Flags.string({
      aliases: ["api-key"],
      description: "The API key used for reranking.",
      required: true,
    }),
    model: Flags.string({
      description: "The reranking model to use.",
      required: true,
    }),
    query: Flags.string({
      description: "The search query to compare documents against.",
      required: true,
    }),
    documents: Flags.string({
      description: "Documents to rerank (can be specified multiple times).",
      multiple: true,
      required: false,
    }),
    documentsFile: Flags.string({
      aliases: ["documents-file"],
      description: "Path to a JSON file containing a documents array.",
      required: false,
    }),
    topN: Flags.integer({
      aliases: ["top-n"],
      description: "Number of most relevant documents to return.",
      required: false,
    }),
    rankFields: Flags.string({
      aliases: ["rank-fields"],
      description: "For structured documents, fields to rank by (can be specified multiple times).",
      multiple: true,
      required: false,
    }),
    noReturnDocuments: Flags.boolean({
      aliases: ["no-return-documents"],
      default: false,
      description: "Do not return document content in results (only indices and scores).",
      required: false,
    }),
    maxChunksPerDoc: Flags.integer({
      aliases: ["max-chunks-per-doc"],
      description: "Maximum number of chunks per document.",
      required: false,
    }),
    savePath: Flags.string({
      aliases: ["save-path"],
      description: "Path to save the reranking results as JSON.",
      required: false,
    }),
    fullOutput: Flags.boolean({
      aliases: ["full-output"],
      default: false,
      description: "Return the full API response instead of just results.",
      required: false,
    }),
    outputFormat: Flags.string({
      aliases: ["format"],
      default: "table",
      description: "Output format: 'table' (default) or 'json'.",
      options: ["json", "table"],
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Rerank);
    const {
      apiKey,
      model,
      query,
      documents,
      documentsFile,
      topN,
      rankFields,
      noReturnDocuments,
      maxChunksPerDoc,
      savePath,
      fullOutput,
      outputFormat,
    } = flags;

    try {
      KeysHandler.checkKey(apiKey);

      let docsList: (string | Record<string, unknown>)[];

      if (documentsFile) {
        let raw: unknown;
        try {
          raw = JSON.parse(fs.readFileSync(documentsFile, "utf-8"));
        } catch (e) {
          this.error(`Failed to read documents file: ${e}`);
        }
        if (!Array.isArray(raw)) {
          this.error("Documents file must contain a JSON array");
        }
        docsList = raw as (string | Record<string, unknown>)[];
      } else {
        if (!documents?.length) {
          this.error("Either --documents or --documents-file must be specified");
        }
        docsList = documents;
      }

      if (docsList.length === 0) {
        this.error("No documents provided for reranking");
      }

      this.log(`Reranking ${docsList.length} documents with query: '${query}'...`);

      const response = await RegoloClient.rerank(query, docsList, {
        apiKey,
        model,
        topN: topN ?? null,
        rankFields: rankFields?.length ? rankFields : null,
        returnDocuments: !noReturnDocuments,
        maxChunksPerDoc: maxChunksPerDoc ?? null,
        fullOutput,
      });

      let output: string;

      if (outputFormat === "json") {
        output = JSON.stringify(response, null, 2);
      } else {
        let results: RerankResult[];
        const lines: string[] = [];

        if (fullOutput && !Array.isArray(response)) {
          const full = response as { results?: RerankResult[] };
          const metadata = Object.fromEntries(
            Object.entries(response as object).filter(([k]) => k !== "results"),
          );
          if (Object.keys(metadata).length > 0) {
            lines.push("Response Metadata:");
            lines.push(JSON.stringify(metadata, null, 2));
            lines.push("");
          }
          results = full.results ?? [];
        } else {
          results = response as RerankResult[];
        }

        lines.push(`\nReranking Results (Top ${results.length} documents):\n`);

        for (const [i, result] of results.entries()) {
          const index = result.index ?? "N/A";
          const score = result.relevance_score;
          const scorePct =
            typeof score === "number" ? `${(score * 100).toFixed(2)}%` : String(score);

          lines.push(`  ${i + 1}. Document #${index} - Relevance: ${scorePct}`);

          if ("document" in result && result.document !== undefined) {
            const doc = result.document;
            if (typeof doc === "object") {
              lines.push(`     Content: ${JSON.stringify(doc)}`);
            } else {
              const docStr = String(doc);
              lines.push(`     Content: ${docStr.length > 200 ? docStr.slice(0, 197) + "..." : docStr}`);
            }
          }

          lines.push("");
        }

        output = lines.join("\n");
      }

      if (savePath) {
        const fileContent =
          outputFormat === "json" ? output : JSON.stringify(response, null, 2);
        fs.writeFileSync(savePath, fileContent);
        this.log(`Reranking results saved to: ${savePath}`);
      } else {
        this.log(output);
      }
    } catch (e) {
      this.error(`Reranking failed: ${e}`);
    }
  }
}
