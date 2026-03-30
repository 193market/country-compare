export function detectLanguage(text: string): "ko" | "en" {
  const koreanRegex = /[\uAC00-\uD7A3\u3131-\u314E\u314F-\u3163]/;
  return koreanRegex.test(text) ? "ko" : "en";
}
