import Hypher from "hypher";
import german from "hyphenation.de";

const hypher = new (Hypher as any)(german);

export function hyphenateText(text: string): string {
  try {
    return text.replace(/\S{6,}/g, (word) => {
      const parts: string[] = hypher.hyphenate(word);
      return parts.join("\u00AD");
    });
  } catch {
    return text;
  }
}
