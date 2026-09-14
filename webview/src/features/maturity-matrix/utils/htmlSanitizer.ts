/**
 * Sanitizes exported HTML documents for safe, flickering-free iframe rendering in Webviews.
 * Removes embedded Node.js/PostCSS script bundles, CSP restrictions, and unload traps.
 */
export function sanitizeHtmlForRendering(rawHtml: string, isDark: boolean): string {
  if (!rawHtml) return '';

  // 1. Remove all <script>...</script> blocks (bypasses broken Node.js JS runtime & beforeunload traps)
  let cleanHtml = rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 2. Remove Content-Security-Policy meta tags that block local webview/iframe rendering
  cleanHtml = cleanHtml.replace(/<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');

  // 3. Inject active theme class into <html> and <body>
  const themeClass = isDark ? 'dark' : 'light';
  cleanHtml = cleanHtml.replace(/<html([^>]*)>/i, `<html$1 class="${themeClass}">`);
  cleanHtml = cleanHtml.replace(/<body([^>]*)>/i, `<body$1 class="${themeClass}">`);

  // 4. Inject fallback style resets for Tailwind CSS custom properties
  const cssReset = `
    <style>
      :root {
        color-scheme: ${isDark ? 'dark' : 'light'};
      }
      body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow-y: auto !important;
        background-color: ${isDark ? '#0f172a' : '#ffffff'} !important;
        color: ${isDark ? '#f8fafc' : '#0f172a'} !important;
      }
    </style>
  `;

  return cleanHtml.replace('</head>', `${cssReset}</head>`);
}
