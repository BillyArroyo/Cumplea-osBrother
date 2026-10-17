import { el } from '../../core/dom';
import { formatCounter, wrapIndex } from '../carousel/carouselMath';
import type { Slide } from '../carousel/carousel';

export interface Lightbox {
  open(slides: readonly Slide[], index: number): void;
}

export function mountLightbox(): Lightbox {
  let slides: readonly Slide[] = [];
  let active = 0;

  const image = el('img', { className: 'lightbox__image', attrs: { alt: '' } });
  const caption = el('p', { className: 'lightbox__caption' });
  const counter = el('span', { className: 'lightbox__counter' });
  const close = el('button', { className: 'lightbox__close', attrs: { type: 'button', 'aria-label': 'Cerrar' }, text: '×' });
  const prev = el('button', { className: 'lightbox__nav lightbox__nav--prev', attrs: { type: 'button', 'aria-label': 'Anterior' }, text: '‹' });
  const next = el('button', { className: 'lightbox__nav lightbox__nav--next', attrs: { type: 'button', 'aria-label': 'Siguiente' }, text: '›' });

  const dialog = el('dialog', { className: 'lightbox', attrs: { 'aria-label': 'Foto ampliada' } }, [
    el('figure', { className: 'lightbox__figure' }, [image, el('figcaption', {}, [counter, caption])]),
    prev,
    next,
    close,
  ]);
  document.body.append(dialog);

  function show(index: number): void {
    active = wrapIndex(index, slides.length);
    const slide = slides[active];
    if (!slide) return;
    image.src = slide.src;
    image.alt = slide.caption ?? `Foto ${active + 1}`;
    caption.textContent = slide.caption ?? '';
    counter.textContent = formatCounter(active, slides.length);
    const hasMany = slides.length > 1;
    prev.hidden = !hasMany;
    next.hidden = !hasMany;
  }

  prev.addEventListener('click', () => show(active - 1));
  next.addEventListener('click', () => show(active + 1));
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(active - 1);
    if (event.key === 'ArrowRight') show(active + 1);
  });

  return {
    open(nextSlides, index) {
      slides = nextSlides;
      show(index);
      dialog.showModal();
    },
  };
}
