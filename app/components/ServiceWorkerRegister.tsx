'use client';

import { useEffect } from 'react';

/**
 * Registers public/sw.js in production builds only. In `next dev` a service
 * worker would serve stale chunks across hot reloads, which is confusing.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        // Hand the worker every static file this page has loaded so far,
        // including chunks loaded after the HTML (it caches what it lacks).
        const urls = performance
          .getEntriesByType('resource')
          .map((entry) => new URL(entry.name))
          .filter((url) => url.origin === location.origin && url.pathname.startsWith('/_next/static/'))
          // Keep the query: Vercel may version asset URLs with ?dpl=<deployment>.
          .map((url) => url.pathname + url.search);
        registration.active?.postMessage({ type: 'CACHE_URLS', urls });
      })
      .catch(() => {
        // No offline support this time; the game itself still works.
      });
  }, []);

  return null;
}
