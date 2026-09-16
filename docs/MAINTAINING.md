# Maintaining the site

For changing how the site _looks or works_. For changing what it _says_, see
[CONTENT_GUIDE.md](CONTENT_GUIDE.md) — that needs no software at all.

---

## Getting set up

You need [Node.js](https://nodejs.org/) **22.18 or newer** (`.nvmrc` pins the
version this was tested with; `nvm use` picks it up).

That exact minimum matters: the tests import TypeScript files directly, which
relies on Node running `.ts` without a build step — available from 22.18 onwards.

### Installing Node

**Do not use `sudo apt install nodejs`.** Ubuntu 24.04 ships Node 18, which is
below the minimum above. It installs perfectly happily and then fails on
`npm test` with a confusing error about importing `.ts` files.

Use `nvm`, which needs no root access and reads `.nvmrc` for you:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.7/install.sh | bash
exec bash

cd /path/to/website
nvm install     # reads .nvmrc
nvm use
```

After that, `nvm use` in this directory always selects the right version — which
matters as Astro's Node requirements move over the years.

```bash
git clone https://github.com/<the-society-org>/website.git
cd website
npm install
npm run dev          # http://localhost:4321
```

**The dev server runs in the background.** From Astro 7 it detaches rather than
holding your terminal, so `Ctrl+C` will not stop it:

```bash
npx astro dev logs     # watch its output
npx astro dev status    # is it running?
npx astro dev stop      # stop it
```

**`npm run dev` is not an exact preview.** Anything marked `draft: true` is
visible there but stripped from the real build. To see precisely what visitors
get — drafts excluded, images optimised, sitemap generated — build and serve the
real output instead:

```bash
npm run build
npm run preview
```

Use that whenever you are checking something subtle.

Before pushing anything:

```bash
npm run verify       # formatting, types, content, build, tests
```

That runs exactly what CI runs. If it passes locally it will pass on GitHub.

---

## Where things are

| I want to change...                             | Edit                                               |
| ----------------------------------------------- | -------------------------------------------------- |
| Colours, fonts, spacing                         | `src/styles/global.css` — the tokens at the top    |
| Society name, contact, navigation, social links | `src/site.config.ts`                               |
| What fields an event or artist has              | `src/content.config.ts` — **read the notes first** |
| The homepage                                    | `src/pages/index.astro`                            |
| An event page's layout                          | `src/pages/events/[...slug].astro`                 |
| How events are sorted or filtered               | `src/lib/events.ts`                                |
| Date formatting                                 | `src/lib/datetime.ts`                              |
| Page titles, social preview tags                | `src/layouts/BaseLayout.astro`                     |
| Security headers                                | `public/_headers`                                  |

### Restyling without touching templates

Nearly all the visual design comes from custom properties at the top of
`src/styles/global.css`. Changing `--accent`, `--font-display` or the type scale
restyles the whole site.

**If you change a colour, check its contrast** against the background at
<https://webaim.org/resources/contrastchecker/>. Aim for at least 4.5:1 for text.
The current values and their measured ratios are recorded in that file — please
keep those comments accurate.

---

## Adding a field to events or artists

Three places, in this order:

1. **`src/content.config.ts`** — add it to the schema. Make it `.optional()`, or
   give it a `.default()`, unless you intend to update every existing content
   file at once. A new required field breaks every file that lacks it.
2. **`public/admin/config.yml`** — add the matching field, if the CMS is in use.
   If these two drift apart, the CMS will cheerfully save content that then
   fails to build.
3. **The template** that should display it.

Then `npm run verify`.

### Should it be a new content type?

Almost certainly not. Concerts and workshops are one collection with a `type`
field, and a new kind of event is usually **one more value in `EVENT_TYPES`**,
not a new collection. ADR-003 explains why, and the reasoning applies to most
things you might be tempted to split out.

---

## The checks, and why they exist

`npm run verify` runs four things:

| Check          | Catches                                                       |
| -------------- | ------------------------------------------------------------- |
| `format:check` | Inconsistent formatting. `npm run format` fixes it            |
| `check`        | Type errors, **and every content file against the schema**    |
| `build`        | Anything that stops the site being built                      |
| `test`         | Broken links, missing alt text, heading and metadata problems |

The tests in `tests/` are deliberately unusual: they run against the **built
site** in `dist/`, not the source. That means they catch mistakes regardless of
cause — a brochure filename typed wrongly, a page renamed while something still
links to it — including things the schema cannot see, because it has no
knowledge of the `public/` folder.

They use Node's built-in test runner, so there is nothing extra installed and
nothing to go out of date.

**If a check is failing, fix the cause rather than the check.** Each one exists
because the failure it catches would otherwise reach the public site, where a
committee that did not write the code would have to diagnose it.

---

## Keeping dependencies up to date

Dependabot opens one grouped pull request a month.

**To handle one:** check the Checks tick is green, then merge. If the tick is
red, the release notes linked in the pull request usually say what changed.

There are no preview deployments on GitHub Pages (ADR-007), so for a dependency
bump that touches how the site is built — an Astro major version, say — it is
worth pulling the branch and running `npm run dev` before merging. For a routine
patch bump, the green tick is enough.

Security updates arrive separately and immediately. Merge those promptly.

### Astro major versions

Astro releases major versions fairly often, and a site left for a year or two
will be several behind. Two things to keep in mind:

- **This is not urgent.** A static site keeps serving whatever was last built,
  regardless of what npm does. An out-of-date toolchain is a maintenance task,
  not an outage.
- **Upgrade one major at a time**, following Astro's upgrade guide, on a branch:

  ```bash
  git switch -c upgrade-astro
  npx @astrojs/upgrade
  npm run verify
  ```

  Open a pull request, check the preview, merge. If it turns into a fight, it is
  entirely reasonable to leave it for someone with more time — the site is not
  at risk in the meantime.

---

## Adding a page

Create a file in `src/pages/`. The filename becomes the address:
`src/pages/join.astro` serves `/join`.

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Join us" description="How to join the society.">
  <div class="container">
    <h1>Join us</h1>
    <p>…</p>
  </div>
</BaseLayout>
```

`BaseLayout` handles the page title, social preview tags, canonical URL, header
and footer. To add it to the navigation, add it to `nav` in `src/site.config.ts`.

If the page is mostly prose that a committee member should be able to edit, put
the text in `src/content/pages/` instead and render it like `about.astro` does.

---

## Things to be careful about

**Query strings cannot work.** `Astro.url.searchParams` is always empty in a
static build, because there is no server to read a URL. Anything that looks like
`?type=concert` must instead become a real page generated by `getStaticPaths`.
An earlier draft of the events page got this wrong, and it fails silently — the
filter simply never matches.

**Do not rename content files that are already published.** The filename is the
web address. Renaming breaks links people have shared, and — for artists — breaks
the events that refer to them.

**Do not remove the focus outline.** The `:focus-visible` rule in `global.css` is
how keyboard users see where they are. It is not decoration.

**Do not add a dependency without a reason you could defend to the next
committee.** Each one is a future upgrade and another thing to understand
(ADR-009).

**Do not put a secret in this repository.** It is public, and Git remembers
everything. The only secret in the whole system is the CMS OAuth secret, which
lives in the authentication worker's settings.

**If you add JavaScript, a web font or an embed**, update the content security
policy in `public/_headers`, or the browser will block it silently.

---

## A note on what this codebase is for

The people maintaining this site after you will mostly not be programmers. A
change that makes the code more elegant but the site harder to hand over is a
step backwards.

The bias throughout is towards **fewer moving parts and louder failures**: it is
better for a mistake to stop the build with a clear message than to be handled
gracefully and appear quietly on the live site. Please keep that bias.
