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
   * TODO: change this to the society's own domain once one is registered.
   * Until then, this is the default address Cloudflare Pages gives the project.
   * See docs/DEPLOYMENT.md.
   */
  site: 'https://cuicms.pages.dev',

  /**
   * Every page is built to a static file. There is no server. See ADR-001.
   */
  output: 'static',

  integrations: [mdx(), sitemap()],

  /** Trailing slashes are a common source of duplicate URLs; pick one and stick to it. */
  trailingSlash: 'never',

  build: { format: 'directory' },
});
