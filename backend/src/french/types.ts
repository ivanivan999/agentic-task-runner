export type LessonContentType =
  | "lesson"
  | "notes"
  | "pronunciation"
  | "exercise"
  | "answers";

export interface LessonChunk {
  id: string;
  lesson: number;
  title: string;
  pdfPage: number;
  contentType: LessonContentType;
  text: string;
}

export interface LessonDataset {
  version: number;
  chunks: LessonChunk[];
}
