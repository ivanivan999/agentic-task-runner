import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LessonRepository } from "../src/french/lessonRepository.js";
import { FrenchStudyTool } from "../src/tools/frenchStudyTool.js";

const dataPath = join(process.cwd(), "src", "french", "data", "assimil-lessons.json");
const tool = new FrenchStudyTool(new LessonRepository(dataPath));

describe("FrenchStudyTool", () => {
  it("returns a structured lesson 2 study session", () => {
    const output = tool.execute("study lesson 2").output;
    expect(output).toContain("Lesson 2 - Le café");
    expect(output).toContain("une tartine beurrée");
    expect(output).toContain("Today's writing");
  });

  it("creates lesson 2 flashcards with noun gender", () => {
    const output = tool.execute("flashcards lesson 2").output;
    expect(output).toContain("un café -> a coffee; a café");
    expect(output).toContain("une tartine -> a slice of bread");
  });

  it("checks lesson 2 writing patterns without pretending to be an LLM", () => {
    const output = tool.execute(
      "check lesson 2: Je préfère un café pour moi, s'il vous plaît.",
    ).output;
    expect(output).toContain("You used all four target patterns");
    expect(output).toContain("does not claim to be a complete grammar correction");
  });

  it("has extracted source chunks for all 100 lessons", () => {
    const repository = new LessonRepository(dataPath);
    expect(Array.from({ length: 100 }, (_, index) => repository.getLesson(index + 1).length).every(Boolean)).toBe(true);
  });
});
