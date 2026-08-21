import { readFileSync } from "node:fs";
import type { LessonChunk, LessonDataset } from "./types.js";

const tokens = (value: string) =>
  new Set(
    value
      .toLocaleLowerCase("fr")
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .match(/[\p{L}\p{N}']{2,}/gu) ?? [],
  );

export class LessonRepository {
  private readonly chunks: LessonChunk[];

  constructor(path: string) {
    const dataset = JSON.parse(readFileSync(path, "utf8")) as LessonDataset;
    this.chunks = dataset.chunks;
  }

  getLesson(number: number): LessonChunk[] {
    return this.chunks.filter((chunk) => chunk.lesson === number);
  }

  search(query: string, lesson?: number, limit = 5): LessonChunk[] {
    const wanted = tokens(query);
    return this.chunks
      .filter((chunk) => lesson === undefined || chunk.lesson === lesson)
      .map((chunk) => {
        const available = tokens(`${chunk.title} ${chunk.text}`);
        const score = [...wanted].filter((token) => available.has(token)).length;
        return { chunk, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.chunk.pdfPage - b.chunk.pdfPage)
      .slice(0, limit)
      .map(({ chunk }) => chunk);
  }
}
