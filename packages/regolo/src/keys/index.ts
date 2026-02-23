export class KeysHandler {
  static fixKey(apiKey: string): string {
    return !apiKey.startsWith("Bearer ") ? `Bearer ${apiKey}` : apiKey;
  }
  static checkKey(apiKey: string): string {
    if (apiKey === null) throw new Error("API key is required");
    return this.fixKey(apiKey);
  }
}
