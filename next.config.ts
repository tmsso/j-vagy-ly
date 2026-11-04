import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy.
 *
 * Pragmatic rather than strict: Next.js inlines small bootstrap scripts into
 * the prerendered HTML, so `script-src` needs 'unsafe-inline'. The strict
 * alternative (per-request nonces) forces every page to render dynamically,
 * which would throw away the static prerender this app relies on. The policy
 * still blocks every third-party origin, plugins (object-src), <base>
 * hijacking and framing.
 *
 * - 'unsafe-eval' only in dev: React Fast Refresh needs it; production does not.
 * - worker-src blob: canvas-confetti may render from a worker created from a
 *   blob: URL; without this the confetti silently stops.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Legacy twin of frame-ancestors 'none' for older browsers.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray lockfile higher up the directory tree
  // otherwise makes Next guess the wrong root (a build warning on dev machines).
  turbopack: { root: __dirname },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // The browser must always re-check the service worker script, or a fix
        // to it could take a long time to reach installed apps.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
