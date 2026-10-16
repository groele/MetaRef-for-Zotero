/** Detect delimiters outside quoted fields in the first CSV record. */
export function detectCSVDelimiter(text: string): string {
  const counts = new Map([[",", 0], [";", 0], ["\t", 0], ["|", 0]]);
  let quoted = false;
  const input = text.trimStart();
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (char === "\"") {
      if (quoted && input[index + 1] === "\"")
        index++;
      else
        quoted = !quoted;
    }
    else if (!quoted) {
      if (char === "\r" || char === "\n")
        break;
      if (counts.has(char))
        counts.set(char, counts.get(char)! + 1);
    }
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0][0];
}
