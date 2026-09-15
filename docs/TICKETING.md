# Ticketing

## The short version

**The website never handles money.** An event holds a link; clicking it takes the
visitor to a ticketing company's own site, where they pay. That is the whole
design.

```yaml
ticketUrl: https://www.trybooking.com/uk/events/landing/123456
ticketProvider: trybooking # only changes the button wording
priceInfo: £10 / £6 students # free text, shown on the page
```

No card details ever reach this website, this repository, or any committee
member's computer.

---

## Why it is done this way

Taking payments directly would mean the society handling card data, refunds,
chargebacks and PCI compliance — and handing all of that to a new student every
year. That is not a reasonable thing to pass on.

Delegating to a company built for it moves the entire burden to them. The
society's only job is to publish a link. See ADR-006.

The practical benefit: **changing ticketing provider costs nothing.** No code
changes, no migration, no redesign. The site does not know or care who sells the
tickets.

---

## Choosing a provider

> **Fees checked September 2026**, each against the provider's own pricing page.
> Payment pricing changes; re-check before acting on the numbers. The _reasoning_
> ages better than the figures — read that first.

### First decide which kind of thing you need

This is the question the rest of the analysis depends on, and it is easy to skip.

- A **payment processor** (SumUp, Stripe, Square) only moves money. It takes a
  card payment and pays you. It does not know what a ticket is.
- A **ticketing platform** (TryBooking, Eventbrite) sells tickets. It caps how
  many are available, issues a QR ticket, emails it to the buyer, gives you a
  scanning app on the door and an attendee list.

Comparing their percentages directly is comparing the price of one job with the
price of five. **A payment processor cannot sell a limited number of tickets.**
If you need "only 60 seats exist", a bare payment link cannot do it — nothing is
counting. You either buy a ticketing platform or build the counting yourself
(and see "Do not build a payment interface" below for why not).

### The fee trap: fixed pence, not headline percentages

Society tickets are cheap — usually £5 to £10. At that size a flat "+20p" costs
more than the percentage does, so the provider with the lowest advertised rate is
often not the cheapest. **Compare the fee on an actual ticket price, never the
headline percentage.**

| Provider                       | Rate                   | Fee on £8 | Fee on £10 | What you get   |
| ------------------------------ | ---------------------- | --------- | ---------- | -------------- |
| **TryBooking**                 | 5% + 15p               | £0.55     | £0.65      | Full ticketing |
| **Eventbrite**                 | 6.95% + 59p            | £1.15     | £1.29      | Full ticketing |
| **SumUp** (online)             | 2.5%, **no fixed fee** | £0.20     | £0.25      | Payment only   |
| **Stripe**                     | 1.5% + 20p             | £0.32     | £0.35      | Payment only   |
| SumUp (card reader, in person) | 1.69%                  | £0.14     | £0.17      | Payment only   |
| Bank transfer                  | —                      | £0        | £0         | Nothing        |

> **Correction, September 2026.** An earlier version of this document quoted
> SumUp at **1.69% online**. That is SumUp's **card-reader** rate. Their
> published **online** rate is **2.5%** on every plan, including the £19/month
> one. The error mattered: it moved the Stripe break-even from a real £20 per
> transaction to an imaginary £105, and made SumUp look like an obvious winner
> when it is roughly a tie. Check the rate for the channel you are actually
> using.

### Recommendation: TryBooking

**Use TryBooking for paid tickets.** It charges a 5% processing fee (paid by the
society by default) plus a 15p ticket fee (paid by the buyer by default), and it
is **completely free for free events**, which covers the society's workshops.

Why it wins here:

- It does the whole job — capacity caps, multi-ticket orders, QR tickets, email
  delivery, a free scanning app for the door, and a dashboard several committee
  members can share.
- **Either fee can be reassigned** to the buyer or the society. Pass both on and
  an £8 ticket costs the buyer £8.55 and the society **nothing at all**.
- It has a **documented account-owner transfer process**, which matters more here
  than the fee does — see "Who owns the payment account" below.
- It is a UK company, so support and refunds happen in the right timezone and
  currency.

**Do not use TryBooking's Stripe payment option** for tickets at this price. It
costs 75p plus Stripe's own 1.5% + 20p — about **£1.07 on an £8 ticket**, against
£0.55 for built-in processing. The Stripe route only makes sense on expensive
tickets.

**Avoid Eventbrite for paid tickets.** At £1.15 on an £8 ticket it is roughly
twice TryBooking and about **5.7 times** what a bare payment processor costs. It
remains free for free tickets, so it is a reasonable choice for free workshops if
someone already knows it — but TryBooking is free for those too.

### The saving that actually matters

At a realistic 40 tickets at £8 — £320 a concert:

| Approach                          | Cost to the society |
| --------------------------------- | ------------------- |
| Eventbrite                        | **~£46**            |
| TryBooking (default fee split)    | £16                 |
| TryBooking (fees passed to buyer) | **£0**              |
| Bank transfer                     | £0                  |

**Moving off Eventbrite is the only fee decision worth real effort.** Everything
below that line is a few pounds a concert, which is less than the value of one
committee member's afternoon.

### Zero-commission: direct bank transfer

Genuinely zero fees, and the money lands straight in the society's account. The
commission is simply paid in a different currency — **treasurer hours**:

- No automatic reconciliation; somebody matches statement lines to names
- People mistype references, or pay from an account in someone else's name
- No instant confirmation, so a ticket cannot be issued at the moment of payment
- Refunds are manual
- No chargeback protection for the buyer

Publishing a sort code and account number is low-risk in the UK — they are
receive-only and appear on every invoice. The real risk is somebody impersonating
the society, not the digits themselves.

It also **cannot cap numbers**. Nothing counts the seats, so an event that must
not oversell cannot be run this way.

Weigh it honestly: bank transfer saves about **£16 a concert** against
TryBooking's default fee split — and **nothing at all** if the fees are passed to
the buyer instead, which costs the society the same £0 without any of the
reconciliation. In exchange it costs twenty to thirty minutes of matching
statement lines to names, by a volunteer who changes every year. That is usually
a bad trade. Offer it as a secondary option for people who ask, not as the main
route.

### Open banking — not worth it at this scale

Pay-by-bank providers (TrueLayer, Volt, Yapily) offer near-zero flat fees, but
they are sales-led, priced for volume, and sell payment rather than ticketing —
so they leave the counting, the QR tickets and the door list still to do. The
integration work alone would cost more than a decade of the fees it saves.
Revisit only if ticket income grows by an order of magnitude.

### Do not build a payment interface

Tempting, and the one thing that would genuinely damage this project. This was
costed properly in September 2026, so the next person to propose it can read the
numbers rather than re-deriving them.

**The money case for building does not exist.** A self-built system on SumUp
would cost about **£8 a concert** in processing fees against **£16** for
TryBooking — a saving of roughly **£60 a year**, or about one extra ticket sold
per concert. Pass TryBooking's fees to the buyer and the saving becomes
**negative**: buying is cheaper than building.

**What that £60 a year would buy you**, all of it inherited by a new committee
every year with nobody on call:

- a backend with a live payment API key, breaking the static architecture (ADR-001)
- webhook handling, including getting the security right — SumUp's webhooks are
  **unsigned** and carry no payment status, so every one must be re-fetched from
  their API to be trusted; a future maintainer who "optimises away" that re-fetch
  creates a silent free-ticket vulnerability
- inventory logic that survives two people buying the last two seats at once
- QR generation, PDF rendering, and transactional email deliverability (SPF,
  DKIM, DMARC on a domain the society must keep renewing)
- an admin interface, and a login system to protect it

The moment card details touch a page the society controls it also acquires
**PCI-DSS obligations**. Hosted checkout avoids that, but nothing avoids the rest.

**A warning about the obvious shortcut.** Stripe Payment Links look like they can
cap sales, but the limit counts **completed checkout sessions, not tickets**. Turn
on adjustable quantity so people can buy three at a time and a "40 session" cap
can sell 400 tickets. Payment Links also issue no QR ticket, send no ticket email
and have no scanning app. **There is no low-code middle path** — this is exactly
why the recommendation is to buy a ticketing platform.

Payment links remain the right answer when you genuinely do not need capacity
limits — an unlimited free event, or a donation:

```yaml
ticketUrl: https://buy.stripe.com/XXXXX
ticketProvider: stripe
priceInfo: £8 / £5 students
```

No backend, no secret, no PCI scope, and it drops straight into the existing
content model.

### Digital wallet passes (Apple Wallet and Google Wallet)

**Let the ticketing platform do this. Do not build it.** Investigated and
rejected September 2026; the reasoning is recorded so it is not re-litigated.

**Apple Wallet is closed to an unincorporated society**, and not because of the
~£79/year. Apple requires organisation accounts to hold a **D-U-N-S number** and
be "a corporation, limited partnership, or limited liability company" — a typical
student society is an unincorporated association and fails that test. Apple's
nonprofit **fee waiver is gated behind the same requirement**, so cost and
eligibility fail together. The only fallback is an individual membership **in one
student's legal name**, which is precisely the personal-account dependency this
project exists to avoid — and worse than most, because it expires silently when
they graduate and stop paying. Third-party services that sign passes under their
own certificate cost **£350–500 a year**, which is a fifth of the society's ticket
income.

_The one route that reopens this:_ if the society becomes a registered charity or
CIO, or can enrol under a College or the University as an accredited educational
institution. Worth checking locally before assuming it is impossible.

**Google Wallet is genuinely free and easy** — no legal-entity requirement, and
an issuer account a society can own and hand over. But it only serves Android
users, a little under half the UK, and probably fewer among students. Building it
alone would show every iPhone user a button they cannot use.

A ticketing platform has the legal entity and the Apple membership that the
society does not, so buying makes this someone else's problem. Check whether the
chosen platform issues wallet passes; if it does not, a PDF with a QR code works
on every phone ever made.

### Who owns the payment account

**The payment account must belong to the society, not to an individual.**

A payment provider account is tied to the bank account behind it. If that bank
account belongs to a committee member personally, then so does the payment
account — and it **cannot be handed over**. That would quietly reintroduce
exactly the personal-account dependency the rest of this project was designed to
remove (see [HANDOVER.md](HANDOVER.md)).

There is a second problem: society ticket income arriving in a personal or sole
trader account is not the account holder's money, but may look like their trading
income to HMRC, and the treasurer cannot reconcile an account they cannot see.

Complication worth knowing: **Cambridge SU was not accepting new society finance
accounts as of September 2026**, so an external bank account may genuinely be
necessary. If so:

- Open it as a **society account with at least two signatories**, never a
  personal or sole trader account
- **Check with Cambridge SU first** — societies are normally expected to bank
  through them, and their finance guide covers external accounts
- Register it to the society email address (see [HANDOVER.md](HANDOVER.md))

**At handover, transfer the ticketing account too.** TryBooking documents an
account-owner transfer process and supports multiple users on one box office, so
add the incoming treasurer as a user before the outgoing one leaves rather than
passing a password along. This was a deciding factor in choosing it: a ticketing
account that can only be transferred by sharing login details is not really
handoverable at all.

## Adding tickets to an event

1. Create the event with your ticketing provider.
2. Copy the public booking link.
3. Add the three lines to the event file (see
   [CONTENT_GUIDE.md](CONTENT_GUIDE.md)):

   ```yaml
   ticketUrl: https://www.trybooking.com/uk/events/landing/123456
   ticketProvider: trybooking
   priceInfo: £10 / £6 students and under-18s
   ```

4. Merge. The page shows a **Book on TryBooking** button.

Set the **capacity** on the ticketing provider's side, not here. The website
shows a link; the provider is what counts seats and stops selling.

### Free events, or events with no booking

Leave `ticketUrl` out. The page then says "No booking needed — just come along"
instead of showing a button that goes nowhere. Use `priceInfo` for anything worth
saying about cost:

```yaml
priceInfo: Free for members, £3 otherwise. No booking required.
```

### Naming the provider is worth doing

`ticketProvider` only changes the wording of the button — "Book on TryBooking"
rather than a bare "Book tickets". It is a small thing that helps: people are
rightly cautious about unexplained payment links, and naming a company they
recognise makes the button read as legitimate.

---

## Changing provider

Because nothing in the code depends on the provider, this is content editing:

1. Set the events up with the new provider.
2. For each **upcoming** event, change `ticketUrl` and `ticketProvider`.
3. Merge.

**Leave past events alone.** Their old links may be dead, but they are a record
of what happened, and no one is trying to buy a ticket to last year's concert.

If several events need changing at once, that is a handful of one-line edits —
still no code changes.

---

## If a custom checkout is ever built anyway

Read "Do not build a payment interface" above first — it has the costings, and
they do not support building. But if the society's needs genuinely outgrow an
off-the-shelf platform, these are the non-negotiables:

- **Use Stripe, not SumUp.** Stripe signs its webhooks with a shared secret, so a
  forged "payment completed" call fails verification. SumUp's webhooks are
  unsigned and do not even carry the payment status, so every event has to be
  re-fetched from their API to be believed. That difference is worth far more
  than the pennies between their rates.
- Put the endpoint in a **Cloudflare Worker or Pages Function**, not in this site.
- The **secret key** goes in the platform's encrypted environment settings, never
  in Git. Only the **publishable** key may appear in the site.
- Use **hosted checkout**, so card details are entered on the provider's domain
  and PCI scope stays minimal. Never build a card form.
- Hold seats with a **short expiry** when checkout starts, or abandoned baskets
  will eat the capacity permanently.
- Never store card details anywhere. The provider holds them; the society does not.

Before any of it, ask whether the saving justifies handing a new committee a
system with a live secret key in it. On the numbers above, it does not.

---

## Refunds, data protection and complaints

These sit with the ticketing provider, not with this website. Two things to keep
in mind:

- **The society is still the event organiser** in the eyes of a ticket buyer.
  Whatever refund policy the provider offers, the committee should be able to
  explain it and honour it.
- **Attendee lists are personal data.** They live in the provider's system, which
  is where they should stay. Do not export them into a spreadsheet in someone's
  personal cloud storage, and do not commit them to this repository — it is
  public.
