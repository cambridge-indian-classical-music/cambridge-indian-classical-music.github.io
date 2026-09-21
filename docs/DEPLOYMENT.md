# Deployment

How the website gets from this repository onto the internet, and how to set it
all up from scratch.

---

## How it works now

```
  Edit a content file
          │
          ▼
   Pull request on GitHub
          │
          └──► GitHub Actions runs the checks  ──► red cross stops it here
          │
     Merge to main
          │
          ▼
  GitHub Actions builds and publishes to      (about 1–2 minutes)
  GitHub Pages
```

Two workflows, doing different jobs:

- **`.github/workflows/ci.yml` ("Checks")** runs on every pull request. It
  checks formatting, types, content, that the site builds, and that the built
  pages are sound. It cannot publish anything.
- **`.github/workflows/deploy.yml` ("Deploy")** runs only on `main`. It builds
  the site again, re-runs the output tests, and publishes the result to GitHub
  Pages. If anything fails, nothing is published and the current site stays up.

**Nobody deploys manually.** Merging to `main` is the deploy.

**There is no deployment password anywhere.** The Deploy workflow authenticates
with a token GitHub mints for that single run, scoped in the workflow file to
just what publishing needs. There is nothing to leak, rotate or hand over — but
it does mean **whoever can change the workflow can change the live site**, which
is why protecting `main` below is not optional.

---

## First-time setup

Roughly 30 minutes, done once. Steps 1–4 are required before the site can go
live at all.

### 1. The repository must be public

**This is a hard requirement, not a preference.** GitHub's documentation:
_"If the account that owns the repository uses GitHub Free or GitHub Free for
organizations, the repository must be public."_ The society's organisation is on
the free plan, so GitHub Pages will not publish from a private repository. The
alternative is paying for GitHub Team.

Making it public suits this project — there are no secrets in the repository by
design, and the only personal data in it, committee email addresses, is already
published on the website. **The one real consequence: draft events become
visible to anyone browsing the repository before you announce them.** If that
matters for a particular event, keep it out of the repository until you are ready
to announce it.

**Settings → General → Danger Zone → Change repository visibility → Public.**

### 2. Name the repository so the site sits at the root of its address

Every internal link in this project is a plain path (`/events`). That only works
if the site is served from the root of a domain. A normal GitHub Pages repository
is published at `https://<organisation>.github.io/<repository>` — a sub-path,
which would break every link, every stylesheet and every image.

**Name the repository `cambridge-indian-classical-music.github.io`** and GitHub
publishes it at `https://cambridge-indian-classical-music.github.io/` instead —
the root. Nothing in the code has to change, then or later.

**Settings → General → Repository name.** GitHub redirects the old address, so
existing clones and links keep working.

Two things to do after renaming:

- Update `repo:` in `public/admin/config.yml` to the new name.
- Anyone with a local clone should run
  `git remote set-url origin git@github.com:cambridge-indian-classical-music/cambridge-indian-classical-music.github.io.git`.

> **If you would rather not rename**, the other way to get a root address is to
> attach the custom domain (step 5) straight away and simply not use the
> `github.io` address. The only unacceptable option is publishing at a sub-path
> without doing the work in ADR-007 — the site will appear unstyled and every
> link will 404.

### 3. Turn on Pages, published by Actions

**Settings → Pages → Build and deployment → Source: GitHub Actions.**

Not "Deploy from a branch". Nothing else on that page needs changing. The
workflow in this repository does the rest.

Then push to `main`, or run the **Deploy** workflow by hand from the **Actions**
tab. The first run takes a couple of minutes; the run's summary links to the
published site.

### 4. Protect `main`

**Settings → Branches → Add branch protection rule** for `main`:

- Require a pull request before merging
- Require status checks to pass — select the **Checks** workflow

This matters more than it did before. The Deploy workflow can publish, so the
protection on `main` is what stands between a bad change and the live site.

Under **Settings → Actions → General**, leave workflow permissions as
**read-only**. The Deploy workflow asks for the extra permissions it needs in its
own file, which is the safer way round.

### 5. Custom domain

The society's address is a **subdomain of the University's own domain**,
requested from University IT rather than bought from a registrar. That makes the
DNS record something a third party controls and will not want to change often, so
it is worth getting right first time. **It also means the domain costs nothing.**

**Everything below was verified against UIS's own documentation in September
2026**, so it need not be re-derived:
<https://www.dns.cam.ac.uk/ipreg/offsite.html>

- **It is a CNAME, not a redirect.** UIS: _"Where possible, we prefer external
  references to be CNAME records, i.e. to hostnames, though we can set up
  A/AAAA address records when an external hostname is not available."_ So the
  society's address stays in the browser's address bar, and GitHub issues the
  certificate for that hostname. Visitors never see a `github.io` address.
- **The society is eligible.** UIS's domain policy lists `societies.cam.ac.uk`
  for _"an established University society"_.
- **The slow process may not apply.** The Service Request form and naming panel
  are described for _"new top-level names under `cam.ac.uk`"_. For a subdomain of
  a containing domain somebody else already controls, the guidance is to
  _"contact your institutional IT staff, who control the containing domain"_ —
  potentially a much lighter route. **Ask which applies rather than assuming the
  slow one.**
- **Where to send it:** `ip-register@uis.cam.ac.uk`. Have a one-sentence
  description of the purpose ready; UIS asks for one.
- **Conditions that apply:** the external host must serve only Cambridge-related
  material under the `cam.ac.uk` name (satisfied — a custom domain binds to this
  one project), and CUDN and JANET acceptable use policies apply. The
  reverse-DNS requirement applies to A/AAAA records, not CNAMEs, so it is moot
  here.
- **Choosing wrong is recoverable.** The slow, expensive part is _allocating_ the
  name. Re-pointing an existing name later is an email asking them to change one
  CNAME target, not a fresh application. So this is a reversible decision — not
  free, and not to be done repeatedly, but not one-shot either.

**The record to ask for:**

```
<the-subdomain>    CNAME    cambridge-indian-classical-music.github.io.
```

**Point it at `cambridge-indian-classical-music.github.io`, not at the repository
name.** GitHub's documentation is explicit: _"The `CNAME` record should always
point to `<user>.github.io` or `<organization>.github.io`, excluding the
repository name."_ This is worth understanding rather than just copying, because
it is what makes the record durable: it stays correct if the repository is
renamed, or if the site is one day rebuilt in a different repository in the same
organisation. **University IT should never need to change it again.**

If the address is ever an apex domain instead (`example.org`, no subdomain), a
CNAME will not do — that needs the four **A** records and four **AAAA** records
GitHub publishes. Take them from GitHub's documentation on the day, not from
here, because they change.

Then, on GitHub:

1. **Settings → Pages → Custom domain**, enter the domain, and save. GitHub
   checks the DNS and issues a TLS certificate — this can take up to 24 hours.
2. Tick **Enforce HTTPS** once it becomes available.
3. **Update `site` in `astro.config.mjs` to the new address**, and merge that
   change.

> **The one real trap: HTTPS is automatic, but not zero-touch.** A host cannot
> obtain a certificate for a name it does not know it is serving. The sequence is
> always: UIS adds the record → **you enter the domain in Settings → Pages** →
> GitHub runs its DNS check and requests a certificate. **If you ask UIS for the
> record and do nothing else, visitors get a certificate error, not HTTPS.**
> Nothing else stands in the way: certificate authority authorisation (CAA)
> records were checked on `societies.cam.ac.uk`, `cam.ac.uk`, `ac.uk` and `uk` in
> September 2026 and there are none, so issuance is unblocked.

> **Tick Enforce HTTPS now, before any of this.** On the current `github.io`
> address, `http://` does **not** redirect to `https://` — verified September
> 2026, it returns 200 over plain HTTP. **Settings → Pages → Enforce HTTPS**
> fixes it, and is worth doing today rather than waiting for the custom domain.

Step 3 is easy to forget. Until it is done, canonical links, the sitemap and
social previews all point at the old address.

> GitHub stores the custom domain in the repository settings, and it survives
> deploys — with the Actions publishing source there is no `CNAME` file to
> commit. If you later switch the publishing source to a branch, you will need
> one.

---

## What this costs

> **Checked September 2026.** Provider free tiers change; re-check before relying
> on these figures for a decision.

**This project has no guaranteed recurring cost at all.** That changed in
September 2026, when the domain question was settled: the address is a subdomain
of `societies.cam.ac.uk`, allocated by University IT, so there is no registrar
and no annual renewal. Everything else sits inside a free tier with room to
spare.

| Service               | What we use it for                | Cost                                                                                    |
| --------------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| **University domain** | The web address                   | **Free** — allocated by UIS, no registrar, nothing to renew or let lapse                |
| GitHub Pages          | Hosting, TLS, custom domain       | Free on public repositories                                                             |
| GitHub Actions        | Running the checks and the deploy | Free on public repositories — no minute limit at all                                    |
| Dependabot            | Monthly dependency updates        | Free — GitHub lists Dependabot as free on standard runners, like public repos and Pages |
| unpkg                 | Serving the CMS code              | Free CDN, no account needed                                                             |
| Ticketing provider    | Selling tickets                   | Per-ticket fee only, and only when selling. See [TICKETING.md](TICKETING.md)            |

**Because the repository is public (and it must be — see step 1), GitHub Actions
has no billing surface at all.** Minutes are unlimited on public repositories, so
the checks and the deploy are free however often they run.

### The limits that do exist

GitHub Pages is free but not unmetered. The documented limits:

| Limit               | Value                | What it means here                                                        |
| ------------------- | -------------------- | ------------------------------------------------------------------------- |
| Published site size | 1 GB                 | Photographs and PDFs count. Watch this as the archive grows — see ADR-008 |
| Bandwidth           | 100 GB/month, _soft_ | Roughly 200,000 views of a 500 KB page. A society site is nowhere near    |
| Builds              | 10/hour, _soft_      | Ten merges in an hour is not a normal day                                 |
| Deploy timeout      | 10 minutes           | This site builds in seconds                                               |

"Soft" means GitHub contacts you rather than sending a bill — **there is no way
for this to cost money unexpectedly**, which is the property that matters. If a
limit is exceeded, the fix is to make the site smaller or move hosting, not to
pay.

### Can any of this bill us by surprise?

**No — and not by luck.** Two things make it structural rather than something a
committee has to watch:

- **There is no payment method on the GitHub account.** GitHub's documentation is
  explicit about what happens at the limit: _"If your account does not have a
  valid payment method on file, usage is blocked once you use up your quota."_
  Blocked, not billed. A workflow would fail with a message — annoying, visible,
  and free.
- **On a public repository the question does not arise at all.** GitHub Actions
  usage is _"free for self-hosted runners and for public repositories that use
  standard GitHub-hosted runners."_ Both workflows here use `ubuntu-latest`, a
  standard runner.

The Pages limits in the table above behave the same way. They are _soft_ limits:
GitHub contacts you and asks you to reduce usage. There is no mechanism by which
exceeding them produces an invoice.

**Keep it that way.** Do not add a payment method to the GitHub organisation
"just in case" — an account that cannot be charged is a guarantee, and a spending
limit is only a setting somebody can change. The same holds for Cloudflare, if
the society ever needs it for the CMS worker: its free plan takes no card, and a
Worker over its daily request limit returns an error rather than a charge.

### What would start costing money

Nothing here is close, but for the avoidance of doubt:

- **Making the repository private again.** GitHub Pages would stop working
  entirely on the free plan, and Actions minutes would become metered.
- **Adding Git LFS.** It has its own storage and bandwidth quotas. This project
  deliberately does not use it; large media should go to object storage instead
  (ADR-008).
- **Outgrowing the 1 GB site limit**, which means moving media out of the
  repository — the exit already described in ADR-008.
- **Larger GitHub Actions runners.** Always billable. Both workflows use
  `ubuntu-latest`, which is a standard runner.
- **Turning on analytics** now means creating a Cloudflare account. Still free,
  but it is a new account to hand over — see ADR-011.

There is no database, no object storage, no email service and no server — so
there is nothing that bills by usage.

---

## Security headers on GitHub Pages

**`public/_headers` is not applied.** It is a Cloudflare and Netlify feature;
GitHub Pages does not read it, and there is no equivalent — GitHub Pages serves
static files and does not let you set response headers. So the content security
policy, `X-Frame-Options` and the rest of that file are **currently doing
nothing**. Nothing breaks visibly, which is precisely why it is written down in
three places: here, in ADR-007, and at the top of the file itself.

**How much this matters: less than it sounds, but it is not nothing.** The site
ships almost no JavaScript of its own, takes no user input, sets no cookies and
has no session to steal, so the usual thing a content security policy defends
against barely applies. What is lost is defence in depth — a cheap safety net if
a future change introduces something riskier.

**Keep the file up to date anyway.** If you add a script, an embedded video or a
web font, update `public/_headers` as though it were live. It costs a minute, it
is the record of what the policy should be, and it starts working again the
moment the site moves to a host that reads it.

**The options, if a committee decides this matters:**

- **Move hosting to Cloudflare Pages**, which reads the file as written. See
  "Moving to a different host" below for why that is the only viable
  destination, and ADR-007 for what else the trade buys and costs. (Cloudflare
  Workers and Netlify also read `_headers`, but neither is available to this
  project — Workers cannot take a University subdomain, and Netlify is rejected
  on its credit model.)
- **Add a `<meta http-equiv="Content-Security-Policy">` tag** in
  `src/layouts/BaseLayout.astro`. This recovers the content security policy — the
  most valuable part — on any host. It cannot express `frame-ancestors`, so
  clickjacking protection stays lost, and it needs testing carefully because a
  mistake blocks the site's own stylesheets. Not done by default; it is a change
  with real failure modes and nobody has asked for it.

---

## Setting up the editing interface (optional)

The `/admin` page gives committee members forms instead of text files. **It is
optional.** Editing on GitHub works fine and needs none of this — try that first
and only do this if editors find it uncomfortable.

This is the one genuinely fiddly part of the project, because the CMS needs
permission to write to GitHub on the editor's behalf. That needs a small
authentication service; a static site cannot do it alone.

> **Since the site moved to GitHub Pages, the OAuth route below also means
> creating a Cloudflare account** — one the society otherwise no longer needs,
> holding the project's only real secret, and one more thing to hand over every
> year. That is a fair cost if editors genuinely want forms instead of text
> files, and a poor one otherwise. Try editing on GitHub first.
>
> **But be clear what that account is for.** The authenticator is a Cloudflare
> **Worker**, running on a `*.workers.dev` address. It needs no custom domain, no
> DNS record and no Cloudflare zone, and Workers is the product Cloudflare is
> actively investing in — so this carries none of the product risk attached to
> Cloudflare _Pages_ in ADR-007. **Setting up the CMS is not a reason to move
> hosting.** It is one dashboard login to hand over, not a server to maintain:
> there is no operating system to patch, nothing running between sign-ins, and
> nothing that accrues cost while idle.
>
> **There is a second route that needs no server at all.** Sveltia also supports
> signing in with a GitHub personal access token — its documentation calls this
> the quickest start, with _"no server setup required"_: the editor pastes a
> token and it is kept in their browser. That avoids the OAuth app, the worker
> and the Cloudflare account entirely. The catch is that generating a correctly
> scoped token is arguably harder to explain to a non-technical editor than the
> sign-in button it replaces, and it puts a long-lived credential in each
> editor's browser rather than a short-lived session — revoking access then means
> chasing tokens rather than removing someone from the repository.
>
> **If the CMS is set up, use the OAuth route (ADR-005).** The token route is
> documented because it exists, not because it is the easier path.

### 1. Create a GitHub OAuth application

**Organisation settings → Developer settings → OAuth Apps → New OAuth App**

| Field                      | Value                                        |
| -------------------------- | -------------------------------------------- |
| Application name           | CUICM website editor                         |
| Homepage URL               | the site's address                           |
| Authorization callback URL | `https://<your-worker>.workers.dev/callback` |

Note the **Client ID**, and generate a **Client Secret**.

> **The client secret is a password.** It must never be committed to this
> repository, pasted into `config.yml`, or shared over email. It goes only into
> the worker's settings in step 2.

### 2. Deploy the authentication worker

Sveltia CMS provides a ready-made Cloudflare Worker for this. Follow the
instructions at <https://github.com/sveltia/sveltia-cms-auth>. In short: deploy
the worker to a Cloudflare account, then set two **encrypted** environment
variables on it:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

### 3. Point the CMS at it

In `public/admin/config.yml`, set `base_url` to the worker's address, and check
`repo` names the society's repository. Commit and merge.

### 4. Test it

Visit `/admin`, sign in with GitHub, make a small edit and check it appears as a
pull request.

**Who can edit:** anyone with write access to the repository, and nobody else.
The `/admin` page itself is public — it is a login screen, not a lock. GitHub
enforces the permissions. To give someone editing rights, add them to the
repository on GitHub; to remove them, remove them there.

### 5. `/admin` is a public page — and stays one

The plan agreed in September 2026 was to put Cloudflare Access in front of
`/admin`, once the custom domain existed. **That plan is withdrawn, and moving
hosting would not bring it back.** Two independent reasons: GitHub Pages serves
every file publicly and offers no way to put a login in front of one path; and
Cloudflare Access requires the domain to be an active zone on your own Cloudflare
account, which a University subdomain will never be — the partial (CNAME) setup
that would avoid delegating nameservers is Business or Enterprise plan only. See
ADR-005 for the full reasoning.

In practice this changes nothing about who can edit: **`/admin` is a sign-in
screen, not a lock.** GitHub's repository permissions decide whose edits are
accepted, and loading the page gains a stranger nothing. What is lost is a layer
of obscurity, which was always the smaller half of the argument.

If a future committee wants the gate back, there is one honest option: stop
publishing `/admin` altogether and edit on GitHub — which works today and needs
none of this setup.

### If you would rather use Decap CMS

Replace the script address in `public/admin/index.html` with the Decap one — the
comment in that file gives it. `config.yml` needs no changes; both read the same
format. That portability is deliberate (ADR-005).

---

## Turning on analytics (optional)

Off by default (ADR-011). If the committee wants visitor numbers:

> **This now means creating a Cloudflare account**, which the society no longer
> otherwise needs. Free, but it is a new account to hand over and keep access to.
> Worth it if the committee actually wants the numbers; not worth it otherwise.

1. Cloudflare dashboard → **Web Analytics** → add the site. Copy the token.
2. In `src/site.config.ts`:

   ```ts
   analytics: {
     enabled: true,
     cloudflareToken: 'your-token-here',
   },
   ```

3. Commit and merge.

The token is not a secret — it only identifies which site is reporting.

Cloudflare Web Analytics sets no cookies and collects no personal data, so **no
cookie banner is needed**. If you ever replace it with something that does use
cookies, you will need a consent banner and a privacy policy. That is a much
bigger commitment than it first appears.

---

## Moving to a different host

Nothing in the build is host-specific, so a move is configuration rather than a
rewrite. The real constraint is not difficulty — it is **which destinations
actually exist**, and that list is shorter than it looks. All checked September
2026; re-check before relying on any of it.

### Cloudflare Pages — the only viable move, and it comes with a caveat

It restores response headers from `public/_headers`, preview deployments on every
pull request, and unlimited bandwidth. **It would also let the repository go
private again** — Cloudflare builds from private repositories on its free plan,
so the public-repository requirement in step 1 is a GitHub Pages constraint, not
a constraint of this project. Bear in mind that GitHub Actions minutes become
metered on a private repository (2,000 a month on a Free organisation, against
roughly 40 used by twenty content pull requests). The cheaper answer is usually
to keep an event out of the repository until you are ready to announce it.

> **It does not buy Cloudflare Access on `/admin`.** An earlier version of this
> document listed that as one of the gains. It is not available: Access requires
> the domain to be an active zone on your own Cloudflare account, and the partial
> (CNAME) setup that would avoid delegating nameservers is Business or Enterprise
> plan only.

> **It must be Pages, and Pages is the product Cloudflare steers away from.**
> Their documentation says: _"Workers supports most Pages use cases and offers a
> broader feature set. It is Cloudflare's primary platform for building
> applications. Start new projects with Workers."_ There is no deprecation notice
> and no end-of-life date, but there is also no stated commitment to existing
> Pages projects.
>
> **Workers cannot be used here, so this is not a choice.** Attaching a custom
> domain to a Worker requires _"an active Cloudflare zone"_, and: _"You cannot
> create a Custom Domain on a hostname with an existing CNAME DNS record or on a
> zone you do not own."_ A University subdomain is neither. Cloudflare's own
> Pages-to-Workers migration guide confirms it from the other direction, listing
> "supports custom domains outside Cloudflare zones via CNAME records" as
> something Pages has and Workers lacks. **Moving to Cloudflare means adopting
> the legacy product knowingly.**

Steps, in this order — going private unpublishes the GitHub Pages site
immediately, so it is last:

1. Connect **Cloudflare Pages** to this repository, still public, and confirm it
   serves. Build command `npm run build`, output directory `dist`, Node 22 or
   newer.
2. `public/_headers` starts working again exactly as written, which is why the
   file is kept.
3. Add the custom domain in the Cloudflare dashboard **before** the DNS record is
   re-pointed, or the name will fail to resolve. Ask UIS to change the CNAME
   target to `<project>.pages.dev.`, then update `site` in `astro.config.mjs`.
4. Delete `.github/workflows/deploy.yml`, so there are not two publishers.
5. **Then**, if privacy was the reason for moving, make the repository private.
6. Update ADR-005, ADR-007 and this document, or the next committee will be
   working from a description of a system that no longer exists.

The cost is a second account to hand over, which is exactly what ADR-007 weighed.

### Netlify — rejected

Its free tier is 300 credits a month, a hard limit with no auto-recharge on the
free plan. **A production deploy costs 15 credits**; previews and branch deploys
are free. That is roughly 17–20 publishes a month once traffic is accounted for,
and this project's entire publishing model is "merge to `main` is the deploy" —
so Netlify prices precisely the thing the architecture does, and gets worse the
more the CMS is used. At zero credits, in Netlify's own words, _"all of your web
projects (sites/apps) are paused and visitors to your web projects will find a
`Site not available` page"_. An outage, not an invoice, discovered by a committee
nobody told about credits.

### Vercel — rejected

The free Hobby plan's documentation states it _"restricts users to
non-commercial, personal use only"_. A society selling tickets and memberships is
at best a grey area, enforced by account suspension.

### Either way

On any host that serves the site from the root of a domain, the repository name
stops mattering — the reverse of step 2 of the setup above.

---

## Troubleshooting

| Symptom                                       | Cause and fix                                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Merged, but the site is unchanged             | Open the **Actions** tab and look at the latest **Deploy** run. Builds take a minute or two             |
| The Deploy workflow fails at the publish step | Pages is not turned on, or its source is not **GitHub Actions**. See step 3 of the setup                |
| Site is unstyled and every link 404s          | It is being served from a sub-path. See step 2 of the setup                                             |
| Checks fail on a pull request                 | A content mistake — see [CONTENT_GUIDE.md](CONTENT_GUIDE.md)                                            |
| Custom domain shows a certificate warning     | The certificate is still being issued — it can take up to 24 hours. Then tick **Enforce HTTPS**         |
| Whole site offline                            | Domain expiry first (see [HANDOVER.md](HANDOVER.md)), then <https://www.githubstatus.com>               |
| Images or scripts silently not loading        | Not the content security policy — that is not applied on GitHub Pages. Check the path and the build log |
| `/admin` will not sign in                     | The worker is down, or `base_url` in `config.yml` is wrong, or the OAuth callback URL does not match    |

### Rolling back a bad change

On GitHub, open the pull request that caused it and click **Revert**. Merge the
revert. The Deploy workflow republishes with the previous content, which takes a
minute or two.

There is no instant dashboard rollback on GitHub Pages — reverting in Git is the
only route, which is why it is worth knowing where the **Revert** button is
before you need it.
