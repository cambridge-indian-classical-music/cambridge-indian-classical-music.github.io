// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

/**
 * https://docs.astro.build/en/reference/configuration-reference/
 *
 * Kept deliberately small. The only thing here that usually needs changing is
 * `site`, below.
 */
export default defineConfig({
  /**
   * The address the site is served from. Used to build canonical URLs, the
   * sitemap and social preview links, so it must match the real address.
   *
   * This is the University subdomain allocated by UIS. It must match the custom
   * domain in the repository's Settings → Pages, and the SITE_URL Script
   * Property of the membership form. See docs/DEPLOYMENT.md.
   *
   * IMPORTANT — the site must be served from the ROOT of its address, not from
   * a sub-path. There is deliberately no `base` set below, because every
   * internal link in this project is written as a plain path (`/events`), which
   * is the form a non-programmer can read and edit. Setting `base` would mean
   * rewriting all of those. A custom domain is always served from its root,
   * so this is satisfied. docs/DEPLOYMENT.md has the details.
   */
  site: 'https://indianclassicalmusic.societies.cam.ac.uk',

  /**
   * Every page is built to a static file. There is no server. See ADR-001.
   */
  output: 'static',

  integrations: [mdx(), sitemap()],

  /** Trailing slashes are a common source of duplicate URLs; pick one and stick to it. */
  trailingSlash: 'never',

  build: { format: 'directory' },
});
