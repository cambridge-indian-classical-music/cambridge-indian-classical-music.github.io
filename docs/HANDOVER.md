# Handover

**Read this first if you have just taken over the website.**

The code is the easy part. The thing that actually kills a society website is
**losing access to the accounts that control it** — someone graduates, their
personal email stops being read, and nobody can renew the domain or change the
hosting. This document exists to stop that happening.

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

| Service                  | What it does                          | Cost             | Who has access | Notes                                                                                |
| ------------------------ | ------------------------------------- | ---------------- | -------------- | ------------------------------------------------------------------------------------ |
| **Society email**        | Recovery address for everything below | —                |                | The master key. Set it up first                                                      |
| **GitHub organisation**  | Holds the repository, hosts the site  | Free             |                | Must be an organisation, not a personal account. The repository must be **public**   |
| **Domain registrar**     | The web address                       | ~£10–15/year     |                | **Renews annually — see below**                                                      |
| **Ticketing provider**   | Selling tickets                       | Per-ticket fee   |                | Must be a **society** account, not a personal one — see [TICKETING.md](TICKETING.md) |
| **GitHub OAuth app**     | Sign-in for `/admin`, _if_ set up     | Free             |                | Optional. Omit if not using the CMS                                                  |
| **Cloudflare**           | CMS sign-in or analytics, _if_ set up | Free             |                | Optional, and not needed for hosting. Omit unless one of those is actually set up    |
| **Society bank account** | Receiving ticket income               | Free–£8.50/month |                | Two signatories, held by the society. See [TICKETING.md](TICKETING.md)               |
| **Password manager**     | Holds the above credentials           | Free–£           |                | Or the Students' Union's arrangements                                                |

**Hosting is on GitHub**, not on a separate account (ADR-007). That was chosen
partly so this table is one line shorter: whoever has the GitHub organisation has
the website. The trade-offs are in [DEPLOYMENT.md](DEPLOYMENT.md).

### The domain is the one that bites

Everything else is free and fails visibly. The domain renews once a year, costs
money, and when it lapses the website simply disappears — often weeks before
anyone notices, and by then someone else may have registered it.

- Turn on **auto-renew**, and make sure the payment card on file is the
  society's, not a graduating student's.
- Point renewal notices at the **society email**.
- Put the renewal date in the committee calendar as well. Do not rely solely on
  the registrar's email.

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
- [ ] New members added to the **domain registrar** account
- [ ] New members added to the **ticketing provider** account
- [ ] New members added to the **Cloudflare** account, _only if_ the CMS sign-in
      worker or analytics are set up — most committees will have neither
- [ ] Credentials and **two-factor recovery codes** transferred to the society
      password manager
- [ ] Confirmed the **society email** is being read by someone continuing
- [ ] Table above updated with who now has access
- [ ] Someone new has **made a change to the website and published it**, start to
      finish, with the outgoing committee watching. This is the real test — do
      not skip it
- [ ] Domain renewal date and payment method confirmed

### After they have left

- [ ] Departing members **removed** from GitHub, the registrar, the ticketing
      provider, and Cloudflare if it is in use
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
- [ ] Committee list and About page current

---

## What to do when something is wrong

| Symptom                                          | Where to look                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| The site is completely offline                   | Domain expired (check the registrar), then <https://www.githubstatus.com> — see [DEPLOYMENT.md](DEPLOYMENT.md) |
| A change was merged but the site has not updated | The **Deploy** workflow on GitHub's Actions tab                                                                |
| A pull request shows a red cross                 | A content mistake — [CONTENT_GUIDE.md](CONTENT_GUIDE.md) lists the common messages                             |
| A page shows the wrong thing                     | Edit the content file; or revert the change on GitHub                                                          |
| Nobody can log in to something                   | Recovery codes in the password manager. If those are gone, the society email can usually reset it              |

### If access to an account is genuinely lost

1. Try a password reset to the **society email**.
2. If the second factor is the problem, use the **recovery codes**.
3. If both are gone, contact the provider's support. GitHub and most registrars have
   account-recovery processes for organisations, but they take time and proof.
4. Worst case, most of it is recoverable: **the entire website is in this
   repository**, and any committee member with a copy can publish it elsewhere.
   That is a deliberate property of the design (ADR-004) — content lives in
   readable text files, not in a service that can lock you out.

---

## Handing over to a new developer

Someone technical taking over the site should read, in order:

1. [README.md](../README.md) — what this is and how to run it (10 minutes)
2. [`src/content.config.ts`](../src/content.config.ts) — everything the site
   knows about, written to be read
3. [ARCHITECTURE.md](../ARCHITECTURE.md) — why it is built this way, and what was
   deliberately left out

Then run `npm install && npm run dev`.

Two things to know before making changes:

- **The audience for this codebase is the next non-technical committee**, not
  other developers. Cleverness that makes the site harder to hand over is a
  regression, even if the code is better.
- **ARCHITECTURE.md section 5** lists the decisions deliberately left open. If
  you are about to solve one of them, the reasoning for deferring it is there.
