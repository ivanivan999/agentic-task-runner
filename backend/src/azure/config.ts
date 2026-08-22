import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const defaultEnvPath = fileURLToPath(
  new URL("../../../.env.azure.local", import.meta.url),
);
dotenv.config({
  path: process.env.AZURE_ENV_FILE ?? defaultEnvPath,
  quiet: true,
});

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable ${name}.`);
  return value;
};

const withoutTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export interface AzureLabConfig {
  searchEndpoint: string;
  searchAdminKey: string;
  searchIndex: string;
  openAiEndpoint: string;
  openAiApiKey: string;
  embeddingDeployment: string;
}

export const loadAzureLabConfig = (): AzureLabConfig => ({
  searchEndpoint: withoutTrailingSlash(required("AZURE_SEARCH_ENDPOINT")),
  searchAdminKey: required("AZURE_SEARCH_ADMIN_KEY"),
  searchIndex: required("AZURE_SEARCH_INDEX"),
  openAiEndpoint: withoutTrailingSlash(required("AZURE_OPENAI_ENDPOINT")),
  openAiApiKey: required("AZURE_OPENAI_API_KEY"),
  embeddingDeployment: required("AZURE_OPENAI_EMBEDDING_DEPLOYMENT"),
});
