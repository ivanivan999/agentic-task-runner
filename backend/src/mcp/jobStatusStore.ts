import type { LessonEvent } from "../kafka/events.js";

export type IngestionJobStatus =
  | { status: "requested"; jobId: string; lesson: number; updatedAt: string }
  | { status: "completed"; jobId: string; lesson: number; chunksIndexed: number; updatedAt: string }
  | { status: "failed"; jobId: string; lesson: number; error: string; updatedAt: string };

export class JobStatusStore {
  private readonly jobs = new Map<string, IngestionJobStatus>();

  apply(event: LessonEvent): IngestionJobStatus {
    const common = { jobId: event.jobId, lesson: event.lesson };
    const status: IngestionJobStatus = event.eventType === "lesson.ingestion.requested"
      ? { ...common, status: "requested", updatedAt: event.requestedAt }
      : event.eventType === "lesson.ingestion.completed"
        ? { ...common, status: "completed", chunksIndexed: event.chunksIndexed, updatedAt: event.completedAt }
        : { ...common, status: "failed", error: event.error, updatedAt: event.failedAt };
    this.jobs.set(event.jobId, status);
    return status;
  }

  get(jobId: string): IngestionJobStatus | undefined {
    return this.jobs.get(jobId);
  }
}
