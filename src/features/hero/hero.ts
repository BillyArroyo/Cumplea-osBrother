import type { BirthdayConfig } from '../../config/types';
import { assetUrl, el, prefersReducedMotion, svg } from '../../core/dom';
import { skylineSvgMarkup } from '../effects/skyline';
import { webSvgMarkup } from '../effects/webGeometry';

const SKYLINE_SEED = 616;

export function createHero(config: BirthdayConfig): HTMLElement {
  const portraitImage = el('img', { className: 'portrait__image', attrs: { alt: `Foto de ${config.name}` } });
  const portrait = el('div', { className: 'portrait' }, [
    el('div', { className: 'portrait__ring', attrs: { 'aria-hidden': 'true' } }),
    el('div', { className: 'portrait__frame' }, [
      portraitImage,
      el('span', { className: 'portrait__placeholder', text: 'Tu foto aquí' }),
    ]),
    svg(webSvgMarkup(160, 'tr', 'portrait__web')),
  ]);

  function showPortrait(src: string | undefined): void {
    portrait.classList.toggle('has-photo', Boolean(src));
    if (src) portraitImage.src = src;
  }

  const formattedDate = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${config.date}T12:00:00`));

  const titleLetters = Array.from(config.name).map((char, i) =>
    el('span', { className: 'hero__letter', text: char, attrs: { style: `--i:${i}` } }),
  );

  const skyline = svg(skylineSvgMarkup(1600, 320, SKYLINE_SEED, 'skyline'));
  const skylineBack = svg(skylineSvgMarkup(1600, 260, SKYLINE_SEED * 7, 'skyline skyline--back'));

  const hero = el('header', {
    className: 'hero',
    attrs: { id: 'inicio', style: config.backgrounds.hero ? `--hero-image:url("${assetUrl(config.backgrounds.hero)}")` : '' },
  }, [
    el('div', { className: 'hero__sky', attrs: { 'aria-hidden': 'true' } }),
    svg(webSvgMarkup(420, 'tl', 'hero__corner-web hero__corner-web--tl')),
    svg(webSvgMarkup(320, 'br', 'hero__corner-web hero__corner-web--br')),
    el('div', { className: 'hero__content' }, [
      el('div', { className: 'hero__copy' }, [
        el('p', { className: 'hero__kicker' }, [
          el('span', { className: 'hero__kicker-dot', attrs: { 'aria-hidden': 'true' } }),
          'Alerta de cumpleaños en la ciudad',
        ]),
        el('h1', { className: 'hero__title' }, [
          el('span', { className: 'hero__title-top', text: '¡Feliz cumple,' }),
          el('span', { className: 'hero__name', attrs: { 'aria-label': config.name } }, titleLetters),
          el('span', { className: 'hero__title-bang', text: '!', attrs: { 'aria-hidden': 'true' } }),
        ]),
        el('p', { className: 'hero__tagline', text: config.heroTagline }),
        el('dl', { className: 'hero__stats' }, [
          el('div', { className: 'stat' }, [el('dt', { text: 'Nivel' }), el('dd', { text: String(config.age) })]),
          el('div', { className: 'stat' }, [el('dt', { text: 'Fecha' }), el('dd', { text: formattedDate })]),
          el('div', { className: 'stat' }, [el('dt', { text: 'Sentido arácnido' }), el('dd', { text: '100%' })]),
        ]),
      ]),
      portrait,
    ]),
    el('div', { className: 'hero__city', attrs: { 'aria-hidden': 'true' } }, [skylineBack, skyline]),
    el('a', { className: 'hero__scroll', attrs: { href: '#carta' }, text: 'Desliza para balancearte ↓' }),
  ]);

  showPortrait(config.portrait ? assetUrl(config.portrait) : undefined);
  bindParallax(hero);
  return hero;
}

function bindParallax(hero: HTMLElement): void {
  if (prefersReducedMotion()) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const progress = Math.min(1, window.scrollY / Math.max(hero.offsetHeight, 1));
      hero.style.setProperty('--scroll', progress.toFixed(3));
      ticking = false;
    });
  }, { passive: true });
}
