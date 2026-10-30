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

These settings live in GitHub, not in any file here, so a pull request cannot
change them and nothing in this repository will notice if they are switched off.
This list is the record of what they should be. **Check them at each handover.**

**Settings → Branches → Add branch protection rule** for `main`:

- **Require a pull request before merging**, with **1 approval**. A second
  committee member looks at every change before the public sees it.
- Under it, tick **Require approval of the most recent reviewable push**.
  Otherwise an approval stays valid when more commits are pushed afterwards,
  and those can be merged without anyone having looked at them. Leave **Dismiss
  stale pull request approvals** off: it also throws an approval away when
  someone merely clicks **Update branch**, which changes nothing they wrote.
- **Require status checks to pass** — search for and select
  **`Format, types, build and tests`**. That is the job inside the Checks
  workflow; the workflow's own name, "Checks", does not appear in the list.
- Leave **Allow force pushes** and **Allow deletions** off.
- Leave **Do not allow bypassing the above settings** off. Repository admins
  can then merge without an approval when nobody else is around to give one —
  everyone else still needs one. Keep the number of admins small for that
  reason, and give new committee members **Write** access rather than Admin.

This matters more than it did before. The Deploy workflow can publish, so the
protection on `main` is what stands between a bad change and the live site.

**Organisation → Teams → New team**, named **`committee`**:

- Add every current committee member to it.
- In the team's **Repositories** tab, give it **Write** access to this
  repository. The organisation's default for members is read-only, so without
  this team a committee member who is not an Owner cannot push a branch or open a
  pull request from it.
- `.github/CODEOWNERS` names this team, so GitHub asks it to review every pull
  request automatically. Leave **Require review from Code Owners** off in the
  branch protection rule — any one approval will do; the file only decides who
  is asked.

**Organisation → Settings → Member privileges → Repository creation:** turn it
**off**, so only Owners can create repositories. This is less harmless than it
looks. GitHub publishes a Pages site from _any_ repository in the organisation
under this site's custom domain — a repository called `test` with Pages switched
on appears at `indianclassicalmusic.societies.cam.ac.uk/test` — and nothing on
that path goes through the review that protects `main`.

**Settings → General → Pull Requests:**

- **Allow squash merging** only, with the default commit message set to
  **pull request title**. Turn off merge commits and rebase merging. Each pull
  request then becomes one commit on `main`, named after the pull request, so the
  history reads as a list of changes rather than a list of attempts.
- **Allow auto-merge.** A pull request can be approved and left to merge itself
  when its checks pass — useful for Dependabot's.
- **Always suggest updating pull request branches.**
- **Automatically delete head branches.** This deletes the branch on GitHub
  after merging, not anyone's local copy; a merged pull request still has a
  **Restore branch** button.

**Settings → Advanced Security** (free for public repositories):

- **Dependabot security updates** — on. Without this, Dependabot only _warns_
  about a vulnerable dependency; with it, a pull request fixing it arrives
  straight away.
- **Secret scanning** and **Push protection** — on. GitHub then refuses a push
  that contains a recognisable credential, before it becomes public. This backs
  up rule 1 of CLAUDE.md and `tests/no-secrets.test.js`, which can only catch a
  secret after it has been committed.

Under **Settings → Actions → General**, leave workflow permissions as
**read-only**, and leave **Allow GitHub Actions to create and approve pull
requests** off. The Deploy workflow asks for the extra permissions it needs in
its own file, which is the safer way round.

### 5. Custom domain

**Done, October 2026.** The site is at
<https://indianclassicalmusic.societies.cam.ac.uk/>, with HTTPS enforced. This
section records what was set up, how to check it, and what went wrong on the way,
because the next person to touch it will be doing so because something broke.

The address is a **subdomain of the University's own domain**, allocated by
University IT (UIS) rather than bought from a registrar. **It costs nothing and
cannot expire**, but the DNS records belong to a third party: changing them means
emailing `ip-register@uis.cam.ac.uk` and waiting on their timescale. UIS's rules
for pointing a University name at an outside host are at
<https://www.dns.cam.ac.uk/ipreg/offsite.html>. In short: the society is eligible
for a `societies.cam.ac.uk` name as _"an established University society"_, and
the host must serve only Cambridge-related material under it.

#### What UIS actually set up

We asked for a single CNAME record. **UIS set up something different**: they
made `indianclassicalmusic.societies.cam.ac.uk` its own small DNS zone, with
these records.

| Type  | Value                                                                                          |
| ----- | ---------------------------------------------------------------------------------------------- |
| A     | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`                     |
| AAAA  | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`     |
| CNAME | `www.indianclassicalmusic.societies.cam.ac.uk` → `cambridge-indian-classical-music.github.io.` |

That works, and GitHub treats the address as an apex domain because of it. The
cost is that **those eight addresses are copied by hand from GitHub's
documentation**, so they are wrong if they were mistyped, and they go stale if
GitHub ever changes them. A CNAME would have neither problem.

**If the records ever need changing anyway, ask UIS to replace all eight with
this one record:**

```
indianclassicalmusic.societies.cam.ac.uk.    CNAME    cambridge-indian-classical-music.github.io.
```

It points at the organisation's `github.io` name, **not** at the repository
name. GitHub's documentation is explicit: _"The `CNAME` record should always
point to `<user>.github.io` or `<organization>.github.io`, excluding the
repository name."_ That is what makes it durable: it stays correct if the
repository is renamed, or if the site is rebuilt in a different repository in the
same organisation.

#### How to check the records

Compare them against GitHub's list, **taken from GitHub's documentation on the
day, not from the table above**:
<https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site>

Open these in a browser. Each returns a short piece of text; the addresses are
the `"data"` values.

- A records: <https://dns.google/resolve?name=indianclassicalmusic.societies.cam.ac.uk&type=A>
- AAAA records: <https://dns.google/resolve?name=indianclassicalmusic.societies.cam.ac.uk&type=AAAA>

Every address must be on GitHub's list. **One address that is not is enough to
stop HTTPS**, even if the other seven are right.

GitHub's own verdict is in its health check, which needs admin access to the
repository and the [GitHub CLI](https://cli.github.com/):

```bash
gh api repos/cambridge-indian-classical-music/cambridge-indian-classical-music.github.io/pages/health
```

Look at `is_https_eligible`. If it is `false`, the fields beside it say why. An
empty `{}` means GitHub is still running the check; try again in a minute.

#### What went wrong the first time, and how it was found

**A one-character typo blocked HTTPS for days.** UIS entered the fourth AAAA
record as `2606:50c0:8004::153` instead of `2606:50c0:8003::153`. The site loaded
over plain HTTP, so it looked fine, but the **Enforce HTTPS** checkbox said
_"Unavailable for your site because your domain is not properly configured to
support HTTPS"_ and no certificate was issued.

The health check above said `is_non_github_pages_ip_present: true`: one of the
addresses was not GitHub's. GitHub's checker is open source
([github/pages-health-check](https://github.com/github/pages-health-check)),
and it refuses HTTPS if **any** A or AAAA record is outside a fixed list. The
reason is that the certificate authority (Let's Encrypt) checks the domain by
connecting to it, possibly over IPv6, and a connection to the wrong address
would fail.

The mistake was missed at first because `8000`, `8001`, `8002`, `8004` reads like
the right range at a glance. **Compare each address against GitHub's list
character by character.** Once UIS corrected it, GitHub issued the certificate
within minutes.

Two things were red herrings, and are worth knowing so they are not chased
again:

- **Some DNS resolvers, including Cloudflare's 1.1.1.1, intermittently returned
  a DNSSEC error** ("DNSKEY Missing") for the address while this was being
  investigated. That turned out to be unrelated to HTTPS. If it is still
  happening and causes trouble, the analysis at
  <https://dnsviz.net/d/indianclassicalmusic.societies.cam.ac.uk/dnssec/> is the
  thing to send UIS.
- **The Pages settings screen re-runs its DNS check every time it is opened.**
  That is normal, and is not a sign that anything is wrong.

#### On GitHub, and in this repository

1. **Settings → Pages → Custom domain** holds the address. GitHub stores it in
   the repository settings, and it survives deploys. With the Actions publishing
   source there is no `CNAME` file to commit; if you ever switch the publishing
   source to a branch, you will need one.
2. **Enforce HTTPS** is ticked, so `http://` redirects to `https://`.
3. **`site` in `astro.config.mjs`** is the new address. It builds canonical links,
   the sitemap and social previews.
4. **The membership form's `SITE_URL` Script Property** must match `site`. It is
   set in the Apps Script project, not in this repository; see
   [MEMBERSHIP_FORM.md](MEMBERSHIP_FORM.md).

**If the address ever changes, all four change together.** The order matters:
UIS changes the record first, then you enter the new domain in Settings → Pages,
and only then does GitHub request a certificate. A host cannot get a certificate
for a name it does not know it is serving, so **if you only ask UIS for the
record, visitors get a certificate error, not HTTPS.** The certificate can take
up to 24 hours. If it does not arrive, run the health check above. Removing and
re-entering the domain in Settings → Pages makes GitHub check again.

The certificate itself renews automatically. There are no certificate authority
authorisation (CAA) records on `societies.cam.ac.uk`, `cam.ac.uk` or `ac.uk`
(checked October 2026), so nothing blocks renewal.

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

Sveltia CMS provides a ready-made Cloudflare Worker for this:
<https://github.com/sveltia/sveltia-cms-auth>.

**Do this step before step 1** — the OAuth app needs the worker's address.

**Paste the code in by hand; do not use the "Deploy to Cloudflare" button.**
The button copies the code into a new GitHub repository and asks to connect
Cloudflare to a GitHub account, and GitHub will not let you grant that
connection access to no repositories at all. The worker does not need any of it.
Instead:

1. In the Cloudflare dashboard, **Workers & Pages → Create → Start with Hello
   World**, name it `sveltia-cms-auth`, and deploy.
2. **Edit code**, replace everything with the contents of `src/index.js` from
   the repository above, and deploy again.

The cost is that the worker never updates itself. That is acceptable — the code
is small and rarely changes — and it means nothing on Sveltia's side can change
the society's sign-in without someone choosing to.

Then, under **Settings → Variables and Secrets**, set:

- `GITHUB_CLIENT_ID` — as text
- `GITHUB_CLIENT_SECRET` — as a **secret** (encrypted)
- `ALLOWED_DOMAINS` — `indianclassicalmusic.societies.cam.ac.uk`, so only this
  site can use the worker

The worker runs on Cloudflare's free plan, which takes no card. Sign-ins use a
handful of requests against a daily allowance of 100,000.

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
