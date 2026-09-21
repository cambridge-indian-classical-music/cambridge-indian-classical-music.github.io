/**
 * Tests for the membership joining form.
 *
 * The form validates what somebody types in TWICE — once in the browser, as a
 * courtesy, and once in the Apps Script, as the actual control. The two sets of
 * rules live in different files, in different languages, and are maintained by
 * different people at different times. That is the single most likely thing here
 * to go quietly wrong: somebody widens the browser rule to let a college address
 * through, the script keeps rejecting it, and applicants get an error they
 * cannot act on.
 *
 * So these tests compare the two directly, as text, and then check the rules
 * actually do what they are supposed to. Written without any testing library or
 * parser, like the rest of tests/ — there is nothing to install.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/pages/membership/join.astro', import.meta.url), 'utf8');
const script = readFileSync(new URL('../scripts/membership-form/Code.gs', import.meta.url), 'utf8');

/** Pull `const NAME = '...'` out of the Astro page. */
function pagePattern(name) {
  const match = page.match(new RegExp(`const ${name} =\\s*'([^']+)'`));
  assert.ok(match, `${name} is no longer defined in join.astro — did it get renamed?`);
  return match[1];
}

/** Pull `var NAME = /.../flags;` out of the Apps Script. */
function scriptPattern(name) {
  const match = script.match(new RegExp(`var ${name} = /(.+)/([a-z]*);`));
  assert.ok(match, `${name} is no longer defined in Code.gs — did it get renamed?`);
  return { source: match[1], regex: new RegExp(match[1], match[2]) };
}

describe('the browser and the script agree', () => {
  /*
   * An HTML `pattern` attribute is implicitly anchored at both ends, so the
   * equivalent regular expression is the pattern wrapped in ^ and $.
   */
  const pairs = [
    ['UNIVERSITY_EMAIL_PATTERN', 'UNIVERSITY_EMAIL'],
    ['ALUMNI_EMAIL_PATTERN', 'ALUMNI_EMAIL'],
    ['CRSID_PATTERN', 'CRSID'],
  ];

  for (const [inPage, inScript] of pairs) {
    test(`${inPage} matches ${inScript}`, () => {
      /* The page escapes backslashes for the TypeScript string literal. */
      const browser = pagePattern(inPage).replaceAll('\\\\', '\\');
      assert.equal(
        `^${browser}$`,
        scriptPattern(inScript).source,
        `The rule in join.astro and the rule in Code.gs have drifted apart. ` +
          `Change both, or applicants see an error the form told them was fine.`,
      );
    });
  }
});

describe('University email addresses', () => {
  const { regex } = scriptPattern('UNIVERSITY_EMAIL');

  test('accepts a plain cam.ac.uk address', () => {
    assert.ok(regex.test('abc12@cam.ac.uk'));
  });

  /* Most students have one of these, so rejecting them rejects most students. */
  test('accepts college and department subdomains', () => {
    assert.ok(regex.test('abc12@trin.cam.ac.uk'));
    assert.ok(regex.test('abc12@maths.cam.ac.uk'));
    assert.ok(regex.test('abc12@srcf.ucam.cam.ac.uk'));
  });

  test('rejects a domain that merely contains cam.ac.uk', () => {
    assert.equal(regex.test('abc12@cam.ac.uk.example.com'), false);
    assert.equal(regex.test('abc12@notcam.ac.uk'), false);
  });

  test('rejects an alumni address', () => {
    assert.equal(regex.test('abc12@cantab.net'), false);
  });
});

describe('alumni email addresses', () => {
  const { regex } = scriptPattern('ALUMNI_EMAIL');

  test('accepts both alumni domains', () => {
    assert.ok(regex.test('abc12@cantab.net'));
    assert.ok(regex.test('abc12@cantab.ac.uk'));
  });

  test('rejects a lookalike domain', () => {
    assert.equal(regex.test('abc12@cantab.net.example.com'), false);
    assert.equal(regex.test('abc12@cantab.com'), false);
  });
});

describe('CRSids', () => {
  const { regex } = scriptPattern('CRSID');

  test('accepts the usual shapes', () => {
    assert.ok(regex.test('ab123'));
    assert.ok(regex.test('abc12'));
    assert.ok(regex.test('abcd1234'));
  });

  test('rejects things that are not CRSids', () => {
    assert.equal(regex.test('abc12@cam.ac.uk'), false, 'a whole email address');
    assert.equal(regex.test('12345'), false, 'no letters');
    assert.equal(regex.test('abcde12'), false, 'too many letters');
    assert.equal(regex.test(''), false, 'empty');
  });
});

describe('the rate is decided by the script, not the form', () => {
  /*
   * This is the one rule that costs money if it is got wrong, and the one a
   * future maintainer is most likely to "simplify" by trusting a hidden field.
   * Anyone can post whatever they like to the endpoint, so if the tier ever
   * comes from the request rather than from the answers, everybody pays £12.
   */
  test('the script never reads a tier from the submission', () => {
    assert.equal(
      /params\.tier|params\[['"]tier['"]\]/.test(script),
      false,
      'Code.gs is reading the rate from the request. It must work it out from ' +
        'the answers instead — see the comment on application.tier.',
    );
  });

  test('the script works the tier out from the answers', () => {
    assert.match(
      script,
      /application\.tier =[\s\S]{0,200}cambridgeStatus === 'student'/,
      'The rule that decides who pays the student rate has moved or changed.',
    );
  });
});

describe('no secrets in the repository', () => {
  /*
   * This repository is public (ADR-007). A Stripe payment link pasted in here
   * is not a catastrophe — they are meant to be shared — but a spreadsheet ID
   * or an API key would be, and the habit is what matters.
   */
  test('Code.gs holds no Stripe links or keys', () => {
    assert.equal(/buy\.stripe\.com/.test(script), false, 'A Stripe link is hardcoded in Code.gs.');
    assert.equal(/sk_(live|test)_/.test(script), false, 'A Stripe secret key is in Code.gs.');
    assert.equal(
      /docs\.google\.com\/spreadsheets\/d\//.test(script),
      false,
      'A spreadsheet URL is hardcoded in Code.gs — it belongs in Script Properties.',
    );
  });

  test('every configurable value is read from Script Properties', () => {
    for (const key of ['SPREADSHEET_ID', 'STRIPE_LINK_STUDENT', 'STRIPE_LINK_GENERAL', 'SITE_URL']) {
      assert.match(script, new RegExp(`'${key}'`), `${key} is no longer a Script Property.`);
    }
  });
});
