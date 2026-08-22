import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { LessonDataset } from "../french/types.js";
import { loadAzureLabConfig } from "./config.js";
import { AzureEmbeddingClient } from "./embeddingClient.js";
import { LessonIngestionService } from "./lessonIngestionService.js";
import { AzureLessonSearchClient } from "./searchClient.js";

const lessonArg = process.argv[2];
const lesson = lessonArg === undefined ? undefined : Number(lessonArg);
if (
  lesson !== undefined &&
  (!Number.isInteger(lesson) || lesson < 1 || lesson > 100)
)
  throw new Error("Optional lesson must be a whole number from 1 to 100.");

const dataPath = fileURLToPath(
  new URL("../french/data/assimil-lessons.json", import.meta.url),
);
const dataset = JSON.parse(await readFile(dataPath, "utf8")) as LessonDataset;
const selected = LessonIngestionService.selectLesson(dataset, lesson);
if (!selected.length) throw new Error(`No chunks found for lesson ${lesson}.`);

const config = loadAzureLabConfig();
const service = new LessonIngestionService(
  new AzureEmbeddingClient(config),
  new AzureLessonSearchClient(config),
);
const count = await service.ingest(selected);
console.log(`Finished indexing ${count} chunks${lesson ? ` for lesson ${lesson}` : ""}.`);
