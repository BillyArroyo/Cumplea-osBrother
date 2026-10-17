import { el, svg } from '../../core/dom';
import { webSvgMarkup } from '../effects/webGeometry';

const EXIT_ANIMATION_MS = 900;
const SENSE_LINES = 12;

export function mountIntro(name: string, onEnter: () => void): void {
  const button = el('button', { className: 'btn btn--comic btn--xl intro__cta', attrs: { type: 'button' }, text: 'Activar sentido arácnido' });
  const lines = el('div', { className: 'intro__sense', attrs: { 'aria-hidden': 'true' } },
    Array.from({ length: SENSE_LINES }, (_, i) => el('i', { attrs: { style: `--i:${i}` } })),
  );

  const overlay = el('div', { className: 'intro', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'intro-title' } }, [
    svg(webSvgMarkup(520, 'tl', 'intro__web intro__web--tl')),
    svg(webSvgMarkup(520, 'br', 'intro__web intro__web--br')),
    el('div', { className: 'intro__content' }, [
      lines,
      el('p', { className: 'intro__kicker', text: 'Transmisión entrante' }),
      el('h1', { className: 'intro__title', attrs: { id: 'intro-title' } }, [
        el('span', { text: 'Un héroe' }),
        el('span', { className: 'intro__title-accent', text: 'cumple años' }),
      ]),
      el('p', { className: 'intro__subtitle', text: `Misión: celebrar a ${name}. Sube el volumen.` }),
      button,
    ]),
  ]);

  document.body.append(overlay);
  document.body.classList.add('is-locked');
  button.focus();

  button.addEventListener('click', () => {
    onEnter();
    overlay.classList.add('is-leaving');
    document.body.classList.remove('is-locked');
    document.body.classList.add('is-entered');
    window.setTimeout(() => overlay.remove(), EXIT_ANIMATION_MS);
  }, { once: true });
}
