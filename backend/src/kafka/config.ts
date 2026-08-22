import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Kafka, logLevel } from "kafkajs";

const defaultEnvPath = fileURLToPath(
  new URL("../../../.env.kafka.local", import.meta.url),
);
dotenv.config({
  path: process.env.KAFKA_ENV_FILE ?? defaultEnvPath,
  quiet: true,
});

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable ${name}.`);
  return value;
};

export const kafkaTopic = () => required("KAFKA_TOPIC");

export const createKafkaClient = (role: "producer" | "consumer"): Kafka =>
  new Kafka({
    clientId: `french-study-${role}`,
    brokers: [required("KAFKA_BROKER")],
    ssl: true,
    sasl: {
      mechanism: "plain",
      username: "$ConnectionString",
      password: required(
        role === "producer"
          ? "KAFKA_PRODUCER_CONNECTION_STRING"
          : "KAFKA_CONSUMER_CONNECTION_STRING",
      ),
    },
    connectionTimeout: 10_000,
    requestTimeout: 30_000,
    logLevel: logLevel.INFO,
  });
