import { isEditModeEnabled } from '../../config/appMode';
import { readJson, writeJson } from '../../core/storage';
import { isWallMessageList, type WallMessage } from './messageModel';

const LOCAL_STORAGE_KEY = 'messages';
const TABLE = 'wall_messages';
const MAX_REMOTE_MESSAGES = 300;

export interface MessageRepository {
  readonly isShared: boolean;
  readonly canDelete: boolean;
  list(): Promise<WallMessage[]>;
  add(author: string, text: string): Promise<WallMessage>;
  remove(id: string): Promise<void>;
}

interface RemoteRow {
  readonly id: string;
  readonly author: string;
  readonly text: string;
  readonly created_at: string;
}

function isRemoteRow(value: unknown): value is RemoteRow {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && typeof row.author === 'string'
    && typeof row.text === 'string' && typeof row.created_at === 'string';
}

function toWallMessage(row: RemoteRow): WallMessage {
  return { id: row.id, author: row.author, text: row.text, createdAt: Date.parse(row.created_at), isSeed: false };
}

function createLocalRepository(): MessageRepository {
  const read = (): WallMessage[] => readJson<WallMessage[]>(LOCAL_STORAGE_KEY, [], isWallMessageList);
  const save = (messages: WallMessage[]): void => {
    if (!writeJson(LOCAL_STORAGE_KEY, messages)) throw new Error('No se pudo guardar en este navegador.');
  };
  return {
    isShared: false,
    canDelete: isEditModeEnabled,
    list: async () => read(),
    add: async (author, text) => {
      const message: WallMessage = { id: crypto.randomUUID(), author, text, createdAt: Date.now(), isSeed: false };
      save([...read(), message]);
      return message;
    },
    remove: async (id) => save(read().filter((message) => message.id !== id)),
  };
}

function createSupabaseRepository(baseUrl: string, anonKey: string): MessageRepository {
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/rest/v1/${TABLE}`;
  const isLegacyJwtKey = anonKey.startsWith('eyJ');
  const headers: Record<string, string> = {
    apikey: anonKey,
    'Content-Type': 'application/json',
    ...(isLegacyJwtKey ? { Authorization: `Bearer ${anonKey}` } : {}),
  };

  async function request(url: string, init: RequestInit = {}): Promise<unknown> {
    const response = await fetch(url, { ...init, headers: { ...headers, ...init.headers } });
    if (!response.ok) throw new Error(`Supabase respondió ${response.status}`);
    return response.json();
  }

  return {
    isShared: true,
    canDelete: false,
    list: async () => {
      const rows = await request(`${endpoint}?select=id,author,text,created_at&order=created_at.asc&limit=${MAX_REMOTE_MESSAGES}`);
      return Array.isArray(rows) ? rows.filter(isRemoteRow).map(toWallMessage) : [];
    },
    add: async (author, text) => {
      const rows = await request(endpoint, {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ author, text }),
      });
      const [row] = Array.isArray(rows) ? rows : [];
      if (!isRemoteRow(row)) throw new Error('Respuesta inesperada de Supabase');
      return toWallMessage(row);
    },
    remove: async () => {
      throw new Error('Los mensajes compartidos no se pueden borrar desde la página.');
    },
  };
}

export function createMessageRepository(): MessageRepository {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return url && anonKey ? createSupabaseRepository(url, anonKey) : createLocalRepository();
}
