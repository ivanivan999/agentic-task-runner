import { Partitioners } from "kafkajs";
import { createKafkaClient, kafkaTopic } from "./config.js";
import {
  createIngestionRequested,
  parseLessonNumber,
} from "./events.js";

const lesson = parseLessonNumber(process.argv[2]);
const event = createIngestionRequested(lesson);
const topic = kafkaTopic();
const producer = createKafkaClient("producer").producer({
  createPartitioner: Partitioners.DefaultPartitioner,
});

try {
  await producer.connect();
  const result = await producer.send({
    topic,
    messages: [
      {
        key: event.jobId,
        value: JSON.stringify(event),
        headers: {
          eventType: event.eventType,
          eventVersion: String(event.eventVersion),
        },
      },
    ],
  });
  const [{ partition, baseOffset }] = result;
  console.log(
    JSON.stringify(
      {
        sent: true,
        topic,
        partition,
        offset: baseOffset,
        event,
      },
      null,
      2,
    ),
  );
} finally {
  await producer.disconnect();
}
