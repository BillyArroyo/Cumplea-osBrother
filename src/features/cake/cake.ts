import { el } from '../../core/dom';
import { emit } from '../../core/events';
import { burstConfetti } from '../effects/confetti';

const MAX_VISIBLE_CANDLES = 12;

export function createCakeSection(age: number, name: string): HTMLElement {
  const candleCount = Math.max(1, Math.min(age, MAX_VISIBLE_CANDLES));
  let isBlown = false;

  const candles = el('div', { className: 'cake__candles' },
    Array.from({ length: candleCount }, (_, i) =>
      el('span', { className: 'cake__candle', attrs: { style: `--i:${i}` } }, [el('span', { className: 'cake__flame' })]),
    ),
  );
  const cake = el('div', { className: 'cake', attrs: { 'aria-hidden': 'true' } }, [
    candles,
    el('div', { className: 'cake__tier cake__tier--top' }),
    el('div', { className: 'cake__tier cake__tier--bottom' }, [el('span', { className: 'cake__age', text: String(age) })]),
    el('div', { className: 'cake__plate' }),
  ]);
  const wish = el('p', { className: 'cake__wish', attrs: { role: 'status' } });
  const button = el('button', { className: 'btn btn--comic btn--xl', attrs: { type: 'button' }, text: 'Pide un deseo y sopla' });

  button.addEventListener('click', () => {
    isBlown = !isBlown;
    cake.classList.toggle('is-blown', isBlown);
    button.textContent = isBlown ? 'Encender otra vez' : 'Pide un deseo y sopla';
    wish.textContent = isBlown ? `¡Deseo concedido, ${name}! La ciudad celebra contigo.` : '';
    if (!isBlown) return;
    const rect = cake.getBoundingClientRect();
    burstConfetti({ x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.2 });
    emit('celebrate', undefined);
  });

  return el('section', { className: 'cake-section', attrs: { id: 'pastel', 'aria-labelledby': 'cake-title' } }, [
    el('header', { className: 'section-head section-head--center' }, [
      el('span', { className: 'section-head__kicker', text: 'Misión final' }),
      el('h2', { className: 'section-head__title', text: `${age} velas, un solo héroe`, attrs: { id: 'cake-title' } }),
    ]),
    cake,
    button,
    wish,
  ]);
}
