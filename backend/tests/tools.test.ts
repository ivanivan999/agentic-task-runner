import { describe, expect, it } from "vitest";
import { TextProcessorTool } from "../src/tools/textProcessorTool.js";
import { CalculatorTool } from "../src/tools/calculatorTool.js";
import { WeatherMockTool } from "../src/tools/weatherMockTool.js";

describe("tools", () => {
  it("processes text", () => expect(new TextProcessorTool().execute("convert to uppercase: hello").output).toBe("HELLO"));
  it("calculates without eval", () => expect(new CalculatorTool().execute("what is 12 * 7").output).toBe("84"));
  it("returns deterministic, human-readable mocked weather", () => {
    const output = new WeatherMockTool().execute("weather in Ottawa").output;
    expect(output).toBe(new WeatherMockTool().execute("weather in Ottawa").output);
    expect(output).toMatch(/^Ottawa's current weather is .+ and \d+°C\.$/);
  });
});
