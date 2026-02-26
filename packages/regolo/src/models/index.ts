import { config } from "../config.js";

export class ModelsHandler {
  static async getModels(baseUrl: string, apiKey: string, modelInfo = false): Promise<string[] | object[]> {
    const headers = { Authorization: apiKey };

    if (modelInfo) {
      const response = await fetch(`${baseUrl}/model/info`, { headers });
      if (response.status === 401) throw new Error("Authentication failed. Couldn't fetch models");
      if (!response.ok) throw new Error("Failed to fetch models");
      return (await response.json()).data as object[];
    } else {
      const response = await fetch(`${baseUrl}/models`, { headers });
      if (response.status === 401) throw new Error("Authentication failed. Couldn't fetch models");
      if (!response.ok) throw new Error("Failed to fetch models");
      const data = (await response.json()).data as { id: string }[];
      return data.map((model) => model.id);
    }
  }

  static async checkModel(model: string, baseUrl: string, apiKey: string): Promise<string> {
    if (!config.enableModelChecks) return model;
    if (!model) throw new Error("Model is required");

    const available = await ModelsHandler.getModels(baseUrl, apiKey) as string[];
    if (!available.includes(model)) throw new Error("Model not found");

    return model;
  }
}
