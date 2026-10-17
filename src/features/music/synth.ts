import type { ThemeMode } from '../../core/events';
import { buildArrangement, midiToFrequency, type Arrangement, type NoteEvent } from './songs';

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.15;
const START_DELAY_SECONDS = 0.08;
const BUS_FADE_SECONDS = 0.35;

interface Bus {
  readonly input: GainNode;
  readonly mode: ThemeMode;
  readonly nodes: readonly AudioNode[];
}

function disposeBus(bus: Bus): void {
  bus.nodes.forEach((node) => node.disconnect());
}

export class SynthEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private noise: AudioBuffer | null = null;
  private bus: Bus | null = null;
  private arrangement: Arrangement = buildArrangement('hero');
  private secondsPerBeat = 0.5;
  private loopStartTime = 0;
  private nextEventIndex = 0;
  private timerId: number | null = null;
  private volume = 0.7;

  constructor(private readonly tempos: Readonly<Record<ThemeMode, number>>) {}

  get isPlaying(): boolean {
    return this.timerId !== null;
  }

  async start(mode: ThemeMode): Promise<void> {
    const context = this.ensureContext();
    if (context.state === 'suspended') await context.resume();
    this.switchTo(mode);
    this.timerId ??= window.setInterval(() => this.scheduleUpcoming(), LOOKAHEAD_MS);
  }

  stop(): void {
    if (this.timerId !== null) window.clearInterval(this.timerId);
    this.timerId = null;
    this.retireBus();
  }

  setMode(mode: ThemeMode): void {
    if (this.isPlaying && this.bus?.mode !== mode) this.switchTo(mode);
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    if (this.master && this.context) this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.25);
  }

  async playFanfare(mode: ThemeMode): Promise<void> {
    const context = this.ensureContext();
    if (context.state === 'suspended') await context.resume();
    const bus = this.createBus(mode);
    const startAt = context.currentTime + 0.05;
    const notes = mode === 'venom' ? [48, 51, 55, 60, 63, 67] : [60, 64, 67, 72, 76, 79];
    notes.forEach((midi, index) => {
      this.playLead(bus, { beat: 0, duration: 1.2, voice: 'lead', midi, velocity: 0.9 }, startAt + index * 0.09, 0.9);
    });
    this.playNoise(bus.input, startAt, 2.2, 0.35, 'highpass', 5000);
    this.playKick(bus.input, startAt, 1);
    window.setTimeout(() => disposeBus(bus), 4000);
  }

  private ensureContext(): AudioContext {
    if (this.context) return this.context;
    const context = new AudioContext();
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.ratio.value = 4;
    this.master = context.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(compressor).connect(context.destination);
    this.noise = createNoiseBuffer(context);
    this.reverb = context.createConvolver();
    this.reverb.buffer = createImpulse(context, 2.4);
    this.reverb.connect(this.master);
    this.context = context;
    return context;
  }

  private createBus(mode: ThemeMode): Bus {
    const context = this.requireContext();
    const input = context.createGain();
    const send = context.createGain();
    send.gain.value = mode === 'venom' ? 0.55 : 0.22;
    input.connect(this.master!);
    input.connect(send).connect(this.reverb!);
    const nodes: AudioNode[] = [input, send];
    if (mode === 'venom') {
      const delay = context.createDelay(1);
      const feedback = context.createGain();
      delay.delayTime.value = (60 / this.tempos.venom) * 0.75;
      feedback.gain.value = 0.38;
      input.connect(delay).connect(feedback).connect(delay);
      feedback.connect(this.master!);
      nodes.push(delay, feedback);
    }
    return { input, mode, nodes };
  }

  private switchTo(mode: ThemeMode): void {
    const context = this.requireContext();
    this.retireBus();
    this.bus = this.createBus(mode);
    this.arrangement = buildArrangement(mode);
    this.secondsPerBeat = 60 / this.tempos[mode];
    this.loopStartTime = context.currentTime + START_DELAY_SECONDS;
    this.nextEventIndex = 0;
  }

  private retireBus(): void {
    if (!this.bus || !this.context) return;
    const retired = this.bus;
    retired.input.gain.setTargetAtTime(0, this.context.currentTime, BUS_FADE_SECONDS / 4);
    window.setTimeout(() => disposeBus(retired), BUS_FADE_SECONDS * 4000);
    this.bus = null;
  }

  private scheduleUpcoming(): void {
    const context = this.context;
    const bus = this.bus;
    if (!context || !bus) return;
    const horizon = context.currentTime + SCHEDULE_AHEAD_SECONDS;
    const { events, lengthBeats } = this.arrangement;
    while (true) {
      const event = events[this.nextEventIndex];
      if (!event) {
        this.nextEventIndex = 0;
        this.loopStartTime += lengthBeats * this.secondsPerBeat;
        continue;
      }
      const time = this.loopStartTime + event.beat * this.secondsPerBeat;
      if (time > horizon) return;
      this.playEvent(bus, event, time);
      this.nextEventIndex += 1;
    }
  }

  private playEvent(bus: Bus, event: NoteEvent, time: number): void {
    const seconds = event.duration * this.secondsPerBeat;
    switch (event.voice) {
      case 'lead':
        return this.playLead(bus, event, time, seconds);
      case 'bass':
        return this.playBass(bus, event, time, seconds);
      case 'pad':
        return this.playPad(bus, event, time, seconds);
      case 'kick':
        return this.playKick(bus.input, time, event.velocity, bus.mode === 'venom' ? 0.7 : 0.4);
      case 'snare':
        return this.playSnare(bus.input, time, event.velocity, bus.mode);
      case 'hat':
        return this.playNoise(bus.input, time, 0.05, event.velocity * 0.18, 'highpass', 7500);
    }
  }

  private playLead(bus: Bus, event: NoteEvent, time: number, seconds: number): void {
    const context = this.requireContext();
    const frequency = midiToFrequency(event.midi);
    const isVenom = bus.mode === 'venom';
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = isVenom ? 6 : 2;
    filter.frequency.setValueAtTime(isVenom ? 500 : 1200, time);
    filter.frequency.linearRampToValueAtTime(isVenom ? 1600 : 3600, time + 0.06);
    filter.frequency.exponentialRampToValueAtTime(isVenom ? 700 : 1800, time + seconds);
    const amp = envelope(context, time, seconds, event.velocity * 0.16, isVenom ? 0.04 : 0.015);
    const detunes = isVenom ? [-18, 0, 18] : [-7, 7];
    detunes.forEach((detune) => {
      const osc = context.createOscillator();
      osc.type = isVenom ? 'square' : 'sawtooth';
      osc.frequency.value = frequency;
      osc.detune.value = detune;
      if (isVenom) attachVibrato(context, osc, time, seconds);
      osc.connect(filter);
      osc.start(time);
      osc.stop(time + seconds + 0.3);
    });
    filter.connect(amp).connect(bus.input);
  }

  private playBass(bus: Bus, event: NoteEvent, time: number, seconds: number): void {
    const context = this.requireContext();
    const isVenom = bus.mode === 'venom';
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isVenom ? 900 : 1400, time);
    filter.frequency.exponentialRampToValueAtTime(isVenom ? 180 : 300, time + seconds);
    const amp = envelope(context, time, seconds, event.velocity * (isVenom ? 0.32 : 0.22), 0.005);
    const osc = context.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = midiToFrequency(event.midi);
    let source: AudioNode = osc;
    if (isVenom) {
      const shaper = context.createWaveShaper();
      shaper.curve = distortionCurve(28);
      source = osc.connect(shaper);
      const sub = context.createOscillator();
      sub.type = 'sine';
      sub.frequency.value = midiToFrequency(event.midi);
      sub.connect(amp);
      sub.start(time);
      sub.stop(time + seconds + 0.3);
    }
    source.connect(filter).connect(amp).connect(bus.input);
    osc.start(time);
    osc.stop(time + seconds + 0.3);
  }

  private playPad(bus: Bus, event: NoteEvent, time: number, seconds: number): void {
    const context = this.requireContext();
    const isVenom = bus.mode === 'venom';
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = isVenom ? 650 : 2200;
    const amp = envelope(context, time, seconds, event.velocity * 0.05, isVenom ? 0.6 : 0.25);
    const osc = context.createOscillator();
    osc.type = isVenom ? 'sawtooth' : 'triangle';
    osc.frequency.value = midiToFrequency(event.midi);
    osc.connect(filter).connect(amp).connect(bus.input);
    osc.start(time);
    osc.stop(time + seconds + 0.6);
  }

  private playKick(destination: AudioNode, time: number, velocity: number, decay = 0.4): void {
    const context = this.requireContext();
    const osc = context.createOscillator();
    const amp = context.createGain();
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + decay * 0.6);
    amp.gain.setValueAtTime(velocity * 0.9, time);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    osc.connect(amp).connect(destination);
    osc.start(time);
    osc.stop(time + decay + 0.05);
  }

  private playSnare(destination: AudioNode, time: number, velocity: number, mode: ThemeMode): void {
    const context = this.requireContext();
    const tail = mode === 'venom' ? 0.35 : 0.18;
    this.playNoise(destination, time, tail, velocity * 0.35, 'highpass', 1200);
    const body = context.createOscillator();
    const amp = context.createGain();
    body.type = 'triangle';
    body.frequency.setValueAtTime(mode === 'venom' ? 140 : 200, time);
    amp.gain.setValueAtTime(velocity * 0.3, time);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
    body.connect(amp).connect(destination);
    body.start(time);
    body.stop(time + 0.15);
  }

  private playNoise(
    destination: AudioNode,
    time: number,
    seconds: number,
    gain: number,
    type: BiquadFilterType,
    frequency: number,
  ): void {
    const context = this.requireContext();
    const source = context.createBufferSource();
    source.buffer = this.noise;
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    const amp = context.createGain();
    amp.gain.setValueAtTime(gain, time);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + seconds);
    source.connect(filter).connect(amp).connect(destination);
    source.start(time);
    source.stop(time + seconds + 0.05);
  }

  private requireContext(): AudioContext {
    if (!this.context) throw new Error('AudioContext not initialised');
    return this.context;
  }
}

function envelope(context: AudioContext, time: number, seconds: number, peak: number, attack: number): GainNode {
  const amp = context.createGain();
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.linearRampToValueAtTime(peak, time + attack);
  amp.gain.setTargetAtTime(peak * 0.7, time + attack, 0.1);
  amp.gain.setTargetAtTime(0.0001, time + Math.max(seconds, attack + 0.01), 0.08);
  return amp;
}

function attachVibrato(context: AudioContext, osc: OscillatorNode, time: number, seconds: number): void {
  const lfo = context.createOscillator();
  const depth = context.createGain();
  lfo.frequency.value = 5.2;
  depth.gain.value = 14;
  lfo.connect(depth).connect(osc.detune);
  lfo.start(time);
  lfo.stop(time + seconds + 0.3);
}

function createNoiseBuffer(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function createImpulse(context: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(context.sampleRate * seconds);
  const impulse = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
  }
  return impulse;
}

function distortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const samples = 1024;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}
