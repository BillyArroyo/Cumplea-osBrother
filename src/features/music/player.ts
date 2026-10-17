import type { BirthdayConfig } from '../../config/types';
import { assetUrl, el, svg } from '../../core/dom';
import { on, type ThemeMode } from '../../core/events';
import { readJson, writeJson } from '../../core/storage';
import { SynthEngine } from './synth';

const VOLUME_KEY = 'volume';
const DEFAULT_VOLUME = 0.7;
const DUCKED_VOLUME_RATIO = 0.15;

const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z" fill="currentColor"/></svg>';

const TRACK_LABELS: Readonly<Record<ThemeMode, string>> = {
  hero: 'Himno heroico',
  venom: 'Himno simbionte',
};

export interface MusicController {
  start(): Promise<void>;
  celebrate(): void;
}

function isVolume(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && value <= 1;
}

export function mountMusicPlayer(config: BirthdayConfig, getMode: () => ThemeMode): MusicController {
  const synth = new SynthEngine({ hero: config.music.tempoHero, venom: config.music.tempoVenom });
  const customAudio = new Audio();
  customAudio.loop = true;
  let volume = readJson(VOLUME_KEY, DEFAULT_VOLUME, isVolume);
  let isPlaying = false;
  let isDucked = false;

  const effectiveVolume = (): number => volume * (isDucked ? DUCKED_VOLUME_RATIO : 1);

  function applyVolume(): void {
    synth.setVolume(effectiveVolume());
    customAudio.volume = effectiveVolume();
  }

  const toggleButton = el('button', {
    className: 'player__toggle',
    attrs: { type: 'button', 'aria-label': 'Reproducir música' },
  });
  const trackLabel = el('span', { className: 'player__track' });
  const equalizer = el('span', { className: 'player__eq', attrs: { 'aria-hidden': 'true' } },
    [el('i'), el('i'), el('i'), el('i')]);
  const volumeInput = el('input', {
    className: 'player__volume',
    attrs: { type: 'range', min: '0', max: '1', step: '0.01', 'aria-label': 'Volumen' },
  });
  volumeInput.value = String(volume);

  const dock = el('aside', { className: 'player', attrs: { 'aria-label': 'Reproductor de música' } }, [
    toggleButton,
    el('div', { className: 'player__meta' }, [
      el('span', { className: 'player__label', text: 'Sonando' }),
      trackLabel,
    ]),
    equalizer,
    volumeInput,
  ]);
  document.body.append(dock);

  const customTrackFor = (mode: ThemeMode): string | undefined => config.music.customTracks[mode];

  function render(): void {
    toggleButton.replaceChildren(svg(isPlaying ? ICON_PAUSE : ICON_PLAY));
    toggleButton.setAttribute('aria-label', isPlaying ? 'Pausar música' : 'Reproducir música');
    dock.classList.toggle('is-playing', isPlaying);
    trackLabel.textContent = TRACK_LABELS[getMode()];
  }

  async function play(mode: ThemeMode): Promise<void> {
    const track = customTrackFor(mode);
    if (track) {
      synth.stop();
      const source = new URL(assetUrl(track), window.location.href).href;
      if (customAudio.src !== source) customAudio.src = source;
      customAudio.volume = effectiveVolume();
      await customAudio.play();
    } else {
      customAudio.pause();
      synth.setVolume(effectiveVolume());
      await synth.start(mode);
    }
    isPlaying = true;
    render();
  }

  function pause(): void {
    synth.stop();
    customAudio.pause();
    isPlaying = false;
    render();
  }

  async function safePlay(mode: ThemeMode): Promise<void> {
    try {
      await play(mode);
    } catch (error) {
      console.warn('[music] playback failed', error);
      pause();
    }
  }

  toggleButton.addEventListener('click', () => {
    if (isPlaying) pause();
    else void safePlay(getMode());
  });

  volumeInput.addEventListener('input', () => {
    volume = Number(volumeInput.value);
    applyVolume();
    writeJson(VOLUME_KEY, volume);
  });

  on('theme:change', (mode) => {
    render();
    if (!isPlaying) return;
    if (customTrackFor(mode) || customTrackFor(mode === 'hero' ? 'venom' : 'hero')) void safePlay(mode);
    else synth.setMode(mode);
  });

  on('voice:state', (isVoicePlaying) => {
    isDucked = isVoicePlaying;
    applyVolume();
  });

  render();

  return {
    start: () => safePlay(getMode()),
    celebrate: () => {
      synth.playFanfare(getMode()).catch((error: unknown) => console.warn('[music] fanfare failed', error));
    },
  };
}
