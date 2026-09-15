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
          ├──► GitHub Actions runs the checks  ──► red cross stops it here
          │
          └──► Cloudflare Pages builds a preview ──► a private URL to check
          │
     Merge to main
          │
          ▼
  Cloudflare Pages builds and publishes    (about 1–2 minutes)
```

Two separate things happen, on purpose:

- **GitHub Actions** only _checks_ the site. It has no ability to publish
  anything.
- **Cloudflare Pages** builds and publishes, straight from GitHub.

Keeping them apart means **there are no deployment credentials stored in
GitHub** — no API token to leak, rotate or hand over. See ADR-007.

**Nobody deploys manually.** Merging to `main` is the deploy.

---

## First-time setup

Roughly 30 minutes. Do it once; then it looks after itself.

### 1. GitHub

The repository must belong to a **GitHub organisation owned by the society**,
not to a personal account. See [HANDOVER.md](HANDOVER.md).

Recommended settings (**Settings → Branches → Add branch protection rule** for
`main`):

- Require a pull request before merging
- Require status checks to pass — select the **Checks** workflow

That means a broken site cannot be published even by accident.

Also, under **Settings → Actions → General**, leave workflow permissions as
read-only. Nothing here needs write access.

### 2. Cloudflare Pages

1. Create a Cloudflare account with the **society email address**.
2. **Workers & Pages → Create → Pages → Connect to Git**, and choose this
   repository.
3. Build settings:

   | Setting                | Value                                           |
   | ---------------------- | ----------------------------------------------- |
   | Framework preset       | Astro                                           |
   | Build command          | `npm run build`                                 |
   | Build output directory | `dist`                                          |
   | Node version           | set environment variable `NODE_VERSION` to `22` |

4. **Save and Deploy.** The site appears at
   `https://<project>.pages.dev`.

Preview deployments for pull requests are on by default. Leave them on — they
are the main reason this host was chosen.

### 3. Custom domain

1. Register a domain (see [HANDOVER.md](HANDOVER.md) for the pitfalls — this is
   the one part that costs money and can be lost).
2. In Cloudflare Pages: **Custom domains → Set up a custom domain**.
3. Follow the DNS instructions. The TLS certificate is issued automatically.
4. **Update `site` in `astro.config.mjs` to the new address**, and merge that
   change.

Step 4 is easy to forget. Until it is done, canonical links, the sitemap and
social previews all point at the old address.

The domain also **unblocks restricting `/admin`** with Cloudflare Access, which
is awkward to do on a `*.pages.dev` address — see "Setting up the editing
interface" below.

---

## What this costs

> **Checked September 2026.** Provider free tiers change; re-check before relying
> on these figures for a decision.

**The domain is the only guaranteed recurring cost.** Everything else in this
project sits inside a free tier with room to spare.

| Service                  | What we use it for            | Cost                                                                                    |
| ------------------------ | ----------------------------- | --------------------------------------------------------------------------------------- |
| **Domain registrar**     | The web address               | **~£10–15/year — the only certain cost**                                                |
| GitHub Actions           | Running the checks            | Free on public repos; 2,000 min/month on a Free org's private repos                     |
| Dependabot               | Monthly dependency updates    | Free — GitHub lists Dependabot as free on standard runners, like public repos and Pages |
| Cloudflare Pages         | Hosting and previews          | Free — 500 builds/month, unlimited preview deployments, up to 20,000 files              |
| Cloudflare Worker        | CMS sign-in, _if_ set up      | Free tier, far beyond what a login page uses                                            |
| Cloudflare Web Analytics | Visitor numbers, _if_ enabled | Free                                                                                    |
| unpkg                    | Serving the CMS code          | Free CDN, no account needed                                                             |
| Ticketing provider       | Selling tickets               | Per-ticket fee only, and only when selling. See [TICKETING.md](TICKETING.md)            |

**Headroom, in practice.** The checks take about two minutes per run. Twenty
content pull requests a month is roughly 40 minutes against 2,000 — about 2% —
and that only applies at all if the repository is private. Cloudflare's 500
builds a month is far beyond a society's editing rate.

**Making the repository public removes the Actions question entirely**, since
public repositories have no Actions billing surface at all. It suits this project:
there are no secrets in the repository by design, and the only personal data —
committee email addresses — is already published on the website itself. The one
thing to weigh is that draft events become visible to anyone browsing the
repository before you announce them.

### What would start costing money

Nothing here is close, but for the avoidance of doubt:

- **Adding Git LFS.** It has its own storage and bandwidth quotas. This project
  deliberately does not use it; large media should go to object storage instead
  (ADR-008).
- **Exceeding 500 Cloudflare builds a month**, which would mean roughly 16
  merges a day.
- **Moving media to Cloudflare R2** — the documented escape hatch in ADR-008. It
  has a free tier, but it is a metered service rather than a flat one.
- **Larger GitHub Actions runners.** Always billable. The workflow uses
  `ubuntu-latest`, which is a standard runner.
- **Any file over 25 MiB**, which Cloudflare Pages will not serve. Relevant only
  if someone commits an uncompressed video.

There is no database, no object storage, no email service and no server — so
there is nothing that bills by usage.

## Setting up the editing interface (optional)

The `/admin` page gives committee members forms instead of text files. **It is
optional.** Editing on GitHub works fine and needs none of this — try that first
and only do this if editors find it uncomfortable.

This is the one genuinely fiddly part of the project, because the CMS needs
permission to write to GitHub on the editor's behalf. That needs a small
authentication service; a static site cannot do it alone.

### 1. Create a GitHub OAuth application

**Organisation settings → Developer settings → OAuth Apps → New OAuth App**

| Field                      | Value                                        |
| -------------------------- | -------------------------------------------- |
| Application name           | CUICMS website editor                        |
| Homepage URL               | the site's address                           |
| Authorization callback URL | `https://<your-worker>.workers.dev/callback` |

Note the **Client ID**, and generate a **Client Secret**.

> **The client secret is a password.** It must never be committed to this
> repository, pasted into `config.yml`, or shared over email. It goes only into
> the worker's settings in step 2.

### 2. Deploy the authentication worker

Sveltia CMS provides a ready-made Cloudflare Worker for this. Follow the
instructions at <https://github.com/sveltia/sveltia-cms-auth>. In short: deploy
the worker to the society's Cloudflare account, then set two **encrypted**
environment variables on it:

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

### 5. Put Cloudflare Access in front of `/admin`

**Decided September 2026. Do this after the custom domain is set up — not
before.** See ADR-005.

This adds a login before anyone can even see the `/admin` page. It is a gate, not
a permission system: GitHub still decides whose edits are accepted (step 4). The
point is that a page which only committee members should be opening should not be
sitting open to the whole internet.

**Why Access rather than a username and password.** Access makes each person sign
in **as themselves** — so you can see who did what, and removing someone is
deleting their email address from a list. A single shared password would be
passed down through committees, never rotated when somebody leaves, and tell you
nothing about who used it. It would also be this project's first deployment
secret, which ADR-007 otherwise goes out of its way to avoid.

**Why it waits for the domain.** On Cloudflare Pages, Access covers **preview
deployments** by default; protecting the production site properly wants the
custom domain on Cloudflare. Doing it on the `*.pages.dev` address needs a
workaround and is not worth the trouble — set the domain up first (step 3).

To set it up:

1. In the Cloudflare dashboard: **Zero Trust → Access → Applications → Add an
   application → Self-hosted**.
2. Set the domain to the society's domain and the **path** to `admin`. Access
   supports path-scoped applications, so the rest of the website stays public.
3. Add a policy with action **Allow**, using the **Emails** selector, listing the
   committee members who should be able to edit.
4. Leave the default Cloudflare one-time-PIN login method on. Editors receive a
   code by email; there is no password to store, share or leak. Google or GitHub
   sign-in can be added instead if preferred.
5. Visit `/admin` in a private window to confirm you are challenged.

**Expect two logins.** Access first, then GitHub for the CMS itself. That is
normal — they are doing different jobs — but warn editors so it does not look
broken.

**At handover, update the email list**, or last year's committee keeps access.
It is on the checklist in [HANDOVER.md](HANDOVER.md).

> The Zero Trust free plan is generous — far more users than a committee will
> ever need — but Cloudflare does not state the limit on its public plans page.
> Check it at signup rather than assuming.

### If you would rather use Decap CMS

Replace the script address in `public/admin/index.html` with the Decap one — the
comment in that file gives it. `config.yml` needs no changes; both read the same
format. That portability is deliberate (ADR-005).

---

## Turning on analytics (optional)

Off by default (ADR-011). If the committee wants visitor numbers:

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

**GitHub Pages** (one fewer account, but no preview deployments):

1. Add a workflow that builds and publishes to Pages
   (`actions/deploy-pages`).
2. Set `site` in `astro.config.mjs` to the Pages address.
3. **Note what is lost:** `public/_headers` is a Cloudflare feature. On GitHub
   Pages the security headers, including the content security policy, stop
   applying. Nothing breaks visibly, which is exactly why it is worth writing
   down here.

**Netlify** reads `public/_headers` too, so headers keep working. Watch the
metered bandwidth on the free tier.

---

## Troubleshooting

| Symptom                                     | Cause and fix                                                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Merged, but the site is unchanged           | Check the Cloudflare Pages deployment log. Builds take a minute or two                               |
| Build fails on Cloudflare but works locally | Usually the Node version. Set `NODE_VERSION` to `22`                                                 |
| Checks fail on a pull request               | A content mistake — see [CONTENT_GUIDE.md](CONTENT_GUIDE.md)                                         |
| Whole site offline                          | Domain expiry first (see [HANDOVER.md](HANDOVER.md)), then Cloudflare status                         |
| Images or scripts silently not loading      | The content security policy in `public/_headers` is blocking them. Add the source there              |
| `/admin` will not sign in                   | The worker is down, or `base_url` in `config.yml` is wrong, or the OAuth callback URL does not match |

### Rolling back a bad change

On GitHub, open the pull request that caused it and click **Revert**. Merge the
revert. The site rebuilds with the previous content.

For an urgent fix, Cloudflare Pages can also roll back to a previous deployment
instantly from its dashboard — but that is only until the next merge, so still
revert properly in Git afterwards.
