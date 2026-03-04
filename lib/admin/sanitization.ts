import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const purifier = DOMPurify(window);

export function sanitizeInput(value: string) {
  return purifier.sanitize(value, {
    ALLOWED_ATTR: [],
    ALLOWED_TAGS: [],
  });
}

export function sanitizeOptional(value?: string | null) {
  if (!value) return "";
  return sanitizeInput(value);
}
