import { Partitioners, type Producer } from "kafkajs";
import { createKafkaClient, kafkaTopic } from "./config.js";
import type { LessonEvent } from "./events.js";

export class LessonEventPublisher {
  private readonly producer: Producer;
  private connected = false;

  constructor(private readonly topic = kafkaTopic()) {
    this.producer = createKafkaClient("producer").producer({
      createPartitioner: Partitioners.DefaultPartitioner,
    });
  }

  async publish(event: LessonEvent): Promise<void> {
    if (!this.connected) {
      await this.producer.connect();
      this.connected = true;
    }
    await this.producer.send({
      topic: this.topic,
      messages: [{
        key: event.jobId,
        value: JSON.stringify(event),
        headers: { eventType: event.eventType, eventVersion: "1" },
      }],
    });
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    await this.producer.disconnect();
    this.connected = false;
  }
}
