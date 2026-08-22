import { describe, expect, it } from "vitest";
import {
  createIngestionRequested,
  parseLessonEvent,
  parseLessonNumber,
} from "../src/kafka/events.js";

describe("Kafka lesson events", () => {
  it("creates a versioned ingestion request with a stable event shape", () => {
    const event = createIngestionRequested(2);
    expect(event).toMatchObject({
      eventType: "lesson.ingestion.requested",
      eventVersion: 1,
      lesson: 2,
      source: "assimil_french_2020.pdf",
    });
    expect(event.jobId).toMatch(/^job_/);
    expect(new Date(event.requestedAt).toISOString()).toBe(event.requestedAt);
  });

  it("accepts lessons 1 through 100", () => {
    expect(parseLessonNumber("1")).toBe(1);
    expect(parseLessonNumber("100")).toBe(100);
  });

  it("rejects invalid lesson arguments", () => {
    for (const value of [undefined, "0", "101", "2.5", "bonjour"])
      expect(() => parseLessonNumber(value)).toThrow(
        "Lesson must be a whole number from 1 to 100.",
      );
  });

  it("parses valid events and rejects unsupported messages", () => {
    const event = createIngestionRequested(2);
    expect(parseLessonEvent(JSON.stringify(event))).toEqual(event);
    expect(() => parseLessonEvent('{"hello":"world"}')).toThrow(
      "Message is not a supported lesson event.",
    );
  });
});
