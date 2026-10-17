import { isEditModeEnabled } from '../../config/appMode';
import type { BirthdayConfig } from '../../config/types';
import { el } from '../../core/dom';
import { readJson, removeKey, writeJson } from '../../core/storage';

const STORAGE_KEY = 'letter';
const MAX_PARAGRAPH_LENGTH = 1200;

interface LetterDraft {
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly signature: string;
}

function isLetterDraft(value: unknown): value is LetterDraft {
  if (typeof value !== 'object' || value === null) return false;
  const draft = value as Record<string, unknown>;
  return (
    typeof draft.title === 'string' &&
    typeof draft.signature === 'string' &&
    Array.isArray(draft.paragraphs) &&
    draft.paragraphs.every((p) => typeof p === 'string')
  );
}

export function createLetter(config: BirthdayConfig['letter']): HTMLElement {
  const original: LetterDraft = config;
  let draft = isEditModeEnabled ? readJson<LetterDraft>(STORAGE_KEY, original, isLetterDraft) : original;
  let isEditing = false;

  const title = el('h2', { className: 'letter__title', attrs: { id: 'letter-title' } });
  const body = el('div', { className: 'letter__body' });
  const signature = el('p', { className: 'letter__signature' });
  const editButton = el('button', { className: 'btn btn--ghost', attrs: { type: 'button' } });
  const resetButton = el('button', { className: 'btn btn--link', attrs: { type: 'button' }, text: 'Restaurar original' });
  const editables = (): HTMLElement[] => [title, signature, ...Array.from(body.children).filter((n): n is HTMLElement => n instanceof HTMLElement)];

  function render(): void {
    title.textContent = draft.title;
    body.replaceChildren(...draft.paragraphs.map((text) => el('p', { text })));
    signature.textContent = draft.signature;
    applyEditingState();
  }

  function applyEditingState(): void {
    editables().forEach((node) => {
      node.contentEditable = String(isEditing);
      node.spellcheck = isEditing;
    });
    editButton.textContent = isEditing ? 'Guardar carta' : 'Escribir mi propia carta';
    editButton.setAttribute('aria-pressed', String(isEditing));
    article.classList.toggle('is-editing', isEditing);
  }

  function collect(): LetterDraft {
    const clean = (node: Element): string => (node.textContent ?? '').trim().slice(0, MAX_PARAGRAPH_LENGTH);
    const paragraphs = Array.from(body.children).map(clean).filter((text) => text.length > 0);
    return {
      title: clean(title) || original.title,
      paragraphs: paragraphs.length > 0 ? paragraphs : original.paragraphs,
      signature: clean(signature) || original.signature,
    };
  }

  editButton.addEventListener('click', () => {
    if (isEditing) {
      draft = collect();
      writeJson(STORAGE_KEY, draft);
      isEditing = false;
      render();
      return;
    }
    isEditing = true;
    applyEditingState();
    title.focus();
  });

  resetButton.addEventListener('click', () => {
    removeKey(STORAGE_KEY);
    draft = original;
    isEditing = false;
    render();
  });

  body.addEventListener('paste', (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') ?? '';
    document.execCommand('insertText', false, text);
  });

  const article = el('article', { className: 'letter', attrs: { 'aria-labelledby': 'letter-title' } }, [
    el('span', { className: 'letter__stamp', text: 'Diario de la ciudad · Edición especial', attrs: { 'aria-hidden': 'true' } }),
    title,
    body,
    signature,
    isEditModeEnabled ? el('div', { className: 'letter__actions' }, [editButton, resetButton]) : null,
  ]);

  render();
  return el('section', { className: 'letter-section', attrs: { id: 'carta' } }, [article]);
}
