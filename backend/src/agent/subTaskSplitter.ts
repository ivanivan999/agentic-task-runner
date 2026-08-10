/** Splits ordered chains, and only splits `and` when both resulting halves match a tool. */
export function splitIntoSubTasks(input: string, canHandle: (input: string) => boolean): string[] {
  const ordered = input.split(/\s*(?:,\s*)?\b(?:and\s+then|then)\b\s*/i).map(part => part.trim()).filter(Boolean);
  return ordered.flatMap(part => {
    const conjunction = part.match(/^(.+?)\s+and\s+(.+)$/i);
    if (conjunction && canHandle(conjunction[1]) && canHandle(conjunction[2])) return [conjunction[1].trim(), conjunction[2].trim()];
    return [part];
  });
}

export function resolvePreviousResult(input: string, previousResult?: string): string {
  if (!previousResult) return input;
  if (/\{previous(?:Result)?\}/i.test(input)) return input.replace(/\{previous(?:Result)?\}/gi, previousResult);
  if (/\b(it|that|this|the result)\b/i.test(input) && /\b(uppercase|lowercase|capitalize|reverse|word count|count words|trim)\b/i.test(input)) return `${input}: ${previousResult}`;
  return input;
}
