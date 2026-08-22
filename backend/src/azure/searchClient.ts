import type { LessonChunk } from "../french/types.js";
import type { AzureLabConfig } from "./config.js";
import { requestJson } from "./http.js";
import { buildIndexDefinition, lessonFilter } from "./searchSchema.js";

const API_VERSION = "2025-09-01";

export interface SearchDocument extends LessonChunk {
  contentVector: number[];
}

export interface LessonSearchResult {
  score: number;
  id: string;
  lesson: number;
  title: string;
  pdfPage: number;
  contentType: string;
  text: string;
}

interface SearchResponse {
  value: Array<
    Omit<LessonSearchResult, "score"> & { "@search.score"?: number }
  >;
}

export class AzureLessonSearchClient {
  constructor(private readonly config: AzureLabConfig) {}

  private url(path: string): string {
    return `${this.config.searchEndpoint}${path}?api-version=${API_VERSION}`;
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "api-key": this.config.searchAdminKey,
    };
  }

  async createOrUpdateIndex(): Promise<void> {
    await requestJson(
      this.url(`/indexes/${encodeURIComponent(this.config.searchIndex)}`),
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify(buildIndexDefinition(this.config.searchIndex)),
      },
    );
  }

  async upload(documents: SearchDocument[]): Promise<void> {
    if (!documents.length) return;
    await requestJson(
      this.url(
        `/indexes/${encodeURIComponent(this.config.searchIndex)}/docs/index`,
      ),
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          value: documents.map((document) => ({
            "@search.action": "upload",
            ...document,
          })),
        }),
      },
    );
  }

  async hybridSearch(
    query: string,
    vector: number[],
    lesson?: number,
    top = 5,
  ): Promise<LessonSearchResult[]> {
    const response = await requestJson<SearchResponse>(
      this.url(
        `/indexes/${encodeURIComponent(this.config.searchIndex)}/docs/search`,
      ),
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          search: query,
          filter: lessonFilter(lesson),
          top,
          select: "id,lesson,title,pdfPage,contentType,text",
          vectorQueries: [
            {
              kind: "vector",
              vector,
              fields: "contentVector",
              k: top,
            },
          ],
        }),
      },
    );
    return response.value.map((item) => ({
      score: item["@search.score"] ?? 0,
      id: item.id,
      lesson: item.lesson,
      title: item.title,
      pdfPage: item.pdfPage,
      contentType: item.contentType,
      text: item.text,
    }));
  }
}
