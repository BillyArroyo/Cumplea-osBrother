import type { Photo } from './types';

const photoModules = import.meta.glob<string>('../photos/*/*.{jpg,jpeg,png,webp,gif,avif,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const audioModules = import.meta.glob<string>('../audio/*/*.{mp3,m4a,aac,wav,ogg,opus,webm,MP3,M4A,AAC,WAV,OGG}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const fileNameCollator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });

function urlsInFolder(modules: Readonly<Record<string, string>>, root: string, folder: string): string[] {
  const prefix = `../${root}/${folder}/`;
  return Object.keys(modules)
    .filter((path) => path.startsWith(prefix))
    .sort(fileNameCollator.compare)
    .map((path) => new URL(modules[path]!, document.baseURI).href);
}

export function photosInFolder(folder: string): Photo[] {
  return urlsInFolder(photoModules, 'photos', folder).map((src) => ({ src }));
}

export function firstAudioIn(folder: string): string | undefined {
  return urlsInFolder(audioModules, 'audio', folder)[0];
}
