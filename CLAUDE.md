# Rules for editing this repository

For **why** the site is built this way, read [ARCHITECTURE.md](ARCHITECTURE.md).
For **how** to do a specific job, read [docs/MAINTAINING.md](docs/MAINTAINING.md)
and [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md). This file is the short list
of rules that apply to _every_ change, whoever or whatever is making it.

---

## 1. No secret is ever committed to this repository

**This repository is public**, and it must stay public — GitHub Pages serves the
site from it (ADR-007). Anything committed here is readable by anyone, and stays
readable in the Git history after it is deleted. Removing a leaked secret means
rewriting history and rotating the secret, in that order.

So:

- **Never commit** an API key, a private key, a service account JSON file, an
  OAuth client secret, a personal access token, a password, or a session cookie.
- **Never commit** a `.env` file. `.gitignore` covers `.env`, `.env.*` and the
  usual names Google gives downloaded credential files — but treat that as a
  safety net that has already failed if it is doing anything, not as permission
  to keep secrets in the working directory.
- **If a secret is needed, it lives in the environment of whatever needs it** —
  the Apps Script's Script Properties, or the CMS worker's environment — and the
  document that describes that system says which properties to set.
- **If you find one committed, say so immediately.** Rotate it first, then clean
  the history. A secret in a public repository is compromised from the moment it
  is pushed, regardless of how quickly it was removed.

**A note on what does not count.** Stripe _payment links_, the site URL, the
society's own email address and a Google spreadsheet ID are not secrets — they
are public or semi-public identifiers, and treating them as secrets makes the
real rule harder to follow. The test in `tests/no-secrets.test.js` looks for the
shapes of real credentials, not for anything that merely looks configurable.

**The system is designed so that this rule is easy to keep.** As of ADR-012 the
membership form needs **no credentials at all** — Apps Script runs as the
society's own Google account. If you are about to introduce a credential, that is
a design decision worth arguing for in the relevant document first, not an
implementation detail.

## 2. Content and code both fail the build rather than the website

Content is validated in [`src/content.config.ts`](src/content.config.ts). If a
change is wrong, `npm run build` should stop with a message naming the file and
the field. **Prefer making a mistake impossible over documenting it.**

## 3. Run `npm run verify` before pushing

It runs formatting, type checking, the build and the tests. All four must pass.

## 4. Changes arrive by pull request

`main` is protected and deploys automatically on merge, so whatever is on `main`
is what the public sees. Work on a branch, open a pull request, and let the
Actions run finish.

## 5. Write for the next committee, not for other developers

Most people who edit this are not engineers, and they change every year.
Cleverness that makes the site harder to hand over is a regression, even when the
code is better. Comments should explain **why**, especially where the obvious
simplification is wrong — there are several places where it is.

## 6. Personal data does not live here

The membership list and anything else identifying a person belongs in the
society's own Google Drive, never in this repository. See
[docs/MEMBERSHIP_FORM.md](docs/MEMBERSHIP_FORM.md).
