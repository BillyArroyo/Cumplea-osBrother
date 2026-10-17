import { el } from '../../core/dom';

const LINKS: ReadonlyArray<readonly [href: string, label: string]> = [
  ['#inicio', 'Inicio'],
  ['#carta', 'Carta'],
  ['#voz', 'Voz'],
  ['#galerias', 'Galerías'],
  ['#simbionte', 'Simbionte'],
  ['#mensajes', 'Mensajes'],
  ['#pastel', 'Pastel'],
];

export function createNav(): HTMLElement {
  const links = LINKS.map(([href, label]) => el('a', { className: 'nav__link', attrs: { href }, text: label }));
  const nav = el('nav', { className: 'nav', attrs: { 'aria-label': 'Secciones' } }, links);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => link.toggleAttribute('aria-current', link.hash === `#${entry.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  requestAnimationFrame(() => {
    links.forEach((link) => {
      const target = document.querySelector(link.hash);
      if (target) observer.observe(target);
      else link.remove();
    });
  });

  return nav;
}
