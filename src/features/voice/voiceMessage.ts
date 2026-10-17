import type { VoiceMessage } from '../../config/types';
import { el, prefersReducedMotion, svg } from '../../core/dom';
import { emit } from '../../core/events';

const BAR_COUNT = 32;
const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z" fill="currentColor"/></svg>';

export interface VoiceMessageController {
  readonly element: HTMLElement;
  play(): Promise<void>;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

export function createVoiceMessage(config: VoiceMessage): VoiceMessageController | null {
  if (!config.src) return null;

  const audio = new Audio(config.src);
  audio.preload = 'metadata';

  const playButton = el('button', { className: 'voice__play', attrs: { type: 'button', 'aria-label': 'Escuchar mensaje' } });
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => el('i', { attrs: { style: `--i:${i}` } }));
  const visualizer = el('div', { className: 'voice__bars', attrs: { 'aria-hidden': 'true' } }, bars);
  const seek = el('input', {
    className: 'voice__seek',
    attrs: { type: 'range', min: '0', max: '1000', value: '0', step: '1', 'aria-label': 'Posición del mensaje' },
  });
  const time = el('span', { className: 'voice__time', text: '0:00 / 0:00' });
  const status = el('span', { className: 'voice__status', text: 'Transmisión lista' });

  const card = el('div', { className: 'voice' }, [
    el('div', { className: 'voice__button-wrap' }, [
      el('span', { className: 'voice__ring', attrs: { 'aria-hidden': 'true' } }),
      el('span', { className: 'voice__ring voice__ring--late', attrs: { 'aria-hidden': 'true' } }),
      playButton,
    ]),
    el('div', { className: 'voice__body' }, [
      status,
      visualizer,
      el('div', { className: 'voice__timeline' }, [seek, time]),
    ]),
  ]);

  const section = el('section', { className: 'voice-section', attrs: { id: 'voz', 'aria-labelledby': 'voice-title' } }, [
    el('header', { className: 'section-head section-head--center' }, [
      el('span', { className: 'section-head__kicker', text: 'Transmisión de voz' }),
      el('h2', { className: 'section-head__title', text: config.title, attrs: { id: 'voice-title' } }),
      el('p', { className: 'section-head__lead', text: config.subtitle }),
    ]),
    card,
  ]);

  let analyser: AnalyserNode | null = null;
  let frequencyData: Uint8Array<ArrayBuffer> | null = null;
  let frameId: number | null = null;
  let isGraphConnected = false;

  function connectAudioGraph(): void {
    if (isGraphConnected) return;
    isGraphConnected = true;
    try {
      const context = new AudioContext();
      const leveler = context.createDynamicsCompressor();
      leveler.threshold.value = -30;
      leveler.knee.value = 12;
      leveler.ratio.value = 5;
      leveler.attack.value = 0.005;
      leveler.release.value = 0.25;
      const boost = context.createGain();
      boost.gain.value = config.volumeBoost;
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -1.5;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.001;
      limiter.release.value = 0.1;
      const meter = context.createAnalyser();
      meter.fftSize = 256;
      meter.smoothingTimeConstant = 0.75;
      context.createMediaElementSource(audio).connect(leveler).connect(boost).connect(limiter).connect(meter).connect(context.destination);
      void context.resume();
      if (prefersReducedMotion()) return;
      analyser = meter;
      frequencyData = new Uint8Array(meter.frequencyBinCount);
    } catch (error) {
      console.warn('[voice] audio processing unavailable', error);
      analyser = null;
      card.classList.add('is-css-bars');
    }
  }

  function drawBars(): void {
    if (analyser && frequencyData) {
      analyser.getByteFrequencyData(frequencyData);
      bars.forEach((bar, i) => {
        const value = frequencyData![Math.min(frequencyData!.length - 1, i + 1)] ?? 0;
        bar.style.transform = `scaleY(${(0.12 + (value / 255) * 0.88).toFixed(3)})`;
      });
    }
    frameId = requestAnimationFrame(drawBars);
  }

  function stopBars(): void {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    bars.forEach((bar) => bar.style.removeProperty('transform'));
  }

  function render(): void {
    const isPlaying = !audio.paused && !audio.ended;
    playButton.replaceChildren(svg(isPlaying ? ICON_PAUSE : ICON_PLAY));
    playButton.setAttribute('aria-label', isPlaying ? 'Pausar mensaje' : 'Escuchar mensaje');
    card.classList.toggle('is-playing', isPlaying);
    if (audio.ended) status.textContent = 'Fin de la transmisión';
    else status.textContent = isPlaying ? 'En el aire…' : 'Transmisión lista';
  }

  async function play(): Promise<void> {
    connectAudioGraph();
    try {
      await audio.play();
    } catch (error) {
      console.warn('[voice] playback failed', error);
      status.textContent = 'Toca el botón para escuchar';
    }
  }

  playButton.addEventListener('click', () => {
    if (audio.paused) void play();
    else audio.pause();
  });

  audio.addEventListener('play', () => {
    emit('voice:state', true);
    if (frameId === null) drawBars();
    render();
  });
  const handleStop = (): void => {
    emit('voice:state', false);
    stopBars();
    render();
  };
  audio.addEventListener('pause', handleStop);
  audio.addEventListener('ended', handleStop);
  audio.addEventListener('error', () => {
    status.textContent = 'No se pudo cargar el audio';
  });

  audio.addEventListener('timeupdate', () => {
    if (audio.duration > 0) seek.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
    time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    seek.style.setProperty('--progress', `${Number(seek.value) / 10}%`);
  });
  audio.addEventListener('loadedmetadata', () => {
    time.textContent = `0:00 / ${formatTime(audio.duration)}`;
  });
  seek.addEventListener('input', () => {
    if (audio.duration > 0) audio.currentTime = (Number(seek.value) / 1000) * audio.duration;
  });

  render();
  return { element: section, play };
}
