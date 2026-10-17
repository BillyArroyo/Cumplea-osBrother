import type { SeedMessage } from '../../config/types';
import { el } from '../../core/dom';
import { MAX_AUTHOR_LENGTH, MAX_TEXT_LENGTH, validateMessage, type WallMessage } from './messageModel';
import { createMessageRepository } from './messageRepository';

const BUBBLE_TILTS = ['-2deg', '1.5deg', '-1deg', '2.5deg', '0deg'];
const dateFormatter = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function createMessageWall(seeds: readonly SeedMessage[]): HTMLElement {
  const seedMessages: WallMessage[] = seeds.map((seed, index) => ({
    id: `seed-${index}`, author: seed.author, text: seed.text, createdAt: 0, isSeed: true,
  }));
  const repository = createMessageRepository();
  let userMessages: WallMessage[] = [];
  let isSubmitting = false;

  const list = el('ol', { className: 'wall__list', attrs: { 'aria-live': 'polite' } });
  const authorInput = el('input', {
    className: 'field__input',
    attrs: { id: 'wall-author', name: 'author', maxlength: String(MAX_AUTHOR_LENGTH), autocomplete: 'name', required: '' },
  });
  const textInput = el('textarea', {
    className: 'field__input field__input--area',
    attrs: { id: 'wall-text', name: 'text', maxlength: String(MAX_TEXT_LENGTH), rows: '4', required: '' },
  });
  const charCount = el('span', { className: 'field__count', text: `0 / ${MAX_TEXT_LENGTH}` });
  const feedback = el('p', { className: 'wall__feedback', attrs: { role: 'alert' } });
  const submitButton = el('button', { className: 'btn btn--comic', attrs: { type: 'submit' }, text: '¡Lanzar mensaje!' });

  const form = el('form', { className: 'wall__form', attrs: { novalidate: '' } }, [
    el('div', { className: 'field' }, [
      el('label', { className: 'field__label', text: 'Tu nombre de héroe', attrs: { for: 'wall-author' } }),
      authorInput,
    ]),
    el('div', { className: 'field' }, [
      el('label', { className: 'field__label', text: 'Tu mensaje', attrs: { for: 'wall-text' } }),
      textInput,
      charCount,
    ]),
    feedback,
    submitButton,
  ]);

  async function loadMessages(): Promise<void> {
    try {
      userMessages = await repository.list();
      render();
    } catch (error) {
      console.warn('[wall] could not load messages', error);
      feedback.textContent = 'No se pudieron cargar los mensajes. Intenta recargar la página.';
    }
  }

  async function removeMessage(id: string): Promise<void> {
    try {
      await repository.remove(id);
      userMessages = userMessages.filter((message) => message.id !== id);
      render();
    } catch (error) {
      console.warn('[wall] delete failed', error);
      feedback.textContent = 'No se pudo borrar el mensaje.';
    }
  }

  function bubble(message: WallMessage, index: number): HTMLElement {
    const meta = message.isSeed ? 'Mensaje destacado' : dateFormatter.format(message.createdAt);
    const item = el('li', {
      className: `wall__bubble ${index % 2 === 0 ? 'wall__bubble--left' : 'wall__bubble--right'}`,
      attrs: { style: `--tilt:${BUBBLE_TILTS[index % BUBBLE_TILTS.length]}` },
    }, [
      el('p', { className: 'wall__text', text: message.text }),
      el('footer', { className: 'wall__meta' }, [
        el('strong', { text: message.author }),
        el('span', { text: meta }),
      ]),
    ]);
    if (!message.isSeed && repository.canDelete) {
      const remove = el('button', {
        className: 'wall__remove',
        attrs: { type: 'button', 'aria-label': `Borrar mensaje de ${message.author}` },
        text: '×',
      });
      remove.addEventListener('click', () => void removeMessage(message.id));
      item.append(remove);
    }
    return item;
  }

  function render(): void {
    const all = [...seedMessages, ...userMessages];
    list.replaceChildren(...all.map(bubble));
  }

  textInput.addEventListener('input', () => {
    charCount.textContent = `${textInput.value.length} / ${MAX_TEXT_LENGTH}`;
  });

  async function submit(author: string, text: string): Promise<void> {
    isSubmitting = true;
    submitButton.disabled = true;
    feedback.textContent = '';
    try {
      const saved = await repository.add(author, text);
      userMessages = [...userMessages, saved];
      render();
      form.reset();
      charCount.textContent = `0 / ${MAX_TEXT_LENGTH}`;
      list.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
      console.warn('[wall] submit failed', error);
      feedback.textContent = 'No se pudo enviar tu mensaje. Revisa tu conexión e inténtalo otra vez.';
    } finally {
      isSubmitting = false;
      submitButton.disabled = false;
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    const result = validateMessage(authorInput.value, textInput.value);
    if (!result.ok) {
      feedback.textContent = result.error;
      return;
    }
    void submit(result.author, result.text);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && repository.isShared) void loadMessages();
  });

  render();
  void loadMessages();

  const lead = repository.isShared
    ? 'Deja tu saludo para el cumpleañero. Todos los que visiten la página podrán leerlo.'
    : 'Deja tu saludo. Se guarda en este navegador para que el cumpleañero lo lea.';

  return el('section', { className: 'wall', attrs: { id: 'mensajes', 'aria-labelledby': 'wall-title' } }, [
    el('header', { className: 'section-head' }, [
      el('span', { className: 'section-head__kicker', text: 'Bocadillos de la ciudad' }),
      el('h2', { className: 'section-head__title', text: 'Muro de mensajes', attrs: { id: 'wall-title' } }),
      el('p', { className: 'section-head__lead', text: lead }),
    ]),
    el('div', { className: 'wall__layout' }, [form, list]),
  ]);
}
