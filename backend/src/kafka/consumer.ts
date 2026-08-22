import { createKafkaClient, kafkaTopic } from "./config.js";
import { parseLessonEvent } from "./events.js";

const topic = kafkaTopic();
const groupId = process.env.KAFKA_CONSUMER_GROUP ?? "french-ingestion-workers";
const consumer = createKafkaClient("consumer").consumer({ groupId });
let stopping = false;

const shutdown = async (signal: string) => {
  if (stopping) return;
  stopping = true;
  console.log(`\n${signal} received; disconnecting consumer...`);
  await consumer.disconnect();
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

await consumer.connect();
await consumer.subscribe({ topic, fromBeginning: true });
console.log(
  `Consumer group "${groupId}" is waiting on "${topic}". Press Ctrl+C to stop.`,
);

await consumer.run({
  eachMessage: async ({ partition, message }) => {
    const raw = message.value?.toString();
    if (!raw) {
      console.warn("Skipped an event with an empty value.");
      return;
    }
    try {
      const event = parseLessonEvent(raw);
      console.log(
        JSON.stringify(
          {
            received: true,
            topic,
            partition,
            offset: message.offset,
            key: message.key?.toString(),
            event,
          },
          null,
          2,
        ),
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          received: false,
          partition,
          offset: message.offset,
          error: error instanceof Error ? error.message : "Invalid event.",
        }),
      );
    }
  },
});
