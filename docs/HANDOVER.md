# Handover

**Read this first if you have just taken over the website.**

The code is the easy part. The thing that actually kills a society website is
**losing access to the accounts that control it** — someone graduates, their
personal email stops being read, and nobody can reach the repository or the
ticketing account any more. This document exists to stop that happening.

---

## The rules that matter

Four rules. If a future committee keeps only these, the website survives.

1. **Everything is registered to a society email address, never a personal one.**
   A personal Gmail or a `@cam.ac.uk` address stops being read the moment
   somebody graduates.
2. **At least two current committee members have full access to every account.**
   One person cannot be the single point of failure — people go on holiday,
   intermit and leave.
3. **Two-factor recovery codes are stored somewhere the society keeps**, not on
   one person's phone. Losing the second factor with no recovery code means
   losing the account permanently.
4. **Access is transferred _before_ the outgoing committee leaves**, not after.
   Chasing a graduate who has moved abroad rarely works.

The society email account is the root of all of it: it can reset the password on
everything else. Guard it accordingly.

---

## Accounts the society needs to own

Fill this in and keep it current. It is the single most valuable page in this
repository.

| Service                    | What it does                                                  | Cost             | Who has access | Notes                                                                                                         |
| -------------------------- | ------------------------------------------------------------- | ---------------- | -------------- | ------------------------------------------------------------------------------------------------------------- |
| **Society email**          | Recovery address for everything below                         | —                |                | The master key. Set it up first                                                                               |
| **GitHub organisation**    | Holds the repository, hosts the site                          | Free             |                | Must be an organisation, not a personal account. The repository must be **public**                            |
| **University subdomain**   | The web address                                               | Free             | UIS            | Not an account. Allocated by University IT — nothing to renew, nobody to hand over                            |
| **Ticketing provider**     | Selling tickets                                               | Per-ticket fee   |                | Must be a **society** account, not a personal one — see [TICKETING.md](TICKETING.md)                          |
| **GitHub OAuth app**       | Sign-in for `/admin`, _if_ set up                             | Free             |                | Optional. Omit if not using the CMS                                                                           |
| **Cloudflare**             | CMS sign-in or analytics, _if_ set up                         | Free             |                | Optional, and not needed for hosting. Omit unless one of those is actually set up                             |
| **Society Google account** | Drive, the membership spreadsheet, and the form that fills it | Free             |                | Owns the Apps Script **deployment**, which runs as this account. See [MEMBERSHIP_FORM.md](MEMBERSHIP_FORM.md) |
| **Stripe**                 | Membership payments                                           | Per payment      |                | Society account, society bank account. See [TICKETING.md](TICKETING.md)                                       |
| **Society bank account**   | Receiving ticket income                                       | Free–£8.50/month |                | Two signatories, held by the society. See [TICKETING.md](TICKETING.md)                                        |
| **Password manager**       | Holds the above credentials                                   | Free–£           |                | Or the Students' Union's arrangements                                                                         |

**Hosting is on GitHub**, not on a separate account (ADR-007). That was chosen
partly so this table is one line shorter: whoever has the GitHub organisation has
the website. The trade-offs are in [DEPLOYMENT.md](DEPLOYMENT.md).

### The domain used to be the one that bit — it no longer is

**Settled September 2026.** The address is a subdomain of `societies.cam.ac.uk`,
allocated by University IT rather than bought from a registrar. That removes the
single most dangerous item this checklist used to carry: there is no annual
renewal, no payment card that graduates with its owner, and no lapse that takes
the website down before anyone notices. **The domain is not an account and cannot
be lost at handover.**

Two things still worth knowing:

- **It is not yours to re-point casually.** Changing where the name points means
  emailing `ip-register@uis.cam.ac.uk` and waiting on their timescale. That is
  the reason hosting was chosen to be stable rather than clever — see ADR-007.
- **Eligibility depends on the society remaining established.** The allocation is
  for _"an established University society"_. If the society lapses and is later
  revived, expect to ask for the name again.

**This project now has no guaranteed recurring cost at all.** Every remaining
line in the table above is free, or charged per ticket sold.

### The ticketing account has roles — use them

TryBooking gives every person their **own username and password**, with six
permission levels. Set it up this way and handover becomes adding and removing
people rather than passing a shared password down the years.

**The society email address must hold the Account Owner role.** There can only be
one Account Owner at a time, and — this is the trap — when somebody else accepts
that role, **the previous owner is automatically demoted to Power User**. So
making a committee member the Account Owner silently moves the root of the
account onto a personal address. Since only the Account Owner can transfer
ownership, a student who graduates without remembering to hand it back leaves the
account stranded behind an inbox nobody reads.

Keep the society email as Account Owner permanently and ownership never has to
transfer at all. Committee members come and go around a fixed root.

| Role                 | Give it to                                         |
| -------------------- | -------------------------------------------------- |
| **Account Owner**    | The society email address. Nobody personally       |
| **Power User**       | Treasurer and one other — can invite everyone else |
| **Bookings Manager** | Whoever runs the door                              |
| **Producer User**    | Committee members who only need to see the numbers |

**Bookings Manager is worth knowing about.** It allows full booking management —
find, resend, move, refund — while protecting account settings including
**banking**. That is the role for somebody helping at a concert who has no
business seeing the bank details.

Each person accepts an activation email and sets their own password, so nobody
shares credentials and removing one person disturbs nobody else.

---

## Annual handover checklist

Work through this with the outgoing committee, ideally in one sitting together.

### Before the outgoing committee leaves

- [ ] New committee members added to the **GitHub organisation**, with at least
      two as **Owners**
- [ ] New members added to the **ticketing provider** account
- [ ] New members able to sign in to the **society Google account**, and the
      Apps Script behind the membership form confirmed as owned by **that
      account and not a person** — Apps Script → Project Settings names the
      owner. This one is worth doing carefully: the form runs as whoever
      deployed it, so if that was a student, it stops working when they graduate
      and it stops **silently**, with the website still showing a form that
      quietly fails. See [MEMBERSHIP_FORM.md](MEMBERSHIP_FORM.md)
- [ ] A test membership application submitted end to end, and the row checked
- [ ] New members added to the **Cloudflare** account, _only if_ the CMS sign-in
      worker or analytics are set up — most committees will have neither
- [ ] Credentials and **two-factor recovery codes** transferred to the society
      password manager
- [ ] Confirmed the **society email** is being read by someone continuing
- [ ] Table above updated with who now has access
- [ ] Someone new has **made a change to the website and published it**, start to
      finish, with the outgoing committee watching. This is the real test — do
      not skip it
- [ ] Confirmed the **University subdomain** still resolves and its certificate
      is valid — there is nothing to renew, but it is worth looking

### After they have left

- [ ] Departing members **removed** from GitHub, the ticketing provider, and
      Cloudflare if it is in use
- [ ] Removing someone from the **GitHub organisation** is what actually stops
      them editing the website — the `/admin` page is public and always was, so
      there is no separate list to prune
- [ ] Passwords on shared accounts **changed**
- [ ] `src/content/committee.yml` updated — see
      [CONTENT_GUIDE.md](CONTENT_GUIDE.md)
- [ ] Contact address in `src/site.config.ts` still correct

### Once a year, worth checking

- [ ] The site still builds — open the **Actions** tab on GitHub and check
      recent runs are green
- [ ] Any Dependabot pull requests merged (see [MAINTAINING.md](MAINTAINING.md))
- [ ] Old events still read sensibly
- [ ] The membership spreadsheet is **not** shared as "anyone with the link"
- [ ] Last year's unpaid membership applications deleted — the retention rule in
      [MEMBERSHIP_FORM.md](MEMBERSHIP_FORM.md); nothing enforces it by itself
- [ ] **The membership year rolled over**, when a new one opens: `SHEET_NAME`
      and `MEMBERSHIP_YEAR` in the Apps Script changed **together**, plus a new
      file in `src/content/membership/`. Changing only one of the two properties
      fails silently — applications keep arriving, carrying last year's
      reference. [MEMBERSHIP_FORM.md](MEMBERSHIP_FORM.md) has the table
- [ ] Committee list and About page current

---

## What to do when something is wrong

| Symptom                                          | Where to look                                                                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| The site is completely offline                   | <https://www.githubstatus.com> first — the domain cannot expire, so this is almost always GitHub. See [DEPLOYMENT.md](DEPLOYMENT.md) |
| A change was merged but the site has not updated | The **Deploy** workflow on GitHub's Actions tab                                                                                      |
| A pull request shows a red cross                 | A content mistake — [CONTENT_GUIDE.md](CONTENT_GUIDE.md) lists the common messages                                                   |
| A page shows the wrong thing                     | Edit the content file; or revert the change on GitHub                                                                                |
| Nobody can log in to something                   | Recovery codes in the password manager. If those are gone, the society email can usually reset it                                    |
| CI fails on "no credentials are committed"       | Something shaped like a key reached the repository. See below — do not just delete the line and push                                 |
| Membership applications have stopped arriving    | [MEMBERSHIP_FORM.md](MEMBERSHIP_FORM.md), "When it goes wrong" — usually a replaced deployment URL, or a closed Google account       |

### If a secret was committed

The repository is public, so **the moment it is pushed the secret is
compromised** — however quickly it is removed, and whether or not anybody is
believed to have seen it. Git keeps the old commit, and GitHub keeps it reachable
for a while even after a force-push.

In this order, and the order is the point:

1. **Rotate or revoke the credential first.** Generate a new one, put the new one
   wherever it belongs, and confirm the old one no longer works. This is the step
   that actually ends the exposure, and it works even if every step below fails.
2. **Then remove it from the history**, not just from the current files. A commit
   that deletes a key leaves the key in the previous commit.
3. **Then work out how it got in**, and whether `.gitignore`,
   `tests/no-secrets.test.js` or [CLAUDE.md](../CLAUDE.md) should have caught it.

**Deleting the line and pushing is not a fix.** It is the most natural thing to
do and it leaves the secret readable in the history while making everyone
believe it has been handled.

The good news is that there should be nothing to leak: this system is built to
hold no credentials at all — see the note at the end of this document.

### If access to an account is genuinely lost

1. Try a password reset to the **society email**.
2. If the second factor is the problem, use the **recovery codes**.
3. If both are gone, contact the provider's support. GitHub and most providers have
   account-recovery processes for organisations, but they take time and proof.
4. Worst case, most of it is recoverable: **the entire website is in this
   repository**, and any committee member with a copy can publish it elsewhere.
   That is a deliberate property of the design (ADR-004) — content lives in
   readable text files, not in a service that can lock you out.

---

## Handing over to a new developer

Someone technical taking over the site should read, in order:

1. [README.md](../README.md) — what this is and how to run it (10 minutes)
2. [CLAUDE.md](../CLAUDE.md) — the rules that apply to every change, whoever or
   whatever is making it. Short, and binding. Rule 1 is that no secret is ever
   committed, because this repository is public
3. [`src/content.config.ts`](../src/content.config.ts) — everything the site
   knows about, written to be read
4. [ARCHITECTURE.md](../ARCHITECTURE.md) — why it is built this way, and what was
   deliberately left out
5. [MEMBERSHIP_FORM.md](MEMBERSHIP_FORM.md) — only if you are touching joining.
   It is the one part of the system with moving pieces outside this repository

Then run `npm install && npm run dev`.

Three things to know before making changes:

- **The audience for this codebase is the next non-technical committee**, not
  other developers. Cleverness that makes the site harder to hand over is a
  regression, even if the code is better.
- **ARCHITECTURE.md section 5** lists the decisions deliberately left open. If
  you are about to solve one of them, the reasoning for deferring it is there.
- **This system deliberately holds no credentials**, and that is worth
  protecting. There is no API key, no service account and no token anywhere in
  it: the joining form reaches its spreadsheet because Apps Script runs as the
  society's own Google account (ADR-012), and publishing uses a token GitHub
  mints for a single workflow run (ADR-007). If you find yourself about to
  create a service account or paste a key somewhere, that is a design decision
  to argue for in writing first — not an implementation detail. Every credential
  introduced is one more thing to rotate, store and hand over every year.
