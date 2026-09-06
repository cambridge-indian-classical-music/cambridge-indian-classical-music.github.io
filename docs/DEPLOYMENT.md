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

---

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
