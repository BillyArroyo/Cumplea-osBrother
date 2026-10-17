import { describe, expect, it } from 'vitest';
import { isWallMessageList, MAX_TEXT_LENGTH, validateMessage } from '../src/features/messages/messageModel';

describe('validateMessage', () => {
  it('trims and collapses whitespace in the author', () => {
    expect(validateMessage('  Mary   Jane ', ' ¡Felicidades! ')).toEqual({ ok: true, author: 'Mary Jane', text: '¡Felicidades!' });
  });

  it('rejects empty authors and texts', () => {
    expect(validateMessage('   ', 'hola').ok).toBe(false);
    expect(validateMessage('Ned', '   ').ok).toBe(false);
  });

  it('rejects texts over the limit', () => {
    expect(validateMessage('Ned', 'a'.repeat(MAX_TEXT_LENGTH + 1)).ok).toBe(false);
  });
});

describe('isWallMessageList', () => {
  it('accepts well-formed user messages', () => {
    expect(isWallMessageList([{ id: '1', author: 'May', text: 'Hola', createdAt: 1, isSeed: false }])).toBe(true);
  });

  it('rejects tampered storage payloads', () => {
    expect(isWallMessageList([{ id: 1, author: 'May' }])).toBe(false);
    expect(isWallMessageList({ id: '1' })).toBe(false);
  });
});
