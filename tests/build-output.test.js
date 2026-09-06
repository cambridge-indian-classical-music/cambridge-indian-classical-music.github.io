/**
 * Checks run against the built site in `dist/`.
 *
 * These test the real output rather than the source, which means they catch
 * whole classes of mistake regardless of cause: a brochure filename typed
 * wrongly, a page renamed while something still links to it, an image added
 * without a description.
 *
 * They are deliberately written without any testing library or HTML parser, so
 * there is nothing extra to install and nothing to go out of date.
 *
 * Run `npm run build` first, or just use `npm run verify`, which does both.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : path;
  });
}

let pages = [];

before(() => {
  assert.ok(
    existsSync(DIST),
    'No dist/ folder found. Run `npm run build` before the tests, or use `npm run verify`.',
  );
  pages = walk(DIST)
    .filter((path) => path.endsWith('.html'))
    .map((path) => ({ path, url: '/' + relative(DIST, path), html: readFileSync(path, 'utf8') }))
    // The CMS login page is copied straight from public/ and is not part of the
    // site: it has no content of its own, and its markup comes from Sveltia. The
    // rules below are about the pages we actually build.
    .filter((page) => !page.url.startsWith('/admin/'));
  assert.ok(pages.length > 0, 'The build produced no HTML pages.');
});

const attr = (tag, name) => tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
const tags = (html, name) => html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) ?? [];

describe('every page is structurally sound', () => {
  test('declares its language', () => {
    // Screen readers use this to choose a pronunciation.
    for (const page of pages) {
      assert.match(page.html, /<html[^>]+lang=["'][a-z-]+["']/i, `${page.url} has no lang attribute`);
    }
  });

  test('has a title and a description', () => {
    for (const page of pages) {
      const title = page.html.match(/<title>([^<]*)<\/title>/i)?.[1];
      assert.ok(title?.trim(), `${page.url} has no <title>`);

      const description = tags(page.html, 'meta')
        .filter((tag) => attr(tag, 'name') === 'description')
        .map((tag) => attr(tag, 'content'))[0];
      assert.ok(description?.trim(), `${page.url} has no meta description`);
    }
  });

  test('has exactly one top-level heading', () => {
    // More than one h1, or none, makes a page hard to navigate with a screen
    // reader and muddles the document outline.
    for (const page of pages) {
      const count = (page.html.match(/<h1\b/gi) ?? []).length;
      assert.equal(count, 1, `${page.url} has ${count} <h1> elements, expected exactly 1`);
    }
  });

  test('has a canonical URL', () => {
    for (const page of pages) {
      const canonical = tags(page.html, 'link').some((tag) => attr(tag, 'rel') === 'canonical');
      assert.ok(canonical, `${page.url} has no canonical link`);
    }
  });
});

describe('accessibility basics', () => {
  test('every image has an alt attribute', () => {
    // An empty alt is fine — it means "decorative, skip me". A missing one is
    // not: a screen reader will read out the filename instead.
    for (const page of pages) {
      for (const tag of tags(page.html, 'img')) {
        // `alt=""` is serialised as a bare `alt` attribute, which is valid HTML.
        assert.ok(/\salt(?=[\s>=])/i.test(tag), `${page.url} has an <img> with no alt attribute:\n  ${tag}`);
      }
    }
  });

  test('every page offers a skip link to the content', () => {
    for (const page of pages) {
      assert.match(page.html, /class="skip-link"/, `${page.url} has no skip link`);
    }
  });
});

describe('links and files resolve', () => {
  test('internal links point at something that exists', () => {
    // Catches renamed pages, and brochure filenames typed wrongly — which the
    // content schema cannot check, because it cannot see the public/ folder.
    const broken = [];

    for (const page of pages) {
      const hrefs = tags(page.html, 'a')
        .map((tag) => attr(tag, 'href'))
        .filter((href) => href?.startsWith('/'));

      for (const href of hrefs) {
        const path = decodeURIComponent(href.split('#')[0].split('?')[0]);
        if (path === '/') continue;

        const target = join(DIST, path);
        const exists =
          (existsSync(target) && statSync(target).isFile()) ||
          existsSync(join(target, 'index.html')) ||
          existsSync(`${target}.html`);

        if (!exists) broken.push(`${page.url} → ${href}`);
      }
    }

    assert.deepEqual(broken, [], `Broken internal links:\n  ${broken.join('\n  ')}`);
  });

  test('links to other websites are safe', () => {
    // rel="noopener" stops the opened page getting a handle back to ours.
    const unsafe = [];

    for (const page of pages) {
      for (const tag of tags(page.html, 'a')) {
        const href = attr(tag, 'href') ?? '';
        if (!/^https?:\/\//i.test(href)) continue;
        if (!/noopener/i.test(attr(tag, 'rel') ?? '')) unsafe.push(`${page.url} → ${href}`);
      }
    }

    assert.deepEqual(unsafe, [], `External links missing rel="noopener":\n  ${unsafe.join('\n  ')}`);
  });
});

describe('search engines and sharing', () => {
  test('a sitemap and robots.txt were produced', () => {
    assert.ok(existsSync(join(DIST, 'sitemap-index.xml')), 'No sitemap was generated');
    const robots = join(DIST, 'robots.txt');
    assert.ok(existsSync(robots), 'No robots.txt was generated');
    assert.match(readFileSync(robots, 'utf8'), /Sitemap: https?:\/\//, 'robots.txt has no sitemap address');
  });

  test('event pages carry structured data', () => {
    // This is what lets search engines show a concert with its date and venue.
    const eventPage = pages.find((page) => /^\/events\/[^/]+\/index\.html$/.test(page.url));
    assert.ok(eventPage, 'No event pages were built');
    assert.match(eventPage.html, /application\/ld\+json/, `${eventPage.url} has no structured data`);
    assert.match(
      eventPage.html,
      /"@type":\s*"(MusicEvent|EducationEvent|Event)"/,
      'Structured data is not an Event',
    );
  });
});
