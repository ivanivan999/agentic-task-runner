import { randomUUID } from "node:crypto";

export interface LessonIngestionRequested {
  eventType: "lesson.ingestion.requested";
  eventVersion: 1;
  jobId: string;
  lesson: number;
  source: "assimil_french_2020.pdf";
  requestedAt: string;
}

export interface LessonIngestionCompleted {
  eventType: "lesson.ingestion.completed";
  eventVersion: 1;
  jobId: string;
  lesson: number;
  chunksIndexed: number;
  completedAt: string;
}

export interface LessonIngestionFailed {
  eventType: "lesson.ingestion.failed";
  eventVersion: 1;
  jobId: string;
  lesson: number;
  attempt: number;
  error: string;
  failedAt: string;
}

export type LessonEvent =
  | LessonIngestionRequested
  | LessonIngestionCompleted
  | LessonIngestionFailed;

export const parseLessonNumber = (raw: string | undefined): number => {
  const lesson = Number(raw);
  if (!Number.isInteger(lesson) || lesson < 1 || lesson > 100)
    throw new Error("Lesson must be a whole number from 1 to 100.");
  return lesson;
};

export const createIngestionRequested = (
  lesson: number,
): LessonIngestionRequested => ({
  eventType: "lesson.ingestion.requested",
  eventVersion: 1,
  jobId: `job_${randomUUID()}`,
  lesson,
  source: "assimil_french_2020.pdf",
  requestedAt: new Date().toISOString(),
});

export const createIngestionCompleted = (
  request: LessonIngestionRequested,
  chunksIndexed: number,
): LessonIngestionCompleted => ({
  eventType: "lesson.ingestion.completed",
  eventVersion: 1,
  jobId: request.jobId,
  lesson: request.lesson,
  chunksIndexed,
  completedAt: new Date().toISOString(),
});

export const createIngestionFailed = (
  request: LessonIngestionRequested,
  error: unknown,
  attempt = 1,
): LessonIngestionFailed => ({
  eventType: "lesson.ingestion.failed",
  eventVersion: 1,
  jobId: request.jobId,
  lesson: request.lesson,
  attempt,
  error: error instanceof Error ? error.message : "Unexpected ingestion error.",
  failedAt: new Date().toISOString(),
});

export const parseLessonEvent = (raw: string): LessonEvent => {
  const value = JSON.parse(raw) as Partial<LessonEvent>;
  if (
    value.eventVersion !== 1 ||
    typeof value.eventType !== "string" ||
    ![
      "lesson.ingestion.requested",
      "lesson.ingestion.completed",
      "lesson.ingestion.failed",
    ].includes(value.eventType) ||
    typeof value.jobId !== "string" ||
    !Number.isInteger(value.lesson) ||
    Number(value.lesson) < 1 ||
    Number(value.lesson) > 100
  )
    throw new Error("Message is not a supported lesson event.");
  return value as LessonEvent;
};
