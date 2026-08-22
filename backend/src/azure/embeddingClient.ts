import type { AzureLabConfig } from "./config.js";
import { requestJson } from "./http.js";

interface EmbeddingResponse {
  data: Array<{ embedding: number[]; index: number }>;
  usage?: { prompt_tokens: number; total_tokens: number };
}

export class AzureEmbeddingClient {
  constructor(private readonly config: AzureLabConfig) {}

  async embed(inputs: string[]): Promise<number[][]> {
    if (!inputs.length) return [];
    const response = await requestJson<EmbeddingResponse>(
      `${this.config.openAiEndpoint}/openai/v1/embeddings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.config.openAiApiKey,
        },
        body: JSON.stringify({
          model: this.config.embeddingDeployment,
          input: inputs,
        }),
      },
    );
    return [...response.data]
      .sort((a, b) => a.index - b.index)
      .map(({ embedding }) => embedding);
  }
}
