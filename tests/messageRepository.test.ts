import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMessageRepository } from '../src/features/messages/messageRepository';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe('local repository', () => {
  it('stores and lists messages in this browser', async () => {
    const repository = createMessageRepository();
    expect(repository.isShared).toBe(false);

    const saved = await repository.add('May', 'Feliz cumple');
    expect(await repository.list()).toEqual([saved]);
    expect(repository.canDelete).toBe(false);
  });
});

describe('supabase repository', () => {
  function useSupabase(response: unknown, ok = true): ReturnType<typeof vi.fn> {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://demo.supabase.co/');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
    const fetchMock = vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => response });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('lists shared messages and maps timestamps', async () => {
    const fetchMock = useSupabase([{ id: '1', author: 'Ned', text: 'Hola', created_at: '2026-10-17T10:00:00Z' }]);
    const repository = createMessageRepository();

    const messages = await repository.list();

    expect(repository.isShared).toBe(true);
    expect(repository.canDelete).toBe(false);
    expect(messages[0]).toMatchObject({ author: 'Ned', createdAt: Date.parse('2026-10-17T10:00:00Z') });
    expect(fetchMock.mock.calls[0]?.[0]).toContain('https://demo.supabase.co/rest/v1/wall_messages?');
  });

  it('drops malformed rows', async () => {
    useSupabase([{ id: 1, author: 'x' }]);
    expect(await createMessageRepository().list()).toEqual([]);
  });

  it('throws when the server fails', async () => {
    useSupabase({}, false);
    await expect(createMessageRepository().add('Ned', 'Hola')).rejects.toThrow('500');
  });
});
