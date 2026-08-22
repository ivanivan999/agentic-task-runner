import { describe, expect, it } from "vitest";
import {
  EMBEDDING_DIMENSIONS,
  buildIndexDefinition,
  lessonFilter,
} from "../src/azure/searchSchema.js";

describe("Azure AI Search schema", () => {
  it("defines a filterable lesson field and 1536-dimensional vector", () => {
    const schema = buildIndexDefinition("assimil-lessons");
    expect(schema.name).toBe("assimil-lessons");
    expect(schema.fields.find(({ name }) => name === "lesson")).toMatchObject({
      type: "Edm.Int32",
      filterable: true,
    });
    expect(
      schema.fields.find(({ name }) => name === "contentVector"),
    ).toMatchObject({
      type: "Collection(Edm.Single)",
      dimensions: EMBEDDING_DIMENSIONS,
      vectorSearchProfile: "lesson-vector-profile",
    });
  });

  it("creates an exact numeric lesson filter only when requested", () => {
    expect(lessonFilter()).toBeUndefined();
    expect(lessonFilter(2)).toBe("lesson eq 2");
  });
});
