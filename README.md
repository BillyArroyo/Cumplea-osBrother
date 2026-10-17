# 🕷️ Spider Birthday

Página web de cumpleaños con temática arácnida: estética de cómic pop-art, un **modo simbionte** (traje negro), música sintetizada en vivo, carruseles 3D de fotos, carta editable, muro de mensajes y pastel con velas que se soplan.

> Página de fans sin afiliación oficial. No incluye imágenes, logos ni audio con derechos de autor: todo el arte se genera con CSS, SVG y Canvas, y la música se sintetiza con Web Audio a partir de *Happy Birthday*, que es de dominio público.

## Características

| Sección | Qué hace |
| --- | --- |
| **Intro** | Pantalla de "sentido arácnido" que desbloquea el audio del navegador |
| **Hero** | Nombre animado, skyline procedural con parallax y retrato con marco de telaraña |
| **Mensaje de voz** | Tu audio grabado sobre la música: la música baja sola mientras hablas, con visualizador de ondas |
| **Carta** | Mensaje editable en el navegador (se guarda en `localStorage`) |
| **Galerías** | 4 carruseles 3D tipo coverflow con swipe, teclado, autoplay y lightbox. Las fotos salen de carpetas; las galerías vacías se ocultan |
| **Modo simbionte** | Transición viscosa que cambia toda la paleta y la música a una versión oscura en tono menor |
| **Muro de mensajes** | Bocadillos de cómic compartidos entre visitantes (Supabase) o locales si no se configura |
| **Pastel** | Velas según la edad, confeti de telarañas y fanfarria |
| **Extra** | Clic en cualquier espacio vacío para lanzar telarañas |

## Inicio rápido

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # tests unitarios (Vitest)
pnpm build      # build de producción en dist/
```

## Personalización

Todo se configura en **`src/config/birthday.config.ts`**:

```ts
name: 'Peter',
age: 18,
date: '2026-10-17',
portrait: photosInFolder('retrato')[0]?.src,
galleries: [
  {
    id: 'momentos',
    title: 'Momentos épicos',
    subtitle: '…',
    photos: [
      ...photosInFolder('momentos'),
    ],
  },
],
```

### Fotos

Pon las fotos en la carpeta que corresponda y aparecen solas en la página. No hay que tocar código.

```
src/photos/
├── retrato/     → foto principal del círculo (usa la primera)
├── momentos/    → carrusel "Momentos épicos"
├── aventuras/   → carrusel "Aventuras en la ciudad"
├── amigos/      → carrusel "El equipo arácnido"
└── simbionte/   → carrusel del modo Venom
```

- Formatos: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`.
- El orden sigue el nombre del archivo: `01.jpg`, `02.jpg`, `10.jpg`…
- Recomendado: menos de 1 MB y unos 1600 px de lado, para que cargue rápido.
- Para pie de foto, añade `caption` manualmente en `birthday.config.ts`.

La página publicada no permite subir, cambiar ni borrar fotos: solo muestra las de las carpetas. Las galerías sin fotos no aparecen.

### Mensaje de voz

Pon tu grabación en `src/audio/voz/` (un solo archivo: `.mp3`, `.m4a`, `.wav`, `.ogg`, `.aac`, `.opus` o `.webm`). La página entonces:

- Muestra la sección **"Un mensaje especial para ti"** con reproductor y ondas.
- La reproduce sola 2,5 s después de la intro. Para desactivarlo, pon `shouldAutoplayAfterIntro: false` en `voiceMessage`.
- Mientras suena la voz, baja la música al 15 % y luego la vuelve a subir.
- Iguala y amplifica la voz al reproducirla (compresor + refuerzo + limitador). Se ajusta con `volumeBoost` (1 = original, 3 = por defecto).

Si la carpeta está vacía, la sección no aparece.

### Música

Por defecto suena un arreglo original sintetizado (modo héroe: orquestal y épico; modo simbionte: oscuro y distorsionado). Para usar tus propios MP3 (con derechos de uso), cópialos en `public/audio/` y configúralos así:

```ts
music: {
  customTracks: { hero: 'audio/heroe.mp3', venom: 'audio/simbionte.mp3' },
}
```

### Fondos

Opcionalmente puedes poner imágenes en `public/backgrounds/` y referenciarlas en `backgrounds.hero` / `backgrounds.venom`.

## Muro de mensajes compartido (Supabase)

Sin configuración, cada visitante solo ve sus propios mensajes (se guardan en su navegador). Para que todos vean los mensajes de todos:

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta el contenido de `supabase/wall_messages.sql`. Crea la tabla con permisos de solo **leer y escribir**: nadie puede editar ni borrar mensajes desde la página.
3. En **Project Settings → API**, copia la **Project URL** y la clave **anon public**.
4. Para probar en local: copia `.env.example` como `.env` y pega ambos valores.
5. Para producción: en GitHub ve a **Settings → Secrets and variables → Actions** y crea `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

La clave *anon* está pensada para ir en el navegador; la seguridad la dan las políticas RLS del script. Los mensajes se moderan (o borran) desde el panel de Supabase, en **Table Editor**.

## Arquitectura

```
src/
├── config/          # Configuración tipada (única fuente de contenido)
├── core/            # DOM helpers, event bus, localStorage
├── photos/          # Fotos por galería (se detectan solas)
├── audio/voz/       # Mensaje de voz
├── features/
│   ├── cake/        # Pastel y velas
│   ├── carousel/    # Carrusel 3D + lógica pura + sección de galería
│   ├── effects/     # Telarañas, skyline, confeti (Canvas/SVG)
│   ├── hero/        # Portada
│   ├── intro/       # Pantalla de entrada
│   ├── letter/      # Carta editable
│   ├── lightbox/    # Visor a pantalla completa
│   ├── messages/    # Muro de mensajes + repositorio local/Supabase
│   ├── music/       # Partitura, arreglos y motor Web Audio
│   ├── nav/         # Navegación con sección activa
│   └── theme/       # Modo héroe / simbionte
└── styles/          # Tokens, base, componentes, secciones, venom
```

- **Vite + TypeScript estricto**, sin framework: bundle de unos 16 kB gzip.
- Los módulos se comunican con un **event bus tipado** (`theme:change`, `celebrate`).
- La lógica pura (partitura, matemática del carrusel, validación, geometría) está separada del DOM y tiene tests.
- Accesible: navegación por teclado, `aria-*`, `prefers-reduced-motion` respetado.

## Ramas y modo edición

| Rama | Uso | ¿Se publica? |
| --- | --- | --- |
| `develop` | Trabajo diario. CI corre tests y build | No |
| `main` | Producción | Sí, en GitHub Pages |

La variable `VITE_EDIT_MODE` controla si se puede editar algo en la página:

- `false` (por defecto y **siempre en `main`**): la carta es de solo lectura y no se pueden borrar mensajes. Los visitantes solo pueden dejar comentarios en el muro (Supabase).
- `true` (solo en tu `.env` local): habilita "Escribir mi propia carta" y borrar mensajes locales, para probar.

## Despliegue en GitHub Pages

El workflow `.github/workflows/deploy.yml` corre los tests, hace el build y publica en cada push a `main`.

1. Sube el repo a GitHub.
2. Ve a **Settings → Pages → Source: GitHub Actions**.
3. Haz push a `main`.
