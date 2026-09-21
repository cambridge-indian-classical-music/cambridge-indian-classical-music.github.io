/**
 * Nothing that looks like a credential may be committed.
 *
 * This repository is public and must stay public — the site is served from it
 * (ADR-007). A secret pushed here is compromised the moment it lands, and stays
 * readable in the history after it is deleted. Rule 1 of CLAUDE.md says so; this
 * is what stops the rule depending on everybody remembering it.
 *
 * It scans **tracked files only**, because that is exactly the set that is
 * published. An untracked credentials file sitting in the working directory is
 * somebody else's problem — `.gitignore` covers the usual names.
 *
 * The patterns are built by joining fragments, so that this file does not match
 * itself. Do not rewrite them as plain literals.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

/** Everything Git is tracking — the published set. */
function trackedFiles() {
  return execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean);
}

/*
 * Shapes of real credentials. Each is deliberately specific: a rule that cries
 * wolf gets switched off, and a switched-off rule protects nothing.
 */
const SIGNATURES = [
  { name: 'Stripe secret key', pattern: new RegExp(['sk', 'live', ''].join('_') + '[A-Za-z0-9]{8}') },
  { name: 'Stripe test secret key', pattern: new RegExp(['sk', 'test', ''].join('_') + '[A-Za-z0-9]{8}') },
  { name: 'Stripe restricted key', pattern: new RegExp(['rk', 'live', ''].join('_') + '[A-Za-z0-9]{8}') },
  { name: 'PEM private key', pattern: new RegExp(['-----BEGIN', 'PRIVATE', 'KEY-----'].join(' ')) },
  { name: 'RSA private key', pattern: new RegExp(['-----BEGIN', 'RSA', 'PRIVATE'].join(' ')) },
  { name: 'GCP service account key', pattern: new RegExp('"' + ['private', 'key'].join('_') + '"\\s*:') },
  { name: 'Google API key', pattern: new RegExp('AIza' + '[A-Za-z0-9_-]{30}') },
  { name: 'GitHub personal access token', pattern: new RegExp(['ghp', ''].join('_') + '[A-Za-z0-9]{30}') },
  {
    name: 'GitHub fine-grained token',
    pattern: new RegExp(['github', 'pat', ''].join('_') + '[A-Za-z0-9_]{20}'),
  },
  { name: 'AWS access key id', pattern: new RegExp('AKIA' + '[A-Z0-9]{16}') },
  { name: 'Slack token', pattern: new RegExp('xox[baprs]' + '-[A-Za-z0-9-]{10}') },
  { name: 'OpenAI-style key', pattern: new RegExp(['sk', 'proj', ''].join('-') + '[A-Za-z0-9_-]{20}') },
];

/* Binary and generated files: nothing to read, and no secrets to find. */
const SKIP_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.ico',
  '.svg',
  '.pdf',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.zip',
  '.mp3',
  '.mp4',
]);

/** This file holds the patterns, so scanning it would always fail. */
const SELF = 'tests/no-secrets.test.js';

/*
 * Synthetic examples, assembled the same way the patterns are so that this file
 * still does not match itself. None of these is a real credential.
 */
const EXAMPLES = {
  'Stripe secret key': ['sk', 'live', 'AbCdEfGh12345678'].join('_'),
  'Stripe test secret key': ['sk', 'test', 'AbCdEfGh12345678'].join('_'),
  'Stripe restricted key': ['rk', 'live', 'AbCdEfGh12345678'].join('_'),
  'PEM private key': ['-----BEGIN', 'PRIVATE', 'KEY-----'].join(' '),
  'RSA private key': ['-----BEGIN', 'RSA', 'PRIVATE', 'KEY-----'].join(' '),
  'GCP service account key': '"' + ['private', 'key'].join('_') + '": "abc"',
  'Google API key': 'AIza' + 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5',
  'GitHub personal access token': ['ghp', 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5'].join('_'),
  'GitHub fine-grained token': ['github', 'pat', 'A1b2C3d4E5f6G7h8I9j0K1'].join('_'),
  'AWS access key id': 'AKIA' + 'ABCDEFGHIJKLMNOP',
  'Slack token': 'xoxb' + '-A1b2C3d4E5f6G7',
  'OpenAI-style key': ['sk', 'proj', 'A1b2C3d4E5f6G7h8I9j0K1'].join('-'),
};

describe('the scanner actually detects things', () => {
  /*
   * A pattern that matches nothing passes every scan silently, which is the one
   * way this whole file could be worthless while looking green. So each pattern
   * is made to prove it fires on something shaped like the thing it hunts.
   */
  for (const { name, pattern } of SIGNATURES) {
    test(`the ${name} pattern matches an example`, () => {
      const example = EXAMPLES[name];
      assert.ok(example, `No example defined for "${name}" — add one, or the pattern is untested.`);
      assert.ok(
        pattern.test(example),
        `The ${name} pattern did not match its own example. It would never catch a real one either.`,
      );
    });
  }

  test('every pattern has an example', () => {
    assert.deepEqual(
      SIGNATURES.map((s) => s.name).filter((name) => !EXAMPLES[name]),
      [],
      'A pattern was added without an example, so nothing proves it works.',
    );
  });

  test('ordinary repository content is not flagged', () => {
    /* Things that legitimately appear here and must never trip the scan. */
    const innocent = [
      'https://buy.stripe.com/test_abc123',
      'https://script.google.com/macros/s/AKfycbXXXXXXXXXXXX/exec',
      'indianclassicalmusic@cambridgesu.co.uk',
      'client_reference_id=CUICM-2627-ABC123',
      'SPREADSHEET_ID',
    ].join('\n');

    for (const { name, pattern } of SIGNATURES) {
      assert.equal(pattern.test(innocent), false, `${name} false-positives on ordinary content.`);
    }
  });
});

describe('no credentials are committed', () => {
  const files = trackedFiles().filter(
    (file) => file !== SELF && !SKIP_EXTENSIONS.has(extname(file).toLowerCase()),
  );

  test('there is something to scan', () => {
    /*
     * If `git ls-files` returns nothing — run outside a checkout, say — every
     * other test here would pass by scanning an empty list. This is the guard
     * against a green run that checked nothing at all.
     */
    assert.ok(files.length > 10, `Only ${files.length} tracked files found. Is this a Git checkout?`);
  });

  for (const { name, pattern } of SIGNATURES) {
    test(`no ${name}`, () => {
      const hits = [];

      for (const file of files) {
        /* A very large tracked file is not where a key hides; skip the read. */
        if (statSync(new URL(file, new URL('..', import.meta.url))).size > 2_000_000) continue;

        let contents;
        try {
          contents = readFileSync(new URL(file, new URL('..', import.meta.url)), 'utf8');
        } catch {
          continue; /* unreadable or not text */
        }

        if (pattern.test(contents)) hits.push(file);
      }

      assert.deepEqual(
        hits,
        [],
        `Found something shaped like a ${name} in: ${hits.join(', ')}.\n\n` +
          'This repository is PUBLIC. Treat the value as compromised: rotate it first, ' +
          'then remove it from the history — in that order. See rule 1 of CLAUDE.md.',
      );
    });
  }
});
