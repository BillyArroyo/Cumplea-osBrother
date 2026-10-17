import type { ThemeMode } from '../../core/events';

export type Voice = 'lead' | 'bass' | 'pad' | 'kick' | 'snare' | 'hat';

export interface NoteEvent {
  readonly beat: number;
  readonly duration: number;
  readonly voice: Voice;
  readonly midi: number;
  readonly velocity: number;
}

export interface Arrangement {
  readonly events: readonly NoteEvent[];
  readonly lengthBeats: number;
}

type ChordQuality = 'major' | 'minor';

interface Chord {
  readonly root: number;
  readonly quality: ChordQuality;
}

const BEATS_PER_BAR = 3;
const INTRO_BARS = 2;
const INTRO_BEATS = INTRO_BARS * BEATS_PER_BAR;
const PICKUP_BEATS = 1;

export const HAPPY_BIRTHDAY_MELODY: ReadonlyArray<readonly [midi: number, beats: number]> = [
  [67, 0.75], [67, 0.25], [69, 1], [67, 1], [72, 1], [71, 2],
  [67, 0.75], [67, 0.25], [69, 1], [67, 1], [74, 1], [72, 2],
  [67, 0.75], [67, 0.25], [79, 1], [76, 1], [72, 1], [71, 1], [69, 1],
  [77, 0.75], [77, 0.25], [76, 1], [72, 1], [74, 1], [72, 3],
];

const MAJOR_PROGRESSION: readonly Chord[] = [
  { root: 48, quality: 'major' },
  { root: 43, quality: 'major' },
  { root: 43, quality: 'major' },
  { root: 48, quality: 'major' },
  { root: 48, quality: 'major' },
  { root: 41, quality: 'major' },
  { root: 43, quality: 'major' },
  { root: 48, quality: 'major' },
];

const INTRO_PROGRESSION: readonly Chord[] = [
  { root: 48, quality: 'major' },
  { root: 43, quality: 'major' },
];

const MINOR_PITCH_SHIFTS: Readonly<Record<number, number>> = { 4: -1, 9: -1 };

export function toHarmonicMinor(midi: number): number {
  return midi + (MINOR_PITCH_SHIFTS[midi % 12] ?? 0);
}

function minorizeChord(chord: Chord): Chord {
  const isDominant = chord.root % 12 === 7;
  return isDominant ? chord : { ...chord, quality: 'minor' };
}

export function chordTones(chord: Chord): readonly number[] {
  const third = chord.quality === 'major' ? 4 : 3;
  return [chord.root, chord.root + third, chord.root + 7];
}

function melodyEvents(transform: (midi: number) => number, velocity: number): NoteEvent[] {
  let cursor = INTRO_BEATS - PICKUP_BEATS;
  return HAPPY_BIRTHDAY_MELODY.map(([midi, beats]) => {
    const event: NoteEvent = { beat: cursor, duration: beats, voice: 'lead', midi: transform(midi), velocity };
    cursor += beats;
    return event;
  });
}

function barsOf(progression: readonly Chord[], startBeat: number): Array<{ chord: Chord; beat: number }> {
  return progression.map((chord, index) => ({ chord, beat: startBeat + index * BEATS_PER_BAR }));
}

function heroBar(chord: Chord, beat: number, isIntro: boolean): NoteEvent[] {
  const pad = chordTones({ ...chord, root: chord.root + 12 }).map<NoteEvent>((midi) => ({
    beat, duration: BEATS_PER_BAR, voice: 'pad', midi, velocity: isIntro ? 0.5 : 0.32,
  }));
  const bass = Array.from({ length: 6 }, (_, step): NoteEvent => ({
    beat: beat + step * 0.5, duration: 0.45, voice: 'bass',
    midi: chord.root - 12 + (step % 2 === 1 ? 12 : 0), velocity: step === 0 ? 1 : 0.75,
  }));
  const kicks = (isIntro ? [0, 1, 2] : [0, 1.5]).map<NoteEvent>((offset) => ({
    beat: beat + offset, duration: 0.25, voice: 'kick', midi: 0, velocity: 1,
  }));
  const snares = (isIntro ? [2, 2.5] : [2]).map<NoteEvent>((offset) => ({
    beat: beat + offset, duration: 0.25, voice: 'snare', midi: 0, velocity: 0.8,
  }));
  const hats = Array.from({ length: 6 }, (_, step): NoteEvent => ({
    beat: beat + step * 0.5, duration: 0.1, voice: 'hat', midi: 0, velocity: step % 2 === 0 ? 0.5 : 0.3,
  }));
  return [...pad, ...bass, ...kicks, ...snares, ...hats];
}

function venomBar(chord: Chord, beat: number, isIntro: boolean): NoteEvent[] {
  const pad = chordTones(chord).map<NoteEvent>((midi) => ({
    beat, duration: BEATS_PER_BAR, voice: 'pad', midi, velocity: 0.42,
  }));
  const bass: NoteEvent[] = [
    { beat, duration: 1.8, voice: 'bass', midi: chord.root - 24, velocity: 1 },
    { beat: beat + 2, duration: 0.9, voice: 'bass', midi: chord.root - 24, velocity: 0.7 },
  ];
  const kicks = (isIntro ? [0] : [0, 0.75]).map<NoteEvent>((offset) => ({
    beat: beat + offset, duration: 0.4, voice: 'kick', midi: 0, velocity: 1,
  }));
  const snares: NoteEvent[] = isIntro ? [] : [{ beat: beat + 2, duration: 0.5, voice: 'snare', midi: 0, velocity: 0.9 }];
  const hats = [0, 1, 2].map<NoteEvent>((offset) => ({
    beat: beat + offset + 0.5, duration: 0.15, voice: 'hat', midi: 0, velocity: 0.25,
  }));
  return [...pad, ...bass, ...kicks, ...snares, ...hats];
}

export function buildArrangement(mode: ThemeMode): Arrangement {
  const isVenom = mode === 'venom';
  const progression = isVenom ? MAJOR_PROGRESSION.map(minorizeChord) : MAJOR_PROGRESSION;
  const intro = isVenom ? INTRO_PROGRESSION.map(minorizeChord) : INTRO_PROGRESSION;
  const renderBar = isVenom ? venomBar : heroBar;

  const accompaniment = [
    ...barsOf(intro, 0).flatMap(({ chord, beat }) => renderBar(chord, beat, true)),
    ...barsOf(progression, INTRO_BEATS).flatMap(({ chord, beat }) => renderBar(chord, beat, false)),
  ];
  const melody = melodyEvents(isVenom ? toHarmonicMinor : (midi) => midi, isVenom ? 0.75 : 0.9);
  const events = [...accompaniment, ...melody].sort((a, b) => a.beat - b.beat);

  return { events, lengthBeats: INTRO_BEATS + progression.length * BEATS_PER_BAR };
}

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}
