import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Partitioners } from "kafkajs";
import type { LessonDataset } from "../french/types.js";
import { loadAzureLabConfig } from "../azure/config.js";
import { AzureEmbeddingClient } from "../azure/embeddingClient.js";
import { LessonIngestionService } from "../azure/lessonIngestionService.js";
import { AzureLessonSearchClient } from "../azure/searchClient.js";
import { createKafkaClient, kafkaTopic } from "./config.js";
import {
  createIngestionCompleted,
  createIngestionFailed,
  parseLessonEvent,
} from "./events.js";

const dataPath = fileURLToPath(
  new URL("../french/data/assimil-lessons.json", import.meta.url),
);
const dataset = JSON.parse(await readFile(dataPath, "utf8")) as LessonDataset;
const config = loadAzureLabConfig();
const ingestion = new LessonIngestionService(
  new AzureEmbeddingClient(config),
  new AzureLessonSearchClient(config),
);
const topic = kafkaTopic();
const consumer = createKafkaClient("consumer").consumer({
  groupId: process.env.KAFKA_WORKER_GROUP ?? "french-lesson-indexer-v1",
});
const producer = createKafkaClient("producer").producer({
  createPartitioner: Partitioners.DefaultPartitioner,
});
let stopping = false;

const publish = async (event: ReturnType<typeof createIngestionCompleted> | ReturnType<typeof createIngestionFailed>) => {
  await producer.send({
    topic,
    messages: [
      {
        key: event.jobId,
        value: JSON.stringify(event),
        headers: { eventType: event.eventType, eventVersion: "1" },
      },
    ],
  });
};

const shutdown = async (signal: string) => {
  if (stopping) return;
  stopping = true;
  console.log(`\n${signal} received; stopping ingestion worker...`);
  await consumer.disconnect();
  await producer.disconnect();
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

await producer.connect();
await consumer.connect();
await consumer.subscribe({ topic, fromBeginning: false });
console.log(`Ingestion worker is waiting on "${topic}".`);

await consumer.run({
  eachMessage: async ({ partition, message }) => {
    const raw = message.value?.toString();
    if (!raw) return;
    let event;
    try {
      event = parseLessonEvent(raw);
    } catch (error) {
      console.error("Skipped unsupported event", { partition, offset: message.offset });
      return;
    }
    if (event.eventType !== "lesson.ingestion.requested") return;

    console.log(`Processing ${event.jobId}: lesson ${event.lesson}.`);
    try {
      const chunks = LessonIngestionService.selectLesson(dataset, event.lesson);
      if (!chunks.length) throw new Error(`No chunks found for lesson ${event.lesson}.`);
      const chunksIndexed = await ingestion.ingest(chunks);
      const completed = createIngestionCompleted(event, chunksIndexed);
      await publish(completed);
      console.log(`Completed ${event.jobId}: indexed ${chunksIndexed} chunks.`);
    } catch (error) {
      const failed = createIngestionFailed(event, error);
      await publish(failed);
      console.error(`Failed ${event.jobId}: ${failed.error}`);
    }
  },
});
