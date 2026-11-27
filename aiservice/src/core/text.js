import { createHash } from 'node:crypto';

export const MAX_TEXT_CHARS = 100_000;
export const STOP_WORDS = new Set(`a an the and or but if then than so of to in on for from by with as is are was were be been being it this that these those their they them you your we our can could should would will may might must do does did have has had not into about over under between through use used using`.split(' '));

export function ensureText(value, label = 'Text', max = MAX_TEXT_CHARS) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${label} is required and cannot be blank.`);
  if (value.length > max) throw new RangeError(`${label} exceeds the ${max} character limit.`);
  return value.replace(/\r\n?/g, '\n').trim();
}

export function normalize(value) {
  return String(value ?? '').toLocaleLowerCase('en').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9+#.]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function contentWords(value) {
  return normalize(value).split(' ').filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

export function stableId(prefix, value) {
  return `${prefix}_${createHash('sha256').update(value).digest('hex').slice(0, 16)}`;
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function sentences(text) {
  return text.match(/[^.!?\n]+(?:[.!?]+|$)/g)?.map(part => part.trim()).filter(Boolean) ?? [];
}
