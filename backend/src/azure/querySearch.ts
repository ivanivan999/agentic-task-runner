import { loadAzureLabConfig } from "./config.js";
import { AzureEmbeddingClient } from "./embeddingClient.js";
import { AzureLessonSearchClient } from "./searchClient.js";

const args = process.argv.slice(2);
const lessonFlag = args.indexOf("--lesson");
const lesson =
  lessonFlag === -1 ? undefined : Number(args.splice(lessonFlag, 2)[1]);
const query = args.join(" ").trim();
if (!query) throw new Error("Provide a search query.");
if (
  lesson !== undefined &&
  (!Number.isInteger(lesson) || lesson < 1 || lesson > 100)
)
  throw new Error("Lesson filter must be a whole number from 1 to 100.");

const config = loadAzureLabConfig();
const embeddings = new AzureEmbeddingClient(config);
const search = new AzureLessonSearchClient(config);
const [vector] = await embeddings.embed([query]);
const results = await search.hybridSearch(query, vector, lesson);
console.log(
  JSON.stringify(
    results.map(({ text, ...result }) => ({
      ...result,
      excerpt: text.slice(0, 500),
    })),
    null,
    2,
  ),
);
