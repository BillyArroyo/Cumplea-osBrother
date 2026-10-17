export interface Photo {
  readonly src: string;
  readonly caption?: string;
}

export interface Gallery {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly variant?: 'venom';
  readonly photos: readonly Photo[];
}

export interface SeedMessage {
  readonly author: string;
  readonly text: string;
}

export interface CustomTracks {
  readonly hero?: string;
  readonly venom?: string;
}

export interface VoiceMessage {
  readonly src?: string;
  readonly title: string;
  readonly subtitle: string;
  readonly shouldAutoplayAfterIntro: boolean;
  readonly autoplayDelayMs: number;
  readonly volumeBoost: number;
}

export interface BirthdayConfig {
  readonly name: string;
  readonly age: number;
  readonly date: string;
  readonly heroTagline: string;
  readonly portrait?: string;
  readonly letter: {
    readonly title: string;
    readonly paragraphs: readonly string[];
    readonly signature: string;
  };
  readonly galleries: readonly Gallery[];
  readonly voiceMessage: VoiceMessage;
  readonly seedMessages: readonly SeedMessage[];
  readonly backgrounds: {
    readonly hero?: string;
    readonly venom?: string;
  };
  readonly music: {
    readonly tempoHero: number;
    readonly tempoVenom: number;
    readonly customTracks: CustomTracks;
  };
}
