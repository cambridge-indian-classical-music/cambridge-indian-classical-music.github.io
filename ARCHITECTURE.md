# Architecture

This document records **why** the website is built the way it is. It is aimed at a
future developer (or a technically-curious committee member) who needs to change
something significant and wants to know what will break.

For _how to do things_, see [docs/MAINTAINING.md](docs/MAINTAINING.md) and
[docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md).

---

## 1. The forces shaping this design

The society is not a software company. The constraints that actually matter here
are organisational, not technical:

| Constraint                               | Consequence for the architecture                                                                                |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **The committee turns over every year.** | Nothing may depend on one person's knowledge or accounts. Setup steps must be written down, not remembered.     |
| **Most maintainers are not engineers.**  | Editing content must not require reading code. Mistakes must fail loudly and early, not silently in production. |
| **Budget is roughly zero.**              | Hosting must be free or a few pounds a year, with no bill-shock risk.                                           |
| **The site must outlive us.**            | Prefer boring, portable formats. Minimise the number of services that can die or start charging.                |
| **Nobody is on call.**                   | No servers, no databases, no background jobs, no runtime that can fall over at 2am.                             |

Every decision below is downstream of that table. When in doubt, the tie-breaker
was _"which option is easier to hand over?"_ rather than _"which is more capable?"_

---

## 2. Decisions

### ADR-001 — Static site generation, no server

**Decision:** The site is generated entirely at build time and served as static
files. `output: 'static'` in `astro.config.mjs`, with no server adapter.

**Why:** Nothing on this site needs a server. Ticketing is delegated to an
external provider (ADR-006), there are no user accounts, no comments and no
search-at-scale. Static output means:

- the hosting bill is ~£0 and cannot spike;
- there is no runtime to patch, exploit or restart — the security surface is the
  build pipeline and the hosting account, not a live process;
- the site keeps working even if every service we depend on has an outage,
  because it is just files on a CDN;
- page loads are fast by default, which matters because a good share of traffic
  is students on phones checking a venue while walking to a concert.

**Rejected:** Server-side rendering. It would buy us nothing today and would add
a runtime, a deploy target with more moving parts, and a class of failure the
committee cannot debug.

**Reversibility:** High, but it now costs a host. Adding an Astro server adapter
and marking a single page `export const prerender = false` converts one route to
dynamic without touching anything else — however, **GitHub Pages serves static
files only** (ADR-007), so the first dynamic route means moving hosting, most
obviously back to Cloudflare Pages with `@astrojs/cloudflare`. Still a
configuration change rather than a rewrite. We are not painting ourselves into a
corner; we are declining to pay for a room we do not use.

---

### ADR-002 — Astro as the site framework

**Decision:** Astro 7, TypeScript, with content stored as Markdown + YAML
frontmatter in Astro **content collections**.

**Why Astro over the alternatives:**

The deciding factor was not performance or developer fashion. It was **schema
validation of content**. Astro content collections validate every content file
against a Zod schema at build time. If a committee member writes
`date: 14th March` instead of a real date, or references an artist who does not
exist, or forgets alt text on a photograph, **the build fails with a readable
error naming the file and the field**. The mistake is caught before it reaches
the public site, and the error message is aimed at a human.

For a project whose maintainers are not engineers, that safety net is worth more
than every other feature under consideration. It converts a whole category of
silent content bugs into loud, early, self-explaining failures.

Secondary reasons: Astro ships zero JavaScript to the browser by default (good
for speed and accessibility), `.astro` components are close enough to plain HTML
that a non-specialist can follow them, and image optimisation and sitemaps are
first-party rather than bolted on.

**Alternatives considered:**

- **Next.js — rejected.** It is an application framework being used as a
  brochure-site generator. React, hydration, the App Router's server/client
  distinction and its Vercel-shaped defaults are all complexity we would pay for
  and never use. It would also make the codebase harder for a future volunteer to
  pick up.
- **Plain HTML/CSS/JS — rejected, though tempting.** It is maximally durable and
  has no dependencies to rot. It fails on the requirement that actually matters:
  adding one concert would mean hand-editing the listing page, a new detail page,
  the homepage and the sitemap, keeping four copies of the same facts in sync. The
  first committee member to forget one leaves a wrong date on the site. There
  would also be no schema, so nothing would ever catch a mistake. Single source of
  truth beats zero dependencies here.
- **Eleventy — a close second.** Genuinely stable with a small dependency
  footprint, and slower-moving than Astro, which is a real advantage for a
  long-lived site. Rejected because it has no built-in content schema validation
  (the whole reason we chose Astro), a weaker TypeScript story, and no first-party
  image pipeline. If Astro ever becomes a burden, Eleventy is the migration
  target — our content is portable Markdown, so the content survives intact.
- **Hugo — rejected, but respected.** A single Go binary with no npm supply chain
  and exceptional version stability: on pure longevity it beats everything here.
  Rejected because Go templating is genuinely unfriendly to a newcomer, and
  because we judged that "content errors fail the build with a clear message"
  helps this society more than "the toolchain never changes".

**The honest cost of choosing Astro:** major versions arrive quickly — v5 in
December 2024, v6 in March 2026, v7 in June 2026. A site left untouched for two
years will be several majors behind. Mitigations, in order of importance:

1. **A static site does not rot in production.** Once built and deployed, it
   keeps serving regardless of what npm does. An out-of-date toolchain is a
   maintenance problem, not an outage.
2. Dependencies are deliberately few (see ADR-009), so upgrades are small.
3. `docs/MAINTAINING.md` documents the upgrade procedure, and CI proves whether
   an upgrade worked before it is merged.

---

### ADR-003 — One `events` collection with a `type` field, not separate Event and Workshop types

**Decision:** Concerts, workshops and other society events are **one content
collection**, distinguished by a `type` field (`concert`, `workshop`, `social`,
`other`). Artists are a **separate collection**, referenced by events.

**Why:** This was the most consequential modelling question, and the brief
explicitly asked us to think about it.

Concerts and workshops overlap almost entirely: title, date, time, venue,
description, people involved, images, brochure, booking link, status. That is
around ninety per cent of the fields. The genuine differences are a handful of
optional extras.

Modelling them separately would mean:

- every listing, calendar and "upcoming" query merging two differently-shaped
  arrays and re-sorting them — the same fiddly code repeated in several places,
  and the first thing to break when someone adds a third kind of event;
- two sets of pages, two URL spaces and two CMS sections to keep in step;
- duplicated schema that will inevitably drift.

With one collection, adding a "lecture-demonstration" event type later is
**adding one value to an enum**, not creating a collection, a page, a route and a
CMS section. The requirement for a combined events calendar becomes trivial
rather than a merge.

**Why artists are separate:** artists genuinely are a distinct thing. They recur
across many events, they have their own biography and photograph, and they will
eventually want their own pages. Storing an artist inline on each event would
mean re-typing a biography every time they perform, and the versions would
diverge. Events reference artists by ID, and Astro validates those references at
build time — **deleting an artist who is still booked fails the build** rather
than silently producing an empty performer list.

**Guarding against a mushy schema.** The risk of one shared collection is a
soup of optional fields. Two things prevent that:

- The schema _refines_ by type: a `concert` or a `workshop` must list at least
  one person, so neither can be published without its performers or its teacher.
  Type-appropriate rules are enforced even though the collection is shared.
- People are modelled uniformly as `people: [{ artist, role }]`, where `role` is
  free text — "Vocal", "Mridangam", "Workshop leader". This covers a concert's
  lead-plus-accompanists and a workshop's teacher with one mechanism, and it
  correctly captures that a workshop teacher _is_ an artist, with the same
  biography and photograph as when they perform.

**Two deliberate modelling choices worth knowing about:**

- **"Past" is not a status.** Whether an event is upcoming or past is _derived_
  from its date, every time the site builds. There is no checkbox to forget to
  tick. `status` is reserved for things the calendar cannot infer — `cancelled`,
  `postponed`, `sold-out`. This is the difference between a site that stays
  correct by itself and one that quietly goes stale.
- **Times are stored as full date-times and rendered in `Europe/London`.**
  Storing a date and a time as separate strings makes sorting and comparison
  fragile, and gets British Summer Time wrong twice a year. One timestamp,
  formatted explicitly for London, avoids both.

**Venues are inline, not a collection — for now.** A venues collection would
avoid re-typing the same college address, but it adds a third collection, another
relation widget and another concept to explain, to save a small amount of typing.
That is premature today. The trigger for revisiting is written down in
`docs/CONTENT_GUIDE.md`: if the same venue is being re-entered often enough that
details drift, promote it to a collection. Venue includes an `accessNotes` field,
because step-free access is something an audience needs to know before booking.

---

### ADR-004 — Content is Markdown files in Git, with no database

**Decision:** All content lives as Markdown and YAML in the repository. There is
no database and no external content API.

**Why:** The content is a few dozen events and artists that change a handful of
times a term. A database would add hosting cost, a backup obligation, an outage
mode and a migration burden, in exchange for nothing at this scale.

Keeping content in Git also gives the society properties it would otherwise have
to buy: full history of who changed what and when, review before publication,
trivial rollback of a bad edit, and a complete backup on every committee member's
laptop. If every hosting service we use disappeared tomorrow, the website's
entire content would still exist in a folder of readable text files.

**When to revisit:** if content ever needs to change without a rebuild, or
non-committee members need to submit content directly, this decision is worth
re-examining. Neither is close.

---

### ADR-005 — CMS: a portable config, with Sveltia CMS as the recommended editor

**Decision:** Ship a **Decap-compatible CMS configuration** at
`public/admin/config.yml`, loaded by **Sveltia CMS**. The CMS is **optional and
inert until someone completes the authentication setup**, and the site is fully
maintainable without it.

**The insight this rests on:** Sveltia CMS and Decap CMS read the _same_
configuration file format. That makes the **config file — not the CMS — the
durable asset**. Switching between them is changing one `<script>` tag in
`public/admin/index.html`. Because the choice is nearly free to reverse, we can
pick the one with the better experience today without taking on lock-in.

**Why Sveltia over Decap as the default:** Decap CMS is still maintained but has
slowed to a maintenance pace. Sveltia is actively developed, has a markedly
better editing experience (particularly for image handling, which is where
non-technical editors struggle most), and a less painful authentication story.
Its risk is that it is pre-1.0 and small-team — which is precisely the risk the
shared config format neutralises. If Sveltia stalls, we change a script tag and
carry on with Decap, keeping our config and every content file.

**Why the CMS is optional rather than load-bearing:** it needs a GitHub OAuth
application and a small authentication worker to be deployed — the one genuinely
fiddly piece of setup in this project, described step by step in
`docs/DEPLOYMENT.md`. Making the site _depend_ on that would mean a committee
that has not finished the setup cannot update the site at all. Instead:

- **Editing content directly on GitHub always works**, needs no extra
  infrastructure, and is documented as the primary path in
  `docs/CONTENT_GUIDE.md`. For changing a date or a ticket link it is genuinely
  quicker than a CMS.
- The CMS is an upgrade for editors who want a friendlier interface, especially
  for uploading images.

Either way the result is identical: a commit in this repository, validated by the
same schema, deployed by the same pipeline. There is no second source of truth
and no lock-in — the CMS is a text editor with a nicer face.

**Security note:** `/admin` is not a security boundary. It is a static page
anyone can open. Authorisation is enforced entirely by GitHub: the CMS acts as
the logged-in user, and someone without write access to the repository cannot
change anything through it. Access control therefore means **GitHub repository
permissions**, not anything on this site.

**September 2026: the plan to gate `/admin` is withdrawn, not delivered.** The
agreed approach was Cloudflare Access, sequenced behind the custom domain. Moving
the site to GitHub Pages (ADR-007) removed the mechanism: **GitHub Pages serves
every file publicly and has no way to put a login in front of one path.** Nothing
equivalent is available without adding back a second host — which is the cost
ADR-007 has just chosen to avoid.

**So `/admin` is a public page, and that is acceptable.** It is the position the
paragraph above already describes and was always the fallback: the page is a
login screen, not a lock, and GitHub's repository permissions remain the only
thing deciding whose edits are accepted. Nobody gains any ability by loading it.

What is genuinely lost is defence in depth — a stranger can see that the society
uses a CMS, and can reach its sign-in form. That is a small, and largely
cosmetic, exposure. It is written down here rather than quietly dropped, because
a decision that gets reversed without a record is how a project acquires
mysteries.

**If a future committee wants the gate back**, the honest options are: move
hosting back to Cloudflare Pages and follow the original plan (ADR-007 explains
what else that would buy back), or stop publishing `/admin` altogether and edit
on GitHub, which costs nothing and is already the documented primary path. A
shared username and password remains rejected for the original reason — it would
be handed down through committees, never rotated when somebody left, and tell
you nothing about who used it.

---

### ADR-006 — Ticketing is a link, not a feature

**Decision:** The site never processes payments. An event carries an optional
`ticketUrl` plus a `ticketProvider` label and a human-readable `priceInfo`
string. Booking happens entirely on the provider's own domain.

**Why:** Handling payments would mean PCI obligations, refund handling, a
database of orders, and a legal and financial responsibility that rotates to a
new student every year. That is not a reasonable thing to hand over. Delegating
to Eventbrite, Stripe Checkout or the University's booking system moves all of it
to organisations equipped to carry it.

**Why three fields rather than only a URL:** the extra two cost nothing and are
what the page actually needs. `ticketProvider` lets the button say "Book on
Eventbrite" instead of a vague "Tickets", which measurably reduces the "is this
a scam link?" hesitation. `priceInfo` is free text — "£8 / £5 students",
"Free, no booking required" — because ticket pricing has more shapes than a
number, and the site only ever displays it.

Crucially, `ticketProvider` is **cosmetic**. No code branches on it. Switching
from Eventbrite to Stripe is editing a URL and a label on each event — no code
change, no migration, no redesign. See `docs/TICKETING.md`.

**Absence is meaningful:** an event with no `ticketUrl` renders as needing no
booking, rather than showing a dead button.

**On choosing a provider (analysis in `docs/TICKETING.md`).** Three findings are
worth surfacing here, because they are easy to get wrong:

- **Buy a ticketing platform; do not build one.** A payment processor moves
  money, but it cannot cap how many tickets exist. Anything involving "only 60
  seats" needs something counting seats. Building that yourself was costed in
  September 2026 and saves roughly **£60 a year** — about one extra ticket per
  concert — in exchange for a payment backend, a database, inventory logic and an
  admin login, inherited annually by non-engineers. **TryBooking** is the chosen
  provider; it is free for free events, and its fees can be passed to the buyer,
  at which point buying is cheaper than building.
- **Compare fees on a real ticket price, and for the right channel.** At £5–£10 a
  ticket a flat "+20p" costs more than the percentage does, which inverts the
  apparent ranking. The earlier version of this document recommended SumUp on a
  **1.69%** figure that turned out to be its **card-reader** rate; SumUp's online
  rate is **2.5%**. The correction changed the answer. The larger saving by far is
  avoiding Eventbrite, at roughly twice TryBooking's fee.
- **The payment account must belong to the society, not to an individual.** A
  payment provider account is tied to the bank account behind it, so a personal
  account makes the payment account personal too — and unhandoverable. That would
  reintroduce precisely the dependency the rest of this architecture removes. The
  same test ruled out **Apple Wallet** passes: Apple requires a D-U-N-S number and
  legal-entity status that an unincorporated society does not have, leaving only a
  membership in one student's name.

None of it affects the code. `ticketProvider` stays cosmetic, so acting on any of
this is content editing.

---

### ADR-007 — Hosting on GitHub Pages, built and published by GitHub Actions

**Decision:** Deploy to **GitHub Pages**, built and published by a GitHub
Actions workflow (`.github/workflows/deploy.yml`) on every push to `main`.

**Superseded the original decision (Cloudflare Pages), September 2026.** The
reasoning for both is kept below, because a future committee deserves to know
what was traded away rather than rediscovering it when something is missing.

**Why GitHub Pages:**

| Option           | Verdict                                                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **GitHub Pages** | **Chosen.** One account for the whole project — the single biggest handover saving available. Free custom domain and TLS. 100 GB/month soft bandwidth limit, 1 GB site limit.                          |
| Cloudflare Pages | Originally chosen, and still the better host on the merits: unlimited bandwidth, preview deployments, response headers. Rejected now because it is a second account and a second service to hand over. |
| Netlify          | Excellent experience, but a metered free tier with a history of tightening. Bill-shock risk is exactly what a student society cannot absorb.                                                           |
| Vercel           | Best-in-class for Next.js, which we are not using. Free-tier terms are awkward for organisational use.                                                                                                 |

**The decisive constraint, added September 2026: the domain belongs to the
University.** The society's address is a subdomain of the University's domain,
and University IT adds the DNS record on request. That has two consequences which
together settle the question:

- **Cloudflare Workers — the product Cloudflare now directs new projects to — is
  not usable at all.** Attaching a custom domain to a Worker requires the domain
  to be an active zone on your own Cloudflare account: _"You cannot create a
  Custom Domain on a hostname with an existing CNAME DNS record or on a zone you
  do not own."_ The University is not going to delegate its nameservers to a
  student society's Cloudflare account. Only the older Cloudflare Pages supports
  a CNAME-only setup for a subdomain whose DNS lives elsewhere — so the Cloudflare
  route means committing to the product Cloudflare is moving away from.
- **A re-point is expensive.** Changing the record means another request to a
  third party on their timescale, so the choice should be the one least likely to
  force one. GitHub Pages' record points at `<organisation>.github.io`,
  **excluding the repository name**, which means it survives a repository rename
  or a rebuild in a different repository. It is the more stable target, on the
  more stable product.

This reasoning did not exist when the original comparison below was written, and
it outweighs it. Had it been known earlier, GitHub Pages would have been the
choice on the merits and not only on the handover argument.

**Why one account beats a better host.** Section 1 of this document says the
tie-breaker is _"which option is easier to hand over?"_ Every account the society
holds is a thing that can be lost: registered to the wrong email, left with a
graduate, or simply forgotten until it is needed. Hosting on GitHub removes an
entire account from `docs/HANDOVER.md` — no second login, no second set of
recovery codes, no second place where a permission has to be revoked when
somebody leaves. Against that, the things Cloudflare does better are real but
survivable.

**What this costs us, stated plainly.** Three things, and none of them is
hypothetical:

1. **No preview deployments.** This is the biggest loss, and it was the original
   deciding factor. A committee member editing a concert no longer gets a URL
   showing their change before it is live. The mitigations are the checks on
   every pull request — which catch broken content, not ugly content — and
   `npm run dev` for anyone willing to install Node. Editors will be publishing
   with slightly less confidence than the original design intended.
2. **No response headers.** `public/_headers` is a Cloudflare and Netlify
   feature; GitHub Pages does not read it. The content security policy and the
   other protections in that file **are not applied to the live site.** See
   section 3, and the header comment in the file itself.
3. **Metered bandwidth.** GitHub Pages documents a _soft_ limit of 100 GB per
   month and a 1 GB site size limit, where Cloudflare's bandwidth was unlimited.
   For a society site serving photographs and PDF programmes this is ample —
   100 GB is roughly 200,000 views of a 500 KB page — but it is a ceiling where
   there was none, and heavy video would eventually meet it. ADR-008's exit to
   object storage is the answer if that ever happens.

**Why CI now deploys, and what that changes.** The original decision kept
GitHub Actions deliberately unable to publish, so that no deployment credential
existed anywhere. That property is preserved in substance rather than form:
publishing uses the workflow's own short-lived `GITHUB_TOKEN` and an OIDC
identity token, scoped in the workflow file to `pages: write` and
`id-token: write` for that run alone. **There is still no long-lived API token
stored in the repository, and nothing to rotate or hand over.** What has changed
is that a compromised workflow file could now publish — so the mitigation moves
to protecting `main`: changes must arrive by pull request, and the checks must
pass. That is set up in `docs/DEPLOYMENT.md` and it is not optional.

**The repository must be public.** GitHub's documentation is explicit: _"If the
account that owns the repository uses GitHub Free or GitHub Free for
organizations, the repository must be public."_ The society's organisation is on
the free plan, so Pages on a private repository is not available without paying
for GitHub Team. Making it public was already the recommendation in
`docs/DEPLOYMENT.md` for unrelated reasons — there are no secrets in the
repository by design, and the only personal data in it, committee email
addresses, is published on the website anyway. The one real consequence is that
**draft events are visible to anyone browsing the repository before they are
announced.**

**The site must be served from the root of its address.** Every internal link in
this project is a plain path (`/events`), which is the form a non-programmer can
read and edit. A GitHub Pages _project_ site lives under `/<repo>`, which would
require setting `base` in `astro.config.mjs` and rewriting every one of those
links — and rewriting them back once the custom domain arrives. Naming the
repository `<organisation>.github.io` instead gives a root address for free.
`docs/DEPLOYMENT.md` has the details.

**Portability:** the build still produces plain static files with no
host-specific APIs. Moving back to Cloudflare — on **Workers**, which is what
Cloudflare now tells new projects to use rather than Pages — or on to Netlify,
remains a configuration change rather than a rewrite — and would restore the response
headers immediately, since `public/_headers` is kept in place for exactly that
reason. Lock-in is close to zero, which is what makes a decision like this one
safe to revisit.

---

### ADR-008 — Media in the repository, with a documented exit

**Decision:** Photographs live in `src/assets/` and are optimised by Astro at
build time. PDF programmes live in `public/brochures/` and are served unchanged.

**Why:** At this scale — perhaps a few hundred photographs over several years —
repository storage means one thing to back up, one thing to hand over, and no
extra account. Photographs in `src/assets/` go through Astro's image pipeline,
which generates responsive, modern-format variants automatically, so large source
files do not become large downloads.

PDFs sit in `public/` instead because they need stable, permanent URLs: a
brochure link may be printed on a poster or shared in a WhatsApp group, and it
must not change when the site rebuilds.

**The real risk, stated plainly:** Git keeps binary files forever. Deleting a
large photograph does not shrink the repository, and history cannot be trimmed
without rewriting it for everyone. `docs/CONTENT_GUIDE.md` therefore gives a size
budget and a one-line command to resize images before committing.

**The exit, if the gallery outgrows this:** move bulk media to Cloudflare R2 or a
similar object store and reference it by URL, keeping only a handful of key
images in the repository. This is written down so a future maintainer recognises
the situation rather than rediscovering it.

**Alt text is enforced by the schema.** Images are stored as `{ src, alt }`
objects, so an image without alt text is not a missing best practice — it is a
build failure. Accessibility that depends on remembering does not survive a
committee handover; accessibility the build insists on does. This is the single
most effective accessibility decision in the project.

---

### ADR-009 — A deliberately small dependency budget

**Decision:** Direct dependencies are Astro, its MDX and sitemap integrations,
TypeScript, Prettier and Astro's type checker. Nothing else without a clear
reason.

**Why:** Every dependency is a future upgrade, a possible security advisory and
another thing a volunteer must understand. There is no CSS framework and no UI
library: the design system is a small file of CSS custom properties and plain
modern CSS (see ADR-010). Tests use Node's built-in test runner rather than a
test framework.

The practical effect is that upgrades stay small enough for a non-specialist to
attempt, and the whole toolchain is explainable in a paragraph.

---

### ADR-010 — Hand-written CSS with design tokens, no framework

**Decision:** A small set of CSS custom properties (colour, type scale, spacing)
in one stylesheet, plus modern CSS layout. No Tailwind, no component library.

**Why:** The site has perhaps a dozen distinct layouts. A framework would add a
build step, a large vocabulary and an upgrade treadmill to solve a problem this
site does not have. Tokens in one file mean a future committee can restyle the
site by changing a handful of values, without touching a single template — which
is exactly the kind of change a non-engineer might reasonably want to make.

Colour choices are documented with their measured contrast ratios so that a
future restyle does not accidentally break accessibility.

---

### ADR-011 — Analytics: none by default

**Decision:** No analytics are installed. If the committee wants them,
**Cloudflare Web Analytics** is the recommendation, enabled by a single
configuration flag.

**Why:** Most analytics require a cookie banner, put visitor data into someone
else's hands, and answer questions nobody has actually asked. Cloudflare Web
Analytics is free, cookieless and collects no personal data, so it needs no
consent banner under UK GDPR/PECR.

**Note since ADR-007.** Cloudflare Web Analytics is a script tag and works on any
host, so the recommendation stands. But it no longer rides on an account the
society already holds — turning it on now means creating a Cloudflare account,
and therefore adds a line to `docs/HANDOVER.md`. That is a fair price for
analytics the committee actually wants, and a bad one for analytics nobody asked
for. Which is the existing default.

Off by default, because a site that collects nothing has nothing to explain, leak
or comply with.

---

## 3. Security model

There is no server, no database and no authentication of our own, so the
attack surface is small and mostly organisational rather than technical.

**What could actually go wrong, in rough order of likelihood:**

1. **A committee member's GitHub account is compromised.** This is the main risk:
   whoever can write to the repository can change the website. Mitigations —
   require two-factor authentication across the GitHub organisation, protect
   `main` so changes arrive by pull request, and remove leavers promptly at
   handover.
2. **Loss of access to an account.** More likely than an attack, and more
   damaging. Every service must have at least two committee members as owners and
   be registered to a society email address, never a personal one. See
   `docs/HANDOVER.md`.
3. **A leaked OAuth secret**, if the CMS is set up. It lives only in the
   authentication worker's environment, never in Git, and can be rotated by
   generating a new one in GitHub.

**Boundaries, stated explicitly:**

- **Secrets never enter the repository.** The only secret in the whole system is
  the CMS OAuth client secret, held in the worker's environment. There is no
  stored deployment token: publishing uses a short-lived token minted for a
  single workflow run (ADR-007). The corresponding control is that **`main` must
  be protected**, because whoever can change the deploy workflow can change the
  site.
- **`/admin` is not access control.** Anyone can load it; only GitHub's
  permissions decide whether their edits are accepted (ADR-005).
- **Payment data never touches this site or this repository** (ADR-006). Card
  details are entered on the provider's domain. We could not leak them if we
  tried, which is the point.
- **External links** carry `rel="noopener noreferrer"`.
- **Response headers are currently NOT applied.** `public/_headers` defines a
  content security policy and the usual hardening headers, but GitHub Pages does
  not read that file (ADR-007). The file is kept as the record of the intended
  policy, and starts working again on any host that reads it. The practical
  exposure is small — the site ships almost no JavaScript of its own, accepts no
  input and holds no session — but it is a real reduction in defence in depth,
  and `docs/DEPLOYMENT.md` gives the partial mitigation available on Pages.

---

## 4. Handover model

The architecture is shaped so that a new committee member can do the common jobs
without understanding the codebase:

| Task                  | What it actually involves                         |
| --------------------- | ------------------------------------------------- |
| Add or edit a concert | Edit one Markdown file — via GitHub or the CMS    |
| Add an artist         | Add one Markdown file and one photograph          |
| Upload a brochure     | Drop a PDF into a folder, reference its name      |
| Change a ticket link  | Change one line                                   |
| Update the committee  | Edit one data file                                |
| Deploy                | Nothing — merging to `main` deploys automatically |

The corresponding risk is **losing access to the accounts**, not losing the code.
`docs/HANDOVER.md` lists every account the society must own, who should hold it,
and how to recover it. That checklist matters more to the site's survival than
anything in this document.

---

## 5. Known open decisions

Honest list of what is deliberately unresolved. Anything here is waiting on a
committee decision, not on more work.

**Waiting on a decision:**

- **Which bank account receives ticket income.** It must be a **society**
  account with two signatories, not a committee member's personal or sole trader
  account — otherwise the payment provider account is personal too and cannot be
  handed over, reintroducing the dependency this architecture removes. Cambridge
  SU was not accepting new society finance accounts as of September 2026, so an
  external account may be necessary; check with them first. See
  `docs/TICKETING.md` and `docs/HANDOVER.md`.
- **Domain name.** Not yet registered. Affects `site` in `astro.config.mjs`, and
  therefore canonical URLs, the sitemap and social previews. It no longer blocks
  anything else: the plan to gate `/admin` was withdrawn with the move to GitHub
  Pages, not deferred (ADR-005).
- **Whether to set up the CMS at all.** Try editing on GitHub first; add the CMS
  only if editors find that uncomfortable. Do not build infrastructure nobody has
  asked for.
- **Whether to turn on analytics.** Off by default (ADR-011). A deliberate
  choice to leave to the committee, not an oversight.

**Deliberately deferred, with the trigger written down:**

- **Venues as a collection** — inline for now (ADR-003). Revisit when the same
  venue is re-typed often enough that its details start to drift.
- **Filtering events by type.** The events page shows upcoming and past, but not
  a concert/workshop filter. With the number of events a society programmes,
  sections are easier to scan than controls to operate. If it is ever wanted, add
  `src/pages/events/type/[type].astro` using `getStaticPaths` over `EVENT_TYPES`
  — the single-collection model (ADR-003) makes it a filter on one array. Note
  that a `?type=` query string **cannot** work: a static site has no server to
  read one.
- **Gallery.** Not built. Depends on the media decision in ADR-008.
- **Self-hosted ticketing** — buying instead (ADR-006, costed September 2026).
  Revisit only if the society outgrows what a ticketing platform will do, and
  only once the saving is worth more than a payment backend maintained by
  volunteers. At current volumes it is worth about one ticket per concert.
  `docs/TICKETING.md` has the numbers and the non-negotiables if it ever happens.
