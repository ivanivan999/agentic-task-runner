import type { Tool, ToolResult } from "./tool.interface.js";

export class TextProcessorTool implements Tool {
  readonly name = "TextProcessorTool";
  readonly description = "Converts text to uppercase or lowercase, reverses text, and counts words.";

  canHandle(input: string): number {
    return /\b(uppercase|lowercase|capitalize|word count|count words|reverse|trim)\b/i.test(input) ? 0.92 : 0;
  }

  execute(input: string): ToolResult {
    const text = this.extractText(input);
    if (!text) throw new Error("Please provide text to process.");
    if (/\buppercase\b/i.test(input)) return { output: text.toUpperCase() };
    if (/\blowercase\b/i.test(input)) return { output: text.toLowerCase() };
    if (/\b(capitalize)\b/i.test(input)) return { output: text.replace(/\b\w/g, char => char.toUpperCase()) };
    if (/\b(reverse)\b/i.test(input)) return { output: [...text].reverse().join("") };
    if (/\b(word count|count words)\b/i.test(input)) {
      const count = text.trim() ? text.trim().split(/\s+/).length : 0;
      return { output: String(count) };
    }
    return { output: text.trim() };
  }

  private extractText(input: string): string {
    const colonText = input.match(/:\s*(.+)$/)?.[1];
    if (colonText) return colonText.trim();
    const quoted = input.match(/["'](.+)["']/)?.[1];
    if (quoted) return quoted.trim();
    return input
      .replace(/\b(convert|covert|change|make|to|the|text|uppercase|lowercase|capitalize|word count|count words|reverse|trim)\b/gi, "")
      .replace(/\s+/g, " ").trim();
  }
}
