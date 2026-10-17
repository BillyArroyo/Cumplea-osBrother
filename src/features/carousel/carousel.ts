import { el, prefersReducedMotion } from '../../core/dom';
import { circularOffset, formatCounter, swipeDirection, wrapIndex } from './carouselMath';

const AUTOPLAY_MS = 4800;
const SWIPE_THRESHOLD_PX = 45;
const VISIBLE_RADIUS = 2;

export interface Slide {
  readonly id: string;
  readonly src: string;
  readonly caption?: string;
}

interface CarouselHandlers {
  readonly onOpen: (index: number) => void;
}

export class Carousel {
  readonly element: HTMLElement;
  private readonly stage: HTMLElement;
  private readonly dots: HTMLElement;
  private readonly counter: HTMLElement;
  private readonly progress: HTMLElement;
  private slides: readonly Slide[] = [];
  private slideNodes: HTMLElement[] = [];
  private active = 0;
  private autoplayId: number | null = null;
  private isPaused = false;
  private isInView = false;
  private dragStartX: number | null = null;
  private shouldSuppressClick = false;

  constructor(private readonly label: string, private readonly handlers: CarouselHandlers) {
    this.stage = el('div', { className: 'carousel__stage' });
    this.dots = el('div', { className: 'carousel__dots', attrs: { role: 'tablist', 'aria-label': `Fotos de ${label}` } });
    this.counter = el('span', { className: 'carousel__counter', attrs: { 'aria-live': 'polite' } });
    this.progress = el('span', { className: 'carousel__progress', attrs: { 'aria-hidden': 'true' } });

    const prev = this.navButton('prev', 'Foto anterior', () => this.go(this.active - 1));
    const next = this.navButton('next', 'Foto siguiente', () => this.go(this.active + 1));

    this.element = el('div', {
      className: 'carousel',
      attrs: { role: 'region', 'aria-roledescription': 'carrusel', 'aria-label': label, tabindex: '0' },
    }, [
      this.stage,
      el('div', { className: 'carousel__controls' }, [prev, this.counter, this.dots, next]),
      this.progress,
    ]);

    this.bindInteractions();
  }

  setSlides(slides: readonly Slide[]): void {
    this.slides = slides;
    this.active = wrapIndex(this.active, slides.length);
    this.renderSlides();
    this.renderDots();
    this.update();
    this.restartAutoplay();
  }

  go(index: number): void {
    if (this.slides.length === 0) return;
    this.active = wrapIndex(index, this.slides.length);
    this.update();
    this.restartAutoplay();
  }

  private navButton(direction: 'prev' | 'next', label: string, onClick: () => void): HTMLButtonElement {
    const button = el('button', {
      className: `carousel__nav carousel__nav--${direction}`,
      attrs: { type: 'button', 'aria-label': label },
    }, [el('span', { attrs: { 'aria-hidden': 'true' }, text: direction === 'prev' ? '‹' : '›' })]);
    button.addEventListener('click', onClick);
    return button;
  }

  private renderSlides(): void {
    this.slideNodes = this.slides.map((slide, index) => this.slideNode(slide, index));
    this.stage.replaceChildren(...this.slideNodes);
  }

  private slideNode(slide: Slide, index: number): HTMLElement {
    const image = el('img', {
      attrs: { src: slide.src, alt: slide.caption ?? `Foto ${index + 1} de ${this.label}`, loading: 'lazy', decoding: 'async', draggable: 'false' },
    });
    const figure = el('figure', { className: 'carousel__slide' }, [
      el('div', { className: 'carousel__frame' }, [image]),
      slide.caption ? el('figcaption', { className: 'carousel__caption', text: slide.caption }) : null,
    ]);
    figure.addEventListener('click', () => {
      if (index === this.active) this.handlers.onOpen(index);
      else this.go(index);
    });
    return figure;
  }

  private renderDots(): void {
    const dots = this.slides.map((_, index) => {
      const dot = el('button', {
        className: 'carousel__dot',
        attrs: { type: 'button', role: 'tab', 'aria-label': `Ir a la foto ${index + 1}` },
      });
      dot.addEventListener('click', () => this.go(index));
      return dot;
    });
    this.dots.replaceChildren(...dots);
  }

  private update(): void {
    const length = this.slides.length;
    this.slideNodes.forEach((node, index) => {
      const offset = circularOffset(index, this.active, length);
      const distance = Math.abs(offset);
      node.style.setProperty('--offset', String(offset));
      node.style.setProperty('--distance', String(distance));
      node.style.zIndex = String(10 - distance);
      node.classList.toggle('is-active', offset === 0);
      node.classList.toggle('is-hidden', distance > VISIBLE_RADIUS);
      node.setAttribute('aria-hidden', String(offset !== 0));
    });
    Array.from(this.dots.children).forEach((dot, index) => {
      dot.setAttribute('aria-selected', String(index === this.active));
    });
    this.counter.textContent = formatCounter(this.active, length);
  }

  private restartAutoplay(): void {
    if (this.autoplayId !== null) window.clearInterval(this.autoplayId);
    this.autoplayId = null;
    this.progress.classList.remove('is-running');
    const canPlay = this.slides.length > 1 && !this.isPaused && this.isInView && !prefersReducedMotion();
    if (!canPlay) return;
    void this.progress.offsetWidth;
    this.progress.style.setProperty('--autoplay-ms', `${AUTOPLAY_MS}ms`);
    this.progress.classList.add('is-running');
    this.autoplayId = window.setInterval(() => this.go(this.active + 1), AUTOPLAY_MS);
  }

  private setPaused(isPaused: boolean): void {
    this.isPaused = isPaused;
    this.restartAutoplay();
  }

  private bindInteractions(): void {
    this.element.addEventListener('mouseenter', () => this.setPaused(true));
    this.element.addEventListener('mouseleave', () => this.setPaused(false));
    this.element.addEventListener('focusin', () => this.setPaused(true));
    this.element.addEventListener('focusout', () => this.setPaused(false));
    this.element.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') this.go(this.active - 1);
      if (event.key === 'ArrowRight') this.go(this.active + 1);
    });

    this.stage.addEventListener('pointerdown', (event) => {
      this.dragStartX = event.clientX;
    });
    this.stage.addEventListener('pointerup', (event) => {
      if (this.dragStartX === null) return;
      const direction = swipeDirection(event.clientX - this.dragStartX, SWIPE_THRESHOLD_PX);
      this.dragStartX = null;
      if (direction !== 0) {
        this.shouldSuppressClick = true;
        this.go(this.active + direction);
      }
    });
    this.stage.addEventListener('click', (event) => {
      if (!this.shouldSuppressClick) return;
      this.shouldSuppressClick = false;
      event.stopPropagation();
    }, { capture: true });
    this.stage.addEventListener('pointercancel', () => {
      this.dragStartX = null;
    });

    new IntersectionObserver(([entry]) => {
      this.isInView = entry?.isIntersecting ?? false;
      this.restartAutoplay();
    }, { threshold: 0.35 }).observe(this.element);
  }
}
