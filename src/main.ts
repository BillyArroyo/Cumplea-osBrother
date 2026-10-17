import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/sections.css';
import './styles/venom.css';
import './styles/voice.css';
import './styles/mobile.css';

import { birthdayConfig } from './config/birthday.config';
import { el, requireElement } from './core/dom';
import { on } from './core/events';
import { createCakeSection } from './features/cake/cake';
import { createGallerySection } from './features/carousel/gallerySection';
import { mountWebShooter } from './features/effects/webShooter';
import { createHero } from './features/hero/hero';
import { mountIntro } from './features/intro/intro';
import { createLetter } from './features/letter/letter';
import { mountLightbox } from './features/lightbox/lightbox';
import { createMessageWall } from './features/messages/messageWall';
import { mountMusicPlayer } from './features/music/player';
import { createNav } from './features/nav/nav';
import { mountTheme } from './features/theme/theme';
import { createVenomSection } from './features/theme/venomSection';
import { createVoiceMessage } from './features/voice/voiceMessage';

function bootstrap(): void {
  const app = requireElement<HTMLElement>('#app');
  const config = birthdayConfig;
  document.title = `¡Feliz cumpleaños, ${config.name}!`;

  const theme = mountTheme();
  const lightbox = mountLightbox();
  const music = mountMusicPlayer(config, theme.getMode);
  const voice = createVoiceMessage(config.voiceMessage);

  const heroGalleries = config.galleries.filter((gallery) => gallery.variant !== 'venom');
  const venomGallery = config.galleries.find((gallery) => gallery.variant === 'venom');
  const venomGalleryIndex = venomGallery ? config.galleries.indexOf(venomGallery) : -1;

  const gallerySections = heroGalleries
    .map((gallery) => createGallerySection(gallery, config.galleries.indexOf(gallery), lightbox))
    .filter((section): section is HTMLElement => section !== null);

  const main = el('main', { className: 'main' }, [
    createLetter(config.letter),
    voice?.element,
    gallerySections.length > 0 ? el('div', { className: 'galleries', attrs: { id: 'galerias' } }, gallerySections) : null,
    createVenomSection(config, theme, venomGallery ? createGallerySection(venomGallery, venomGalleryIndex, lightbox) : null),
    createMessageWall(config.seedMessages),
    createCakeSection(config.age, config.name),
  ]);

  const footer = el('footer', { className: 'footer' }, [
    el('p', { text: `Hecho con telarañas y cariño para ${config.name}.` }),
    el('p', { className: 'footer__small', text: 'Página de fans sin afiliación oficial. Haz clic en cualquier lugar vacío para lanzar telarañas.' }),
  ]);

  app.replaceChildren(createNav(), createHero(config), main, footer);

  on('celebrate', () => music.celebrate());
  mountWebShooter();
  mountIntro(config.name, () => {
    void music.start();
    if (voice && config.voiceMessage.shouldAutoplayAfterIntro) {
      window.setTimeout(() => void voice.play(), config.voiceMessage.autoplayDelayMs);
    }
  });
}

bootstrap();
