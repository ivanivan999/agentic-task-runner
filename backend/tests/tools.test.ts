import { describe, expect, it } from "vitest";
import { TextProcessorTool } from "../src/tools/textProcessorTool.js";
import { CalculatorTool } from "../src/tools/calculatorTool.js";
import { WeatherMockTool } from "../src/tools/weatherMockTool.js";

describe("tools", () => {
  it("processes text", () => expect(new TextProcessorTool().execute("convert to uppercase: hello").output).toBe("HELLO"));
  it("calculates without eval", () => expect(new CalculatorTool().execute("what is 12 * 7").output).toBe("84"));
  it("returns deterministic mocked weather", () => expect(new WeatherMockTool().execute("weather in Ottawa").output).toBe(new WeatherMockTool().execute("weather in Ottawa").output));
});
