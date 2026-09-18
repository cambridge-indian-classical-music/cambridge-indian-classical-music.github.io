# Self-built ticketing — a scope

## The short version

This document scopes what it would take to build the society's own ticketing
system on Stripe, because somebody asked for the scope. **It is not a plan to
build it, and nothing here has been implemented.**

The scope exists so that the next person who proposes this — and somebody will,
because the fee saving is real and visible — can read what the work actually is
rather than estimating it from the happy path.

**Recommendation: do not build it.** The saving is about **£106 a year** against
the cheapest credible platform. The trigger written down in ARCHITECTURE.md
section 5 has not fired. What follows is the evidence for that, and the
non-negotiables if a future committee decides otherwise.

There is a cheaper split at the end that gets most of the saving without a
payment backend. Read that before reading the rest.

---

## What was asked for

Five requirements, as stated:

1. Collect buyer information, including a student ID
2. Let a buyer choose how many tickets to purchase
3. Set a capacity per event
4. On a successful purchase, decrement the remaining capacity by that quantity
5. Check attendees in at the door

Requirements 1, 2, 3 and 5 are ordinary software. **Requirement 4 is the entire
difficulty**, and it is not a decrement. See "The four hard parts".

---

## What it saves

> Figures computed September 2026 at 4 concerts a year, 120 tickets each (480
> tickets), £12 average, with the society absorbing fees. Re-derive before acting
> on them — the reasoning ages better than the numbers.

| Approach                        | Per ticket | Per year |
| ------------------------------- | ---------- | -------- |
| TryBooking, absorbing both fees | £0.75      | £360     |
| Ticket Tailor + own Stripe      | £0.60      | £288     |
| **Self-built + own Stripe**     | **£0.38**  | **£182** |

**Against Ticket Tailor, building saves about £106 a year.** Against TryBooking
absorbing both fees, about £178.

The earlier costing in `docs/TICKETING.md` put the saving at £60 a year. That
figure assumed 40 tickets a concert. At 120 it is roughly £150 against the
provider then in use — larger than recorded, and worth correcting there, but
still inside the range where the question is "what does maintaining this cost in
committee time?" rather than "can we afford not to?".

One ticket per concert, near enough, same as it was.

---

## Shape, if it were built

The static site stays static. ADR-001 and ADR-007 survive intact — this is a
**separate deployment**, not a server adapter bolted onto the website. The site
continues to hold a link; the link would simply point at something the society
runs.

- **Cloudflare Worker**, free tier. Not GitHub Pages, which serves static files
  only.
- **D1** (SQLite) for events, capacity, holds, orders and tickets.
- **Stripe Checkout** for payment — the hosted page, so card details never touch
  society-controlled code and PCI scope stays with Stripe. This part is genuinely
  easy and is not where the risk is.
- **A webhook endpoint** verifying the `Stripe-Signature` header on every request.
- **A transactional email provider** to deliver tickets.
- **An authenticated check-in page** reading a signed token from a QR code.

Roughly 400–600 lines, plus deployment configuration. Two days to write. The
writing is not the cost.

### Data model sketch

```
events   (id, name, capacity, price_pence, on_sale)
holds    (session_id, event_id, qty, expires_at)
orders   (id, session_id, event_id, qty, name, email, student_id, created_at)
tickets  (id, order_id, token_hash, checked_in_at)
```

`holds` is the table that does not exist in anybody's mental model when they
estimate this work, and it is the one that matters.

---

## The four hard parts

### 1. Capacity is a reservation problem, not a counter

"Deduct on successful purchase" cannot work. Payment is not instantaneous — a
buyer sits on Stripe's checkout page for anywhere from thirty seconds to thirty
minutes. Decrement on success and two people can both be told sixty seats remain,
both pay, and the hall oversells. Decrement on click and an abandoned checkout
strands seats nobody can buy.

The correct shape:

1. On "buy N", open a transaction, compute `sold + held`, reject if
   `sold + held + N > capacity`, otherwise write a hold with
   `expires_at = now + 30 minutes`, commit.
2. Create the Stripe Checkout Session with a matching expiry.
3. On `checkout.session.completed`, convert the hold to an order and issue
   tickets.
4. On `checkout.session.expired`, delete the hold.
5. Run a sweeper for holds whose webhook never arrived at all.

Every one of those five steps has a failure mode involving somebody's money:

- **The webhook never arrives.** Stripe retries, but if the Worker is down past
  the retry window there is a paid order with no ticket and no record. That needs
  a reconciliation job querying Stripe for sessions the database never saw.
- **Duplicate delivery.** Stripe delivers at-least-once. Without idempotency
  keyed on the event ID, a retry issues a second set of tickets for one payment.
- **The hold expires while payment succeeds.** A narrow race, and it oversells.

None of this is exotic. All of it is the sort of thing that works in testing,
works for two years, and then fails on the one night the hall is full.

**The specific danger at handover** is that this logic looks like overhead. A
future maintainer reading step 1 sees a transaction wrapped around what appears
to be a simple count and removes it, or replaces the hold table with a counter.
The system keeps working until the first concert that actually sells out.
`docs/TICKETING.md` records the same pattern with SumUp's unsigned webhooks: the
dangerous edit is the one that looks like a tidy-up.

### 2. Ticket emails cannot be sent from the society's own domain

Requirement 4 implies issuing a ticket, which means transactional email that
lands in an inbox rather than a spam folder. That needs SPF, DKIM and DMARC
records on the sending domain.

**The society does not control its own DNS.** The address is a subdomain of
`societies.cam.ac.uk`, allocated by University IT; changing records means
emailing `ip-register@uis.cam.ac.uk` and waiting on their timescale, as
`docs/HANDOVER.md` records. That is a fine property for a website — nothing to
renew, nothing to lose at handover — and a genuinely awkward one for
transactional email.

The practical routes are sending from a third-party provider's own domain, which
hurts deliverability and looks less trustworthy, or negotiating records on a
subdomain with UIS, which is slow and must be re-negotiated if the provider
changes.

Deliverability is the worst failure mode in this whole document because it fails
**silently and per-recipient**. Nothing errors. A proportion of buyers simply
never receive a ticket, and the society finds out at the door.

### 3. The society becomes the data controller

Requirement 1 means storing names, email addresses and student ID numbers in a
database the society runs. That is personal data, and self-hosting it makes the
society the **data controller** rather than a customer of a processor who carries
the obligations under contract.

Concretely, and annually inherited: a lawful basis and a privacy notice, a
retention period with something that actually deletes expired records, the
ability to answer a subject access request, and a 72-hour breach notification
duty if the database leaks. A student ID alongside a name is more identifying
than either alone.

A ticketing platform absorbs all of this. It is the single least visible cost of
building, and the one most likely to be discovered by a committee that did not
build it.

### 4. Check-in needs to be atomic too

The same concurrency problem, smaller stakes. Two people scanning at one door
must not both admit the same QR code. Marking a ticket used has to be a
conditional update — `WHERE checked_in_at IS NULL` — not a read-then-write, and
the door needs to behave sensibly with no signal in a stone chapel.

---

## What it costs to hand over

This is the part the fee comparison never captures. Every year, to a new
committee:

- A **live Stripe secret key** and a **webhook signing secret**, which must be
  rotated when a committee member leaves, in a system where rotating them wrongly
  stops ticket sales.
- A **database that must be backed up**, and whose loss loses the attendee list.
- A **sweeper job** that must keep running, and whose silent failure strands
  capacity.
- **Dependency updates**, on a payment system, by whoever is available.
- Enough understanding of the hold algorithm that nobody optimises it away.
- Somebody who will answer the phone at 19:00 on a concert night.

`docs/HANDOVER.md` is built on the premise that the website survives because
there is nothing to be on call for. This adds the first thing.

---

## Non-negotiables, if it is ever built

Recorded here so they are not rediscovered by accident:

1. **Stripe Checkout, hosted.** No card fields in society-controlled code, ever.
   PCI scope stays with Stripe.
2. **Verify the webhook signature on every request**, and key idempotency on the
   Stripe event ID.
3. **Capacity is enforced in one transaction** against `sold + held`. Never a
   bare counter. Comment it with why, not what.
4. **The Stripe account belongs to the society**, tied to the society bank
   account — the constraint in `docs/TICKETING.md` and ARCHITECTURE.md section 5
   that gates every option, bought or built.
5. **The website stays static.** This deploys separately. ADR-001 is not traded
   away for it.
6. **A documented retention period, and something that enforces it.**
7. **A manual fallback that works with the system down** — an exported list and a
   pen. It will be needed.

---

## The cheaper split

Requirements 1–4 are the dangerous half: money, concurrency, webhooks, personal
data. Requirement 5 is the safe half. They do not have to be bought or built
together.

**Buy 1–4.** A hosted platform on the society's own Stripe account covers buyer
information, quantity, capacity and decrement at £0 platform fee, or £0.22 a
ticket for one with a business model that does not depend on a free tier
surviving. That is the whole of the risk, carried by somebody else, for roughly
£106 a year.

**Then requirement 5 is barely a build.** At 120 attendees, check-in is an
exported list and somebody ticking names. No scanner, no QR, no backend, no
shared state, nothing to hand over. If something nicer is wanted, a static page
in the existing Astro site that loads an exported CSV and ticks off locally —
still no server, still no secrets, and it fails safe because the fallback is the
printed list it replaced.

This captures most of the saving and none of the four hard parts.

---

## Verify before starting, if it ever starts

Unverified assumptions in this document, flagged rather than buried:

- **Whether Stripe's UK processing fees carry VAT.** Core card processing is
  generally VAT-exempt as a financial service, but the treatment differs across
  Stripe's products and contracting entities. The society has a Stripe account;
  an actual invoice settles it. It moves the £182 figure by up to 20%.
- **Whether a hosted platform's capacity limit counts tickets or orders.**
  `docs/TICKETING.md` records that Stripe Payment Links cap **completed sessions,
  not tickets**, so adjustable quantity turns a 40-session cap into 400 tickets.
  Any platform relied on for requirement 3 must be tested against this
  specifically, by buying two tickets in one order and watching the counter.
- **Whether UIS will add DKIM records on a `societies.cam.ac.uk` subdomain**, and
  on what timescale. This gates requirement 4 and has not been asked.

---

## The trigger, restated

ARCHITECTURE.md section 5 says to revisit this "only if the society outgrows what
a ticketing platform will do, and only once the saving is worth more than a
payment backend maintained by volunteers."

**Neither condition is met.** No platform requirement has been outgrown — the
five requirements above are ordinary features that several platforms provide as
standard. And £106 a year does not buy a payment backend maintained by
volunteers; it buys about one extra ticket per concert.

The condition that would change this is scale. At several thousand tickets a
year, per-ticket fees compound and the arithmetic genuinely reverses. At 480 it
does not.
