import type { BirthdayConfig } from '../../config/types';
import { assetUrl, el } from '../../core/dom';
import { on } from '../../core/events';
import type { ThemeController } from './theme';

const BLOB_COUNT = 7;

const COPY = {
  hero: { cta: 'Dejar que el simbionte tome el control', line: 'Algo oscuro se mueve bajo la ciudad…' },
  venom: { cta: 'Arrancarse el traje negro', line: 'Nosotros somos… ¡los del cumpleaños!' },
} as const;

export function createVenomSection(
  config: BirthdayConfig,
  theme: ThemeController,
  gallery: HTMLElement | null,
): HTMLElement {
  const blobs = el('div', { className: 'venom__goo', attrs: { 'aria-hidden': 'true' } },
    Array.from({ length: BLOB_COUNT }, (_, i) => el('span', { className: 'venom__blob', attrs: { style: `--i:${i}` } })),
  );
  const line = el('p', { className: 'venom__line' });
  const cta = el('button', { className: 'btn btn--venom btn--xl', attrs: { type: 'button' } });

  function render(): void {
    const copy = COPY[theme.getMode()];
    line.textContent = copy.line;
    cta.textContent = copy.cta;
  }

  cta.addEventListener('click', (event) => theme.toggle({ x: event.clientX, y: event.clientY }));
  on('theme:change', render);
  render();

  const background = config.backgrounds.venom ? `--venom-image:url("${assetUrl(config.backgrounds.venom)}")` : '';

  return el('section', { className: 'venom', attrs: { id: 'simbionte', 'aria-labelledby': 'venom-title', style: background } }, [
    blobs,
    el('div', { className: 'venom__inner' }, [
      el('span', { className: 'section-head__kicker', text: 'Universo alterno' }),
      el('h2', { className: 'venom__title', attrs: { id: 'venom-title' } }, [
        el('span', { text: 'El traje' }),
        el('span', { className: 'venom__title-accent', text: 'negro' }),
      ]),
      line,
      cta,
    ]),
    gallery,
  ]);
}
