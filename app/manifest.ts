import type { MetadataRoute } from 'next';

// Web app manifest, served by Next at /manifest.webmanifest (and linked from
// every page automatically). It is what makes the site installable.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'J vagy LY? – helyesírás-gyakorló',
    short_name: 'J vagy LY?',
    description: 'Gyakorold a magyar helyesírást! Válaszd ki a helyes írásmódot a j és ly közül.',
    lang: 'hu',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#f0f9ff',
    theme_color: '#0284c7',
    categories: ['education', 'games'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
