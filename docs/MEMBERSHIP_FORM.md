# The membership joining form

**What this is:** `/membership/join` on the website, a Google Apps Script web
app, a Google Sheet, and two Stripe payment links. Together they take somebody
from "I want to join" to "I have paid", and leave the society with a list of who
is a member.

This document is the setup, the handover, and the reasoning. If you are here
because something is broken, skip to [When it goes wrong](#when-it-goes-wrong).

---

## The short version

```
  /membership/join            Apps Script                Google Sheet
  (static page,        POST   (society Google      write   (the applications)
   GitHub Pages)  ─────────>   account)         ─────────>
                                   │
                                   │ sends them on to
                                   ▼
                              Stripe payment link      ← the record of who PAID
                              (£12 or £15)
```

Three things to hold on to, because everything else follows from them:

1. **The website still takes no payment and stores nothing.** It is a form that
   posts somewhere else. ADR-006 survives.
2. **Filling in the form is not joining. Paying is.** The spreadsheet is a list
   of _applications_; Stripe is the list of _members_.
3. **The reference ties the two together.** Every application gets one, it is
   written to the sheet, and it is passed to Stripe. Without it, working out who
   actually joined is a fuzzy-matching job on names people spell differently
   each time.

---

## Why a Google Sheet, and not a database

The question that prompted this was whether Google Drive offers a free database,
as an alternative to a spreadsheet. **It does not, and that turns out to be
fine.** Set out honestly, because it will be asked again:

| Option               | What it really is                          | Why not                                                                                                |
| -------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **Google Sheets**    | A spreadsheet in the society's Drive       | **Chosen.** No new account, no new cost, anyone can read it                                            |
| Google Forms         | A form that writes to a Sheet              | Cannot do the conditional questions or the two payment links. Worth reconsidering if those are dropped |
| AppSheet Databases   | Google's nearest thing to a Drive database | Free tier is for building, not for running something with users. **Verify before relying on this**     |
| Google Tables        | Was a database-ish product                 | Discontinued and folded into AppSheet. Do not go looking for it                                        |
| Firebase / Firestore | A real database, free tier, Google-owned   | Not part of Drive. A separate account, separate console, security rules to get right                   |
| Cloud SQL / BigQuery | Real databases                             | Not free, and wildly out of proportion to a hundred rows a year                                        |

**The honest summary: Sheets _is_ the database Google Drive offers.** Apps Script
is the glue that lets a form write to it.

**And a spreadsheet is the right answer here anyway**, which is worth saying
plainly because "we should use a proper database" sounds like the more
professional choice. Weigh it against the constraints in ARCHITECTURE.md
section 1:

- **Roughly a hundred rows a year.** A Sheet holds ten million cells. Scale is
  not a consideration and will not become one.
- **It is already handed over.** The society has a Drive. Using it adds **no new
  account** to the checklist in [HANDOVER.md](HANDOVER.md) — the single most
  valuable property any option here can have.
- **A non-engineer can read it, sort it, fix a typo in it, and email from it.**
  That is the actual job. The membership list is not queried; it is _looked at_,
  by whoever is running the AGM.
- **It exports.** If this whole arrangement is scrapped in three years, the data
  leaves as a CSV and nothing is trapped.

A real database would be more capable and strictly worse to hand over. That is
exactly the tie-breaker ARCHITECTURE.md section 1 asks for: _"which option is
easier to hand over?"_ rather than _"which is more capable?"_.

**What would change the answer:** members needing to log in and see their own
record, or the list becoming something software reads rather than people. Neither
is on the horizon. If one arrives, the data is a CSV and moves.

---

## What this costs the society, which is not nothing

Read this part before setting anything up. The previous arrangement — a Stripe
payment link and nothing else — meant Stripe held the member list and carried the
obligations that come with it. **This one does not.**

Storing names, dates of birth, CRSids, email addresses and phone numbers in a
spreadsheet the society controls makes the society the **data controller**. This
is hard part 3 in [SELF_BUILT_TICKETING.md](SELF_BUILT_TICKETING.md), arriving by
a different route than expected. Concretely, and inherited every year:

- **A retention period, and somebody who actually enforces it.** Applications
  that never became payments are the obvious candidate: they are of no use after
  the membership year and should be deleted. Nothing deletes them by itself.
- **An answer to "what do you hold about me, and please delete it."** Clause 6.3
  of [TERMS.md](TERMS.md) promises one.
- **A breach to report within 72 hours** if the sheet is shared wrongly. The
  most likely version of this is not an attack — it is somebody setting the
  sharing to "anyone with the link" to make something easier.
- **A reason for each field.** Which is worth pausing on:

> **Date of birth and gender were asked for, and neither is needed to administer
> a membership.** Nothing in clause 2.2 of [TERMS.md](TERMS.md) — performing,
> voting, standing for committee — turns on either. They are the two most
> sensitive fields on the form and the two with the least obvious use. If they
> are being collected for Cambridge SU's demographic reporting, or for a funding
> return, **write that reason down here**, because that is the answer somebody
> will need when a member asks. If no such reason exists, the cheapest
> data-protection improvement available is to delete the two fields.
>
> This is not an objection to collecting them. It is the note that stops a future
> committee collecting them for a reason nobody can remember.

Also worth knowing: **the CRSid is already in the student's email address** —
`abc12@trin.cam.ac.uk` is CRSid `abc12`. Asking students for both is harmless
duplication; the field earns its place for alumni, whose `cantab.net` address
does not contain it.

---

## Setting it up

About forty minutes, all of it in a browser. **Do all of it signed in as the
society Google account, not your own** — see [Handover](#handover) for why this
is the step that matters most.

### 1. The spreadsheet

1. Signed in as the society account, create a spreadsheet in the society's
   Drive. Call it something like `Membership applications 2026-27`.
2. Leave it empty. The script writes its own heading row the first time somebody
   applies.
3. From the address bar, note the **spreadsheet ID** — the long string between
   `/d/` and `/edit`.
4. **Check the sharing.** It should be visible to the committee and to nobody
   else. Never "anyone with the link".

### 2. The two Stripe payment links

In the society's Stripe account (see [TICKETING.md](TICKETING.md) — it must be a
society account, tied to the society bank account):

1. Create a product **Student membership 2026–27** at **£12**, and a **General
   membership 2026–27** at **£15**.
2. Create a payment link for each.
3. On both, switch on **name collection** and the **terms-of-service checkbox**,
   pointing at the society's published terms.
4. Copy both links.

> **The prices live in two places.** The website shows what is in
> `src/content/membership/2026-27.md`; Stripe charges what is configured in
> Stripe. Nothing keeps them in step but this sentence. **Change one, change the
> other**, and the same applies to the year in the title. This is the same
> two-copies problem as [TERMS.md](TERMS.md), handled the same way — by writing
> down which is which.

### 3. The Apps Script

1. In the spreadsheet: **Extensions → Apps Script**.
2. Delete whatever is in `Code.gs` and paste the contents of
   [`scripts/membership-form/Code.gs`](../scripts/membership-form/Code.gs).
3. **Project Settings → Script Properties**, and add all seven:

   | Property              | Value                                                 |
   | --------------------- | ----------------------------------------------------- |
   | `SPREADSHEET_ID`      | The long string from step 1                           |
   | `SHEET_NAME`          | `Applications`                                        |
   | `STRIPE_LINK_STUDENT` | The £12 payment link                                  |
   | `STRIPE_LINK_GENERAL` | The £15 payment link                                  |
   | `MEMBERSHIP_YEAR`     | `2627` — it goes into the reference, so keep it short |
   | `SITE_URL`            | `https://cambridge-indian-classical-music.github.io`  |
   | `CONTACT_EMAIL`       | `indianclassicalmusic@cambridgesu.co.uk`              |

   None of these are secrets, which is why they can be pasted into a settings
   screen rather than managed as credentials. They are here rather than in the
   code so that changing a price does not mean editing JavaScript.

   `SITE_URL` changes when the societies.cam.ac.uk subdomain is allocated — see
   ARCHITECTURE.md section 5.

4. **Deploy → New deployment → Web app**, with:
   - **Execute as:** Me _(the society account)_
   - **Who has access:** **Anyone**

   "Anyone" is required and is not as alarming as it sounds: the only thing this
   endpoint does is append a row and hand back a payment link. It holds no
   secrets and reads nothing back out. It cannot be used to read the spreadsheet.

5. Copy the **web app URL**. It starts `https://script.google.com/macros/s/` and
   ends `/exec`.

### 4. Switch it on

In `src/content/membership/2026-27.md`, uncomment `formEndpoint` and paste the
URL in. Commit it. Until that line exists, `/membership/join` says joining opens
shortly — deliberately, so that a half-finished setup never shows a form that
loses what people type into it.

### 5. Publish the terms — this is a blocker, not a nicety

The Stripe payment links carry a terms-of-service checkbox, and it needs a
**public web address** to point at. [TERMS.md](TERMS.md) is a file in a Git
repository, which is not published terms, and the copy in TryBooking is only
shown to people booking through TryBooking — which a member joining online no
longer does.

So before the first real membership is sold, the terms need to exist at an
address a member can open. The obvious home is a page on this website, which
would also give `/membership/join` something honest to link to. Nothing else in
this document is blocked by it, which is exactly why it is easy to forget.

### 6. Test it properly, with real money

Not optional, and not a formality — several of the things most likely to be
wrong here are invisible until a real payment goes through.

- [ ] Apply as a **student**, with a real `cam.ac.uk` address. Check you are sent
      to the **£12** link.
- [ ] Apply as an **alumnus**, with a `cantab.net` address. Check you are sent to
      the **£15** link.
- [ ] Apply as **neither**. Check the University questions disappear, that the
      preferred email becomes required, and that you get the **£15** link.
- [ ] Try a `gmail.com` address in the University email field. It must be
      refused.
- [ ] **Pay one of them for real**, then open that payment in Stripe and confirm
      the **reference is on it** and the email address was prefilled. This is the
      step that catches a mistyped `client_reference_id` — a wrong parameter name
      is silently ignored by Stripe rather than rejected, so the only symptom is a
      dashboard full of payments you cannot match to anybody. Refund it
      afterwards.
- [ ] Check the row in the spreadsheet: the date of birth still reads as a date
      and not as something a spreadsheet reinterpreted, and a mobile number
      starting `07` has kept its zero.
- [ ] **Turn JavaScript off and submit again.** You should land on a plain page
      with a working payment link. This is the path a student on a locked-down
      machine takes, and it is the one nobody ever tests.

---

## Running it through the year

**Once a term, and always before the AGM**, reconcile:

1. Export payments from Stripe.
2. Match them to the spreadsheet on the **reference**.
3. Fill in the `Paid` column for the ones that match.

What the mismatches mean:

| What you see                           | What happened                                                                          |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| A row with no payment                  | Somebody filled the form in and did not pay. **Not a member.** Common, and not a fault |
| A payment with no row                  | Somebody used a payment link directly. **They are a member** — add them by hand        |
| A payment at £12 from a row saying £15 | Somebody kept a student link from a previous year. Worth a look, not worth a fight     |

**Nothing enforces that a student really is a student.** The form asks, and a
`cam.ac.uk` address makes an answer plausible, but nobody types a password. That
is a deliberate choice: verifying it properly would mean Raven, and Raven for a
£3 difference is not a trade anybody would make. Treat the £12 rate as
self-certified, and if it is ever abused, notice it at reconciliation.

**At the end of the membership year**, delete the applications that never became
payments. That is the retention rule, and nothing does it for you.

---

## Handover

**The one thing that will break this:** the Apps Script is deployed under a
Google account, and it runs _as that account_. If somebody sets it up signed in
as themselves, then the form dies when they graduate and their account is closed
— and it dies **silently**, with submissions failing while the website carries on
showing a perfectly good form.

That is precisely the failure [HANDOVER.md](HANDOVER.md) exists to prevent, and
this is the first thing on the site that can suffer it.

So, in the accounts table in [HANDOVER.md](HANDOVER.md):

- The **Google account** owning the Drive, the Sheet and the Apps Script
  deployment must be the **society account**, with at least two committee
  members able to sign in.
- **Adding a committee member as an editor of the spreadsheet is not enough.**
  The deployment belongs to whoever created it.

At each handover, alongside the existing checklist:

- [ ] Confirm the Apps Script is owned by the **society Google account**, not a
      person — Apps Script → Project Settings shows the owner
- [ ] Submit a test application end to end and confirm a row appears
- [ ] Confirm the spreadsheet is **not** shared with "anyone with the link"
- [ ] Delete last year's unpaid applications

---

## When it goes wrong

| Symptom                                                | Almost always                                                                                                                                                         |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "We could not send your application"                   | The deployment was replaced and the URL changed. A **new deployment** gets a new URL — use **Manage deployments → Edit** to keep the old one                          |
| Submissions worked, then stopped, with nothing changed | The owning Google account was closed or suspended. See [Handover](#handover)                                                                                          |
| Rows appear but nobody reaches Stripe                  | A payment link property is empty or mistyped. Apps Script → **Executions** shows the error                                                                            |
| Everybody is being sent to the £15 link                | `STRIPE_LINK_STUDENT` is missing, or the student branch is being reached with no `cam.ac.uk` address                                                                  |
| The submit button appears to do nothing                | A hidden field is marked required. See the comment on `sync()` in `join.astro` — that bug has been fixed once already                                                 |
| It works in testing but not from the website           | The request stopped being a "simple" cross-origin one. `join.astro` sends form-encoded data on purpose; JSON would trigger a preflight that Apps Script cannot answer |
| Dates of birth look wrong in the spreadsheet           | Somebody removed the leading apostrophe in `record_()`. It is there so a spreadsheet cannot reinterpret `03/04/2005`                                                  |

**The fallback, when all else fails**, is the one that always works: the payment
links themselves. Send somebody the £12 or £15 link directly and write their
details down by hand. Membership does not depend on this form existing — it
depends on the payment, which is why the payment is the part nobody built.

---

## If this is ever removed

The form exists because the membership needs more than a payment link can ask
for. If a future committee decides it does not — that a name and an email are
enough — then deleting `/membership/join`, the script and the sheet, and pointing
`/membership` straight at the payment links, returns the society to the
arrangement in [TICKETING.md](TICKETING.md): Stripe holds the list, Stripe
carries the obligations, and there is nothing to hand over but a password.

That is a smaller system, and on the evidence in
[SELF_BUILT_TICKETING.md](SELF_BUILT_TICKETING.md), a smaller system is usually
the one that survives. It is a legitimate thing to want.
