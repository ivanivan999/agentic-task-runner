import type { LessonChunk, LessonDataset } from "../french/types.js";
import { AzureEmbeddingClient } from "./embeddingClient.js";
import {
  AzureLessonSearchClient,
  type SearchDocument,
} from "./searchClient.js";

const batches = <T>(values: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size)
    result.push(values.slice(index, index + size));
  return result;
};

export class LessonIngestionService {
  constructor(
    private readonly embeddings: AzureEmbeddingClient,
    private readonly search: AzureLessonSearchClient,
  ) {}

  async ingest(chunks: LessonChunk[]): Promise<number> {
    let indexed = 0;
    for (const chunkBatch of batches(chunks, 16)) {
      const vectors = await this.embeddings.embed(
        chunkBatch.map(({ text }) => text),
      );
      const documents: SearchDocument[] = chunkBatch.map((chunk, index) => ({
        ...chunk,
        contentVector: vectors[index],
      }));
      await this.search.upload(documents);
      indexed += documents.length;
      console.log(`Indexed ${indexed}/${chunks.length} lesson chunks.`);
    }
    return indexed;
  }

  static selectLesson(dataset: LessonDataset, lesson?: number): LessonChunk[] {
    return lesson === undefined
      ? dataset.chunks
      : dataset.chunks.filter((chunk) => chunk.lesson === lesson);
  }
}
