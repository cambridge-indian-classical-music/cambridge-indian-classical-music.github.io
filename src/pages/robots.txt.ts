import type { APIRoute } from 'astro';

/**
 * robots.txt, generated so that the sitemap address always matches the `site`
 * setting in astro.config.mjs and cannot drift out of date.
 *
 * `/admin` is hidden from search engines because a CMS login page has no place
 * in search results. That is tidiness, not security — see ADR-005 for where
 * access control actually lives.
 */
export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${new URL('sitemap-index.xml', site)}
`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
