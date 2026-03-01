import { Flags } from "@oclif/core";
import { KeysHandler, RegoloClient } from "@regolo/sdk";
import * as fs from "node:fs";
import * as path from "node:path";

import { BaseCommand } from "../base-command.js";

export default class CreateImage extends BaseCommand {
  static override description = "Creates images using image generation models";
  static override examples = [
    "<%= config.bin %> <%= command.id %> --apiKey YOUR_KEY --model MODEL_NAME",
    "<%= config.bin %> <%= command.id %> --apiKey YOUR_KEY --model MODEL_NAME --prompt 'A sunset over the mountains'",
  ];
  static override flags = {
    apiKey: Flags.string({
      aliases: ["api-key"],
      description: "The API key used to generate images.",
      required: true,
    }),
    model: Flags.string({
      description: "The image generation model to use.",
      required: true,
    }),
    prompt: Flags.string({
      default: "A generic image",
      description: 'The text prompt for image generation. (Defaults to "A generic image")',
      required: false,
    }),
    n: Flags.integer({
      default: 1,
      description: "The number of images to generate. (Defaults to 1)",
      required: false,
    }),
    quality: Flags.string({
      default: "standard",
      description: "The quality of the generated images. (Defaults to 'standard')",
      required: false,
    }),
    size: Flags.string({
      default: "1024x1024",
      description: "The size of the generated images. (Defaults to '1024x1024')",
      required: false,
    }),
    style: Flags.string({
      default: "realistic",
      description: "The style of the generated images. (Defaults to 'realistic')",
      required: false,
    }),
    savePath: Flags.string({
      aliases: ["save-path"],
      description: "The path in which to save the images. (Defaults to ./images)",
      required: false,
    }),
    outputFileFormat: Flags.string({
      aliases: ["output-file-format"],
      default: "png",
      description: "The output file format for the generated images. (Defaults to 'png')",
      options: ["png", "jpg", "jpeg", "webp", "bmp"],
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(CreateImage);
    const { apiKey, model, prompt, n, quality, size, style, outputFileFormat } = flags;
    let { savePath } = flags;

    KeysHandler.checkKey(apiKey);

    if (!savePath) {
      savePath = path.join(process.cwd(), "images");
    }

    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true });
    }

    const images = (await RegoloClient.createImage(
      prompt,
      model,
      apiKey,
      n,
      quality,
      size,
      style,
    )) as Buffer[];

    let ext = outputFileFormat.toLowerCase();
    if (ext === "jpg") ext = "jpeg";

    for (const imageBuffer of images) {
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:T]/g, "")
        .replace(/\..+/, "");
      let filepath = path.join(savePath, `${timestamp}.${ext}`);

      let i = 1;
      while (fs.existsSync(filepath)) {
        filepath = path.join(savePath, `${timestamp}_${i}.${ext}`);
        i++;
      }

      fs.writeFileSync(filepath, imageBuffer);
      this.log(`Saved: ${filepath}`);
    }
  }
}
