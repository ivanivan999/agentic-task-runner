import { describe, expect, it } from "vitest";
import { createIngestionCompleted, createIngestionFailed, createIngestionRequested } from "../src/kafka/events.js";
import { JobStatusStore } from "../src/mcp/jobStatusStore.js";

describe("JobStatusStore", () => {
  it("moves a requested job to completed", () => {
    const store = new JobStatusStore();
    const requested = createIngestionRequested(3);
    store.apply(requested);
    store.apply(createIngestionCompleted(requested, 7));
    expect(store.get(requested.jobId)).toMatchObject({ status: "completed", lesson: 3, chunksIndexed: 7 });
  });

  it("records a safe failed status", () => {
    const store = new JobStatusStore();
    const requested = createIngestionRequested(4);
    store.apply(createIngestionFailed(requested, new Error("index unavailable")));
    expect(store.get(requested.jobId)).toMatchObject({ status: "failed", error: "index unavailable" });
  });
});
