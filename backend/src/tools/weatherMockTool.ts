import type { Tool, ToolResult } from "./tool.interface.js";

export class WeatherMockTool implements Tool {
  readonly name = "WeatherMockTool";
  readonly description = "Returns a deterministic mock weather report for a city.";
  private readonly failedCities = new Set<string>();
  canHandle(input: string): number { return /\bweather\b/i.test(input) ? 0.9 : 0; }

  execute(input: string): ToolResult {
    const city = input.match(/\bin\s+([a-z][a-z .'-]*)/i)?.[1]?.trim().replace(/[?.!]+$/, "") || "your location";
    const flakyMode = /\bflaky\b/i.test(input);
    const failureKey = city.toLowerCase();
    if (flakyMode && !this.failedCities.has(failureKey)) {
      this.failedCities.add(failureKey);
      throw new Error("Mock weather service temporarily unavailable (flaky demo mode).");
    }
    const seed = [...city.toLowerCase()].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const conditions = ["Sunny", "Partly cloudy", "Cloudy", "Light rain"];
    const tempC = 8 + (seed % 20);
    const condition = conditions[seed % conditions.length].toLowerCase();
    return { output: `${city}'s current weather is ${condition} and ${tempC}°C.` };
  }
}
