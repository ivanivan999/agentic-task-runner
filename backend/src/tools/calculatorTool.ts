import type { Tool, ToolResult } from "./tool.interface.js";

export class CalculatorTool implements Tool {
  readonly name = "CalculatorTool";
  readonly description = "Solves a simple two-number calculation using +, -, *, or /.";
  private expression = /(-?\d+(?:\.\d+)?)\s*(\+|-|\*|\/|x|times|plus|minus)\s*(-?\d+(?:\.\d+)?)/i;
  private addExpression = /\badd\s+(-?\d+(?:\.\d+)?)\s+(?:and|to)\s+(-?\d+(?:\.\d+)?)/i;

  canHandle(input: string): number {
    return this.expression.test(input) || this.addExpression.test(input) ? 0.95 : 0;
  }

  execute(input: string): ToolResult {
    const wordMatch = input.match(this.addExpression);
    if (wordMatch) return { output: String(Number(wordMatch[1]) + Number(wordMatch[2])) };
    const match = input.match(this.expression);
    if (!match) throw new Error("I can calculate one expression with two numbers.");
    const [, leftText, operatorText, rightText] = match;
    const left = Number(leftText), right = Number(rightText);
    const operator = operatorText.toLowerCase();
    let value: number;
    if (operator === "+" || operator === "plus") value = left + right;
    else if (operator === "-" || operator === "minus") value = left - right;
    else if (operator === "*" || operator === "x" || operator === "times") value = left * right;
    else {
      if (right === 0) throw new Error("Division by zero is not allowed.");
      value = left / right;
    }
    return { output: String(value) };
  }
}
