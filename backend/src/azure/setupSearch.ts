import { loadAzureLabConfig } from "./config.js";
import { AzureLessonSearchClient } from "./searchClient.js";

const config = loadAzureLabConfig();
await new AzureLessonSearchClient(config).createOrUpdateIndex();
console.log(`Search index "${config.searchIndex}" is ready.`);
