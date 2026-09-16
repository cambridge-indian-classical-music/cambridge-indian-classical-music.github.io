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

1. Register a domain (see [HANDOVER.md](HANDOVER.md) for the pitfalls — this is
   the one part that costs money and can be lost).
2. At the registrar, create the DNS records GitHub asks for:
   - for `www.example.org`, a **CNAME** record pointing at
     `cambridge-indian-classical-music.github.io`
   - for a bare `example.org`, the **A / AAAA records** listed in GitHub's
     documentation — take them from GitHub's page rather than copying them from
     anywhere else, as they change
3. **Settings → Pages → Custom domain**, enter the domain, and save. GitHub
   checks the DNS and issues a TLS certificate — this can take up to 24 hours.
4. Tick **Enforce HTTPS** once it becomes available.
5. **Update `site` in `astro.config.mjs` to the new address**, and merge that
   change.

Step 5 is easy to forget. Until it is done, canonical links, the sitemap and
social previews all point at the old address.

> GitHub stores the custom domain in the repository settings, and it survives
> deploys — with the Actions publishing source there is no `CNAME` file to
> commit. If you later switch the publishing source to a branch, you will need
> one.

---

## What this costs

> **Checked September 2026.** Provider free tiers change; re-check before relying
> on these figures for a decision.

**The domain is the only guaranteed recurring cost.** Everything else in this
project sits inside a free tier with room to spare.

| Service              | What we use it for                | Cost                                                                                    |
| -------------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| **Domain registrar** | The web address                   | **~£10–15/year — the only certain cost**                                                |
| GitHub Pages         | Hosting, TLS, custom domain       | Free on public repositories                                                             |
| GitHub Actions       | Running the checks and the deploy | Free on public repositories — no minute limit at all                                    |
| Dependabot           | Monthly dependency updates        | Free — GitHub lists Dependabot as free on standard runners, like public repos and Pages |
| unpkg                | Serving the CMS code              | Free CDN, no account needed                                                             |
| Ticketing provider   | Selling tickets                   | Per-ticket fee only, and only when selling. See [TICKETING.md](TICKETING.md)            |

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

- **Move hosting to Cloudflare Pages or Netlify**, both of which read the file as
  written. ADR-007 sets out what else that trade buys and costs.
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

> **Since the site moved to GitHub Pages, this also means creating a Cloudflare
> account** — one the society otherwise no longer needs, holding the project's
> only real secret, and one more thing to hand over every year. That is a fair
> cost if editors genuinely want forms instead of text files, and a poor one
> otherwise. Try editing on GitHub first.

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
`/admin`, once the custom domain existed. **That plan is withdrawn.** GitHub
Pages serves every file publicly and offers no way to put a login in front of one
path, and adding a second host back just for this would undo the reason the site
moved (ADR-007). See ADR-005 for the full reasoning.

In practice this changes nothing about who can edit: **`/admin` is a sign-in
screen, not a lock.** GitHub's repository permissions decide whose edits are
accepted, and loading the page gains a stranger nothing. What is lost is a layer
of obscurity, which was always the smaller half of the argument.

If a future committee wants the gate back, the honest options are to move hosting
back to Cloudflare Pages, or to stop publishing `/admin` altogether and edit on
GitHub — which works today and needs none of this setup.

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

The site is plain static files with nothing host-specific, so this is a
configuration change rather than a rewrite.

**Cloudflare Pages** — the host this project originally chose, and the one to
move back to if any of what GitHub Pages lacks starts to hurt. It restores
response headers from `public/_headers`, preview deployments on every pull
request, unlimited bandwidth, and the option of Cloudflare Access on `/admin`:

1. **Workers & Pages → Create → Pages → Connect to Git**, and choose this
   repository.
2. Build settings: framework preset **Astro**, build command `npm run build`,
   output directory `dist`, environment variable `NODE_VERSION` set to `22`.
3. Delete `.github/workflows/deploy.yml` — Cloudflare builds from GitHub itself,
   so keeping a second publisher would mean two sites drifting apart.
4. Move the custom domain over, and update `site` in `astro.config.mjs`.
5. Update ADR-007, ADR-005 and this document, or the next committee will be
   working from a description of a system that no longer exists.

The cost is a second account to hand over, which is exactly what ADR-007 weighed.

**Netlify** reads `public/_headers` too, so headers keep working. Watch the
metered bandwidth on the free tier.

Either way, note the reverse of step 2 of the setup above: on a host that serves
the site from the root of a domain, the repository name stops mattering.

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
