import { input, password, select } from "@inquirer/prompts";
import { Flags } from "@oclif/core";
import { AvailableModelInfo, RegoloClient } from "@regolo/sdk";

import { BaseCommand } from "../base-command.js";

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const DIM_ITALIC = "\x1b[2m\x1b[3m";

export default class Chat extends BaseCommand {
  static override description = "Allows chatting with LLMs";
  static override examples = [
    "<%= config.bin %> <%= command.id %>",
    "<%= config.bin %> <%= command.id %> --apiKey YOUR_KEY",
    "<%= config.bin %> <%= command.id %> --apiKey YOUR_KEY --disableNewlines",
  ];
  static override flags = {
    apiKey: Flags.string({
      aliases: ["api-key"],
      description: "The API key used to chat with Regolo.",
      required: false,
    }),
    disableNewlines: Flags.boolean({
      aliases: ["disable-newlines"],
      default: false,
      description:
        "Disable new lines, they will be replaced with space character",
      required: false,
    }),
    noHide: Flags.boolean({
      aliases: ["no-hide"],
      default: false,
      description: "Do not hide the API key when typing",
      required: false,
    }),
    maxTokens: Flags.integer({
      aliases: ["max-tokens"],
      default: 2048,
      description: "Max tokens per response (default: 2048)",
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Chat);
    const { noHide, disableNewlines, maxTokens } = flags;
    let { apiKey } = flags;

    if (!apiKey) {
      apiKey = noHide
        ? await input({ message: "Insert your regolo API key" })
        : await password({ message: "Insert your regolo API key" });
    }
    const availableModels = (await RegoloClient.getAvailableModels(apiKey, {
      modelInfo: true,
    })) as AvailableModelInfo[];
    const chatModels = availableModels.filter(
      (m) => m.model_info.mode === "chat",
    );

    if (chatModels.length === 0) {
      this.error("No models available with your API key.");
    }

    const model = await select({
      choices: chatModels.map((m) => ({
        name: m.model_name,
        value: m.model_name,
      })),
      message: "Select the model to use",
    });

    this.log("\n");
    const client = new RegoloClient({ chatModel: model, apiKey });
    this.log(`You can now chat with ${model}, write "/bye" to exit\n`);

    while (true) {
      const userInput = await input({ message: "user" });

      if (userInput === "/bye") break;

      const response = await client.runChat(userInput, { stream: true, maxTokens });

      let wasThinking = false;

      for await (const chunk of response as AsyncGenerator<unknown>) {
        if (chunk == null) continue;

        const [role, content] = chunk as [string, string];
        const isThinking = role === "thinking";
        const text = disableNewlines ? content.replace(/\n/g, " ") : content;

        if (isThinking && !wasThinking) {
          process.stdout.write(DIM_ITALIC + "Thinking..." + RESET + "\n");
          wasThinking = true;
        } else if (!isThinking && wasThinking && text) {
          process.stdout.write(DIM + "\n─────────────────────\n" + RESET + "\n");
          wasThinking = false;
        }

        if (isThinking) {
          process.stdout.write(DIM + text + RESET);
        } else {
          process.stdout.write(text);
        }
      }

      process.stdout.write("\n\n");
    }
  }
}
