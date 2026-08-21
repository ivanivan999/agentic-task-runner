import type { Tool, ToolResult } from "./tool.interface.js";
import { LessonRepository } from "../french/lessonRepository.js";
import { lessonTwoGuide } from "../french/lessonTwoGuide.js";

const requestedLesson = (input: string) => {
  const match = input.match(/(?:lesson|le[cç]on)\s*(\d{1,3})/i);
  return match ? Number(match[1]) : undefined;
};

const pages = (values: { pdfPage: number }[]) =>
  [...new Set(values.map(({ pdfPage }) => pdfPage))].join(", ");

export class FrenchStudyTool implements Tool {
  readonly name = "FrenchStudyTool";
  readonly description =
    "Studies an Assimil French lesson, explains lesson grammar, creates flashcards, or searches the course.";

  constructor(private readonly repository: LessonRepository) {}

  canHandle(input: string): number {
    if (/(?:lesson|le[cç]on)\s*\d+/i.test(input)) return 0.99;
    if (/\b(french|fran[cç]ais|grammar|flashcards?|vocabulary)\b/i.test(input))
      return 0.78;
    return 0;
  }

  execute(input: string): ToolResult {
    const lesson = requestedLesson(input);
    if (lesson !== undefined && (lesson < 1 || lesson > 100))
      return { output: "Choose a lesson from 1 to 100." };

    if (lesson === 2) {
      if (/\b(check|correct|feedback)\b/i.test(input))
        return { output: this.lessonTwoFeedback(input) };
      return { output: this.lessonTwo(input) };
    }

    if (lesson !== undefined) {
      const chunks = this.repository.getLesson(lesson);
      if (!chunks.length)
        return { output: `Lesson ${lesson} has not been extracted yet.` };
      const relevant = /grammar|note|explain/i.test(input)
        ? chunks.filter(({ contentType }) =>
            ["notes", "pronunciation", "lesson"].includes(contentType),
          )
        : chunks;
      const excerpt = relevant
        .slice(0, 3)
        .map(({ text }) => text.slice(0, 1800))
        .join("\n\n---\n\n");
      return {
        output: `Lesson ${lesson}: ${chunks[0].title}\nSource PDF pages: ${pages(chunks)}\n\n${excerpt}\n\nOCR text can contain errors; check the listed PDF pages when wording looks suspicious.`,
      };
    }

    const results = this.repository.search(input);
    if (!results.length)
      return {
        output:
          "Try a lesson request such as “study lesson 2”, “grammar for lesson 2”, or “flashcards for lesson 2”.",
      };
    return {
      output: results
        .map(
          ({ lesson, title, pdfPage, text }) =>
            `Lesson ${lesson}: ${title} (PDF page ${pdfPage})\n${text.slice(0, 900)}`,
        )
        .join("\n\n---\n\n"),
    };
  }

  private lessonTwo(input: string): string {
    const source = "Source PDF pages: 20-23";
    if (/flashcards?|vocabulary|words/i.test(input))
      return `Lesson 2 flashcards - ${lessonTwoGuide.title}\n${source}\n\n${lessonTwoGuide.flashcards
        .map(([front, back], index) => `${index + 1}. ${front} -> ${back}`)
        .join("\n")}`;
    if (/grammar|explain|notes?/i.test(input))
      return `Lesson 2 grammar - ${lessonTwoGuide.title}\n${source}\n\n${lessonTwoGuide.grammar
        .map((note) => `- ${note}`)
        .join("\n")}`;
    if (/write|sentence|practice|exercise/i.test(input))
      return `Lesson 2 writing practice - ${lessonTwoGuide.title}\n${source}\n\n${lessonTwoGuide.writing}\n\nWhen ready, send: check lesson 2: [your sentences]`;
    return `Lesson 2 - ${lessonTwoGuide.title}\n${source}\n\nDialogue\n${lessonTwoGuide.dialogue.join("\n")}\n\nKey grammar\n${lessonTwoGuide.grammar.map((note) => `- ${note}`).join("\n")}\n\nToday's writing\n${lessonTwoGuide.writing}\n\nNext commands: “grammar lesson 2”, “flashcards lesson 2”, or “writing practice lesson 2”.`;
  }

  private lessonTwoFeedback(input: string): string {
    const answer = input.split(":").slice(1).join(":").trim();
    if (!answer)
      return "Add your writing after a colon, for example: check lesson 2: Je préfère un café, s'il vous plaît.";
    const checks = [
      ["a preference", /\bje préfère\b/i],
      ["who an item is for", /\bpour (?:moi|elle|lui|vous|nous|eux|elles)\b/i],
      ["a polite expression", /s['’]il vous plaît/i],
      ["a noun with its article", /\b(?:un|une|le|la|des|les)\s+[\p{L}']/iu],
    ] as const;
    const present = checks.filter(([, pattern]) => pattern.test(answer));
    const missing = checks.filter(([, pattern]) => !pattern.test(answer));
    return `Lesson 2 writing check\n\nYour text\n${answer}\n\nPattern check\n${present.map(([label]) => `✓ Included ${label}.`).join("\n") || "No target pattern detected yet."}${missing.length ? `\n${missing.map(([label]) => `- Try adding ${label}.`).join("\n")}` : "\n✓ You used all four target patterns."}\n\nThis offline check verifies Lesson 2 patterns; it does not claim to be a complete grammar correction.`;
  }
}
