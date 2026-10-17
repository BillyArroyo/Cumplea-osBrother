import { firstAudioIn, photosInFolder } from './localMedia';
import type { BirthdayConfig } from './types';

export const birthdayConfig: BirthdayConfig = {
  name: 'John',
  age: 26,
  date: '2026-10-17',
  heroTagline: 'Un gran poder conlleva una gran responsabilidad… y hoy, un gran pastel.',
  portrait: photosInFolder('retrato')[0]?.src,
  letter: {
    title: 'Para nuestro héroe',
    paragraphs: [
      'Oye, la ciudad entera se detiene para celebrarte. No necesitas una máscara para ser el héroe de nuestra historia.',
      'Gracias por cada aventura que me das, por cada risa que me generaste y por cada vez que estuviste ahí conmigo en los momentos en que te necesitaba.',
      'Que este nuevo año te lleve más alto que cualquier rascacielos. ¡Feliz cumple! Pásala muy bien el día de hoy, hermano.',
      'Y que tu sentido arácnido siempre te guíe hacia donde tú quieras ser feliz.',
    ],
    signature: 'Con cariño, tu equipo de vengadores',
  },
  galleries: [
    {
      id: 'momentos',
      title: 'Momentos épicos',
      subtitle: 'Los instantes que merecen su propio cómic',
      photos: photosInFolder('momentos'),
    },
    {
      id: 'aventuras',
      title: 'Aventuras en la ciudad',
      subtitle: 'Balanceándonos de recuerdo en recuerdo',
      photos: photosInFolder('aventuras'),
    },
    {
      id: 'amigos',
      title: 'El equipo arácnido',
      subtitle: 'Los aliados que nunca fallan',
      photos: photosInFolder('amigos'),
    },
    {
      id: 'simbionte',
      title: 'El lado simbionte',
      subtitle: 'Las fotos más locas, las que el traje negro no deja olvidar',
      variant: 'venom',
      photos: photosInFolder('simbionte'),
    },
  ],
  voiceMessage: {
    src: firstAudioIn('voz'),
    title: 'Un mensaje especial para ti',
    subtitle: 'Sube el volumen: esto lo grabé solo para ti.',
    shouldAutoplayAfterIntro: true,
    autoplayDelayMs: 2500,
    volumeBoost: 3,
  },
  seedMessages: [],
  backgrounds: {
    hero: undefined,
    venom: undefined,
  },
  music: {
    tempoHero: 132,
    tempoVenom: 84,
    customTracks: {
      hero: undefined,
      venom: undefined,
    },
  },
};
