# CUICM website

The website of the **Cambridge University Indian Classical Music Society**.

It is a static site: a set of ordinary web pages built from text files kept in
this repository. There is no server and no database, which is why it costs
almost nothing to run and cannot fall over in the middle of the night.

---

## Start here

**You want to add or change a concert, workshop, artist or page**
→ [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md). No coding, and no software to
install.

**You have just joined the committee and taken over the website**
→ [docs/HANDOVER.md](docs/HANDOVER.md). Read this first — it covers the accounts
the society needs to control, which matters far more than the code.

**You want to change how the site looks or behaves**
→ [docs/MAINTAINING.md](docs/MAINTAINING.md), then
[ARCHITECTURE.md](ARCHITECTURE.md).

**You want to know why it is built this way**
→ [ARCHITECTURE.md](ARCHITECTURE.md). Every significant decision is recorded
there with its reasoning and the alternatives that were rejected.

| Document                                       | What it covers                                           |
| ---------------------------------------------- | -------------------------------------------------------- |
| [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md) | Adding events, artists, photographs and PDFs             |
| [docs/MAINTAINING.md](docs/MAINTAINING.md)     | Running the site locally, making code changes, upgrading |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)       | Hosting, domain, deploys, setting up the CMS             |
| [docs/TICKETING.md](docs/TICKETING.md)         | How ticketing works and how to change provider           |
| [docs/TERMS.md](docs/TERMS.md)                 | Ticket and membership terms and conditions               |
| [docs/HANDOVER.md](docs/HANDOVER.md)           | Accounts, access and the annual handover checklist       |
| [ARCHITECTURE.md](ARCHITECTURE.md)             | Why the site is built the way it is                      |

---

## How it works, in one minute

1. Every concert, workshop and artist is a **text file** in `src/content/`.
2. Changing one of those files and merging it to the `main` branch **rebuilds and
   republishes the site automatically**, usually within a minute or two.
3. Before anything is published, the change is **checked automatically**. If a
   date is malformed, a photograph has no description, or a link points at
   something that does not exist, the check fails and says so. **A broken site
   cannot be published.**

That third point is the heart of the design. Most of this site's structure exists
to make mistakes loud and early, because the people maintaining it change every
year and are not necessarily programmers.

---

## Running it on your own computer

Only needed for changing how the site _looks or works_. Content changes do not
require any of this.

You need [Node.js](https://nodejs.org/) version 22.18 or newer (`.nvmrc` pins the
version this was tested with; `nvm use` picks it up).

```bash
npm install      # once, to fetch the tools
npm run dev      # start a local preview at http://localhost:4321
```

| Command           | What it does                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `npm run dev`     | Local preview that updates as you edit (runs in the background — stop with `npx astro dev stop`) |
| `npm run build`   | Build the finished site into `dist/`                                                             |
| `npm run preview` | Serve the built site, to check it before publishing                                              |
| `npm run verify`  | **Run every check.** Do this before pushing                                                      |
| `npm run format`  | Tidy up code formatting                                                                          |

`npm run verify` runs exactly what the automated checks run, so if it passes on
your machine it will pass on GitHub.

Note that `npm run dev` shows draft content, which the real build strips. To see
exactly what visitors get, use `npm run build && npm run preview`.

---

## What is in this repository

```
src/
  content/          Everything the site publishes — edit these
    events/           Concerts, workshops and other events (one file each)
    artists/          Performers and teachers (one file each)
    pages/            Ordinary pages such as "About"
    committee.yml     The current committee
  content.config.ts THE IMPORTANT FILE — the rules every content file must follow
  pages/            One file per page or type of page on the site
  components/       Reusable pieces (event card, header, footer)
  layouts/          The shell every page sits inside
  lib/              Shared logic: dates, loading and sorting events
  styles/global.css The design system — colours, type and spacing
  assets/images/    Photographs, resized automatically when the site is built
  site.config.ts    Society name, contact address, navigation, social links
public/
  brochures/        PDF programmes (served exactly as they are)
  admin/            Content management system configuration
  _headers          Security headers
tests/              Automated checks run against the built site
docs/               The guides listed above
```

If you read only one file to understand this project, read
[`src/content.config.ts`](src/content.config.ts). It defines everything the site
knows about, and it is written to be read.

---

## Before the site goes live

Everything below ships with placeholder content. Work through this once, and the
site is genuinely the society's.

**1. Delete the sample content.** Every sample file is named `sample-`:

```bash
rm src/content/events/sample-*.md src/content/artists/sample-*.md
rm public/brochures/sample-programme.pdf src/assets/images/placeholder-*.png
```

**2. Replace the placeholder values:**

| File                         | What to change                                                             |
| ---------------------------- | -------------------------------------------------------------------------- |
| `src/site.config.ts`         | The Instagram and Facebook links (the society email is already set)        |
| `src/content/committee.yml`  | The three `A. N. Example` entries                                          |
| `src/content/pages/about.md` | Placeholder text — rewrite in the society's own words                      |
| `src/content/membership/`    | `joinUrl` — add the payment link once it exists; check the price and dates |
| `astro.config.mjs`           | `site:` → the real domain, once registered                                 |
| `public/admin/config.yml`    | `repo:` and `base_url:` — only if the CMS is being set up                  |

**3. Decisions that are genuinely open** — section 5 of
[ARCHITECTURE.md](ARCHITECTURE.md) gives the reasoning behind each:

- [ ] Which **society** bank account receives ticket income — confirm the existing
      Lloyds account is held by the society with two signatories, not by an
      individual
- [ ] Domain name
- [ ] Whether to set up the CMS at all
- [ ] Whether to turn on analytics

**4. Accounts.** Work through the checklist in
[docs/HANDOVER.md](docs/HANDOVER.md). It matters more to the site's survival than
anything in the code.

Then run `npm run verify` — it will tell you if anything is inconsistent.
