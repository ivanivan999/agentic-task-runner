import type { Tool, ToolResult } from "./tool.interface.js";

export class WeatherMockTool implements Tool {
  readonly name = "WeatherMockTool";
  readonly description = "Returns a deterministic mock weather report for a city.";
  canHandle(input: string): number { return /\bweather\b/i.test(input) ? 0.9 : 0; }

  execute(input: string): ToolResult {
    const city = input.match(/\bin\s+([a-z][a-z .'-]*)/i)?.[1]?.trim().replace(/[?.!]+$/, "") || "your location";
    const seed = [...city.toLowerCase()].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const conditions = ["Sunny", "Partly cloudy", "Cloudy", "Light rain"];
    const tempC = 8 + (seed % 20);
    return { output: JSON.stringify({ city, tempC, condition: conditions[seed % conditions.length] }) };
  }
}
