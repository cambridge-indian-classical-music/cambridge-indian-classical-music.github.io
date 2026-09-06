/**
 * Society-wide settings.
 *
 * This is the file to edit for things that appear across the whole site — the
 * society's name, contact address, navigation and social links. It is kept
 * separate from the templates so that these can be changed without reading any
 * component code.
 */

export const site = {
  name: 'Cambridge University Indian Classical Music Society',
  shortName: 'CUICMS',

  /** Used as the fallback page description and in social previews. */
  description:
    'The Cambridge University Indian Classical Music Society presents concerts, workshops and talks in the Carnatic and Hindustani traditions.',

  /** TODO: replace with the society address once one exists. See docs/HANDOVER.md. */
  email: 'committee@example.org',

  /** The main navigation, in order. */
  nav: [
    { label: 'Events', href: '/events' },
    { label: 'Artists', href: '/artists' },
    { label: 'About', href: '/about' },
  ],

  /** Social links shown in the footer. Remove any the society does not use. */
  social: [
    { label: 'Instagram', href: 'https://instagram.com/' },
    { label: 'Facebook', href: 'https://facebook.com/' },
  ],

  /**
   * Privacy-friendly, cookieless analytics — off by default.
   *
   * If the committee decides it wants visitor numbers, see docs/DEPLOYMENT.md.
   * Cloudflare Web Analytics sets no cookies and collects no personal data, so
   * it needs no consent banner. Nothing else should be added without a good
   * reason and a look at the privacy implications. See ADR-011.
   */
  analytics: {
    enabled: false,
    cloudflareToken: '',
  },
} as const;
