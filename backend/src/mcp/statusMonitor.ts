import type { Consumer } from "kafkajs";
import { createKafkaClient, kafkaTopic } from "../kafka/config.js";
import { parseLessonEvent } from "../kafka/events.js";
import type { JobStatusStore } from "./jobStatusStore.js";

export class IngestionStatusMonitor {
  private readonly consumer: Consumer;

  constructor(private readonly store: JobStatusStore) {
    this.consumer = createKafkaClient("consumer").consumer({
      groupId: process.env.KAFKA_MCP_STATUS_GROUP ?? "french-mcp-status-v1",
    });
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: kafkaTopic(), fromBeginning: false });
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const raw = message.value?.toString();
        if (!raw) return;
        try {
          this.store.apply(parseLessonEvent(raw));
        } catch {
          // Other applications may share the Event Hub; ignore unknown messages.
        }
      },
    });
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
  }
}
