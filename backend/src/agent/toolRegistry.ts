import type { Tool } from "../tools/tool.interface.js";
import { CalculatorTool } from "../tools/calculatorTool.js";
import { TextProcessorTool } from "../tools/textProcessorTool.js";
import { WeatherMockTool } from "../tools/weatherMockTool.js";

export class ToolRegistry {
  constructor(private readonly tools: Tool[] = [new TextProcessorTool(), new CalculatorTool(), new WeatherMockTool()]) {}
  getAll(): Tool[] { return this.tools; }
  register(tool: Tool): void { this.tools.unshift(tool); }
}
