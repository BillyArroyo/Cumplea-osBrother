import { el, prefersReducedMotion } from '../../core/dom';
import { emit, type ThemeMode } from '../../core/events';
import { readJson, writeJson } from '../../core/storage';

const THEME_KEY = 'theme';
const WIPE_DURATION_MS = 900;

const TOGGLE_COPY: Readonly<Record<ThemeMode, { label: string; hint: string }>> = {
  hero: { label: 'Activar simbionte', hint: 'Deja que el traje negro te consuma' },
  venom: { label: 'Volver a ser héroe', hint: 'Libérate del simbionte' },
};

export interface ThemeController {
  getMode(): ThemeMode;
  toggle(origin?: { x: number; y: number }): void;
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'hero' || value === 'venom';
}

export function mountTheme(): ThemeController {
  let mode = readJson<ThemeMode>(THEME_KEY, 'hero', isThemeMode);
  let isTransitioning = false;
  applyMode(mode);

  const label = el('span', { className: 'theme-toggle__label' });
  const hint = el('span', { className: 'theme-toggle__hint' });
  const button = el('button', { className: 'theme-toggle', attrs: { type: 'button' } }, [
    el('span', { className: 'theme-toggle__blob', attrs: { 'aria-hidden': 'true' } }),
    el('span', { className: 'theme-toggle__text' }, [label, hint]),
  ]);
  document.body.append(button);

  function renderButton(): void {
    label.textContent = TOGGLE_COPY[mode].label;
    hint.textContent = TOGGLE_COPY[mode].hint;
    button.setAttribute('aria-pressed', String(mode === 'venom'));
  }

  function commit(next: ThemeMode): void {
    mode = next;
    applyMode(mode);
    writeJson(THEME_KEY, mode);
    renderButton();
    emit('theme:change', mode);
  }

  function toggle(origin?: { x: number; y: number }): void {
    if (isTransitioning) return;
    const next: ThemeMode = mode === 'hero' ? 'venom' : 'hero';
    if (prefersReducedMotion()) {
      commit(next);
      return;
    }
    isTransitioning = true;
    const point = origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const wipe = el('div', {
      className: `symbiote-wipe symbiote-wipe--${next}`,
      attrs: { 'aria-hidden': 'true', style: `--wipe-x:${point.x}px;--wipe-y:${point.y}px` },
    });
    document.body.append(wipe);
    window.setTimeout(() => commit(next), WIPE_DURATION_MS * 0.55);
    wipe.addEventListener('animationend', () => {
      wipe.remove();
      isTransitioning = false;
    }, { once: true });
  }

  button.addEventListener('click', (event) => {
    const rect = button.getBoundingClientRect();
    toggle({ x: event.clientX || rect.left + rect.width / 2, y: event.clientY || rect.top + rect.height / 2 });
  });

  renderButton();
  return { getMode: () => mode, toggle };
}

function applyMode(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'venom' ? '#050507' : '#c8102e');
}
