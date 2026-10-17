export const MAX_AUTHOR_LENGTH = 40;
export const MAX_TEXT_LENGTH = 280;

export interface WallMessage {
  readonly id: string;
  readonly author: string;
  readonly text: string;
  readonly createdAt: number;
  readonly isSeed: boolean;
}

export type ValidationResult =
  | { readonly ok: true; readonly author: string; readonly text: string }
  | { readonly ok: false; readonly error: string };

export function validateMessage(rawAuthor: string, rawText: string): ValidationResult {
  const author = rawAuthor.trim().replace(/\s+/g, ' ');
  const text = rawText.trim();
  if (author.length === 0) return { ok: false, error: 'Firma tu mensaje, héroe anónimo.' };
  if (author.length > MAX_AUTHOR_LENGTH) return { ok: false, error: `El nombre admite hasta ${MAX_AUTHOR_LENGTH} caracteres.` };
  if (text.length === 0) return { ok: false, error: 'Escribe algo antes de lanzarlo.' };
  if (text.length > MAX_TEXT_LENGTH) return { ok: false, error: `El mensaje admite hasta ${MAX_TEXT_LENGTH} caracteres.` };
  return { ok: true, author, text };
}

export function isWallMessageList(value: unknown): value is WallMessage[] {
  return Array.isArray(value) && value.every(isWallMessage);
}

function isWallMessage(value: unknown): value is WallMessage {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.author === 'string' &&
    typeof candidate.text === 'string' &&
    typeof candidate.createdAt === 'number' &&
    candidate.isSeed === false
  );
}
