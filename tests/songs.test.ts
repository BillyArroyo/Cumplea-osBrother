import { describe, expect, it } from 'vitest';
import { buildArrangement, chordTones, HAPPY_BIRTHDAY_MELODY, midiToFrequency, toHarmonicMinor } from '../src/features/music/songs';

describe('melody', () => {
  it('spans 25 beats (pickup plus eight bars of 3/4)', () => {
    const totalBeats = HAPPY_BIRTHDAY_MELODY.reduce((sum, [, beats]) => sum + beats, 0);
    expect(totalBeats).toBe(25);
  });
});

describe('buildArrangement', () => {
  it.each(['hero', 'venom'] as const)('keeps every %s event inside the loop', (mode) => {
    const { events, lengthBeats } = buildArrangement(mode);
    expect(events.length).toBeGreaterThan(0);
    events.forEach((event) => {
      expect(event.beat).toBeGreaterThanOrEqual(0);
      expect(event.beat + event.duration).toBeLessThanOrEqual(lengthBeats);
    });
  });

  it('sorts events chronologically for the scheduler', () => {
    const { events } = buildArrangement('hero');
    const beats = events.map((event) => event.beat);
    expect(beats).toEqual([...beats].sort((a, b) => a - b));
  });

  it('turns the venom melody into C harmonic minor', () => {
    const venomLead = buildArrangement('venom').events.filter((e) => e.voice === 'lead').map((e) => e.midi % 12);
    expect(venomLead).not.toContain(4);
    expect(venomLead).not.toContain(9);
    expect(venomLead).toContain(11);
  });
});

describe('music helpers', () => {
  it('flattens the third and sixth degrees only', () => {
    expect(toHarmonicMinor(76)).toBe(75);
    expect(toHarmonicMinor(69)).toBe(68);
    expect(toHarmonicMinor(71)).toBe(71);
  });

  it('builds major and minor triads', () => {
    expect(chordTones({ root: 48, quality: 'major' })).toEqual([48, 52, 55]);
    expect(chordTones({ root: 48, quality: 'minor' })).toEqual([48, 51, 55]);
  });

  it('maps A4 to 440 Hz', () => {
    expect(midiToFrequency(69)).toBe(440);
  });
});
