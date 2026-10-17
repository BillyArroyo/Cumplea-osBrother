import type { Gallery } from '../../config/types';
import { assetUrl, el } from '../../core/dom';
import type { Lightbox } from '../lightbox/lightbox';
import { Carousel, type Slide } from './carousel';

export function createGallerySection(gallery: Gallery, index: number, lightbox: Lightbox): HTMLElement | null {
  if (gallery.photos.length === 0) return null;

  const slides: Slide[] = gallery.photos.map((photo, photoIndex) => ({
    id: `${gallery.id}-${photoIndex}`,
    src: assetUrl(photo.src),
    caption: photo.caption,
  }));

  const carousel = new Carousel(gallery.title, {
    onOpen: (slideIndex) => lightbox.open(slides, slideIndex),
  });
  carousel.setSlides(slides);

  const issue = String(index + 1).padStart(2, '0');
  const headingId = `gallery-${gallery.id}`;
  return el('section', {
    className: `gallery gallery--${index % 3}`,
    attrs: { 'aria-labelledby': headingId },
  }, [
    el('header', { className: 'gallery__header' }, [
      el('span', { className: 'gallery__issue', text: `#${issue}` }),
      el('h2', { className: 'gallery__title', text: gallery.title, attrs: { id: headingId } }),
      el('p', { className: 'gallery__subtitle', text: gallery.subtitle }),
    ]),
    carousel.element,
  ]);
}
