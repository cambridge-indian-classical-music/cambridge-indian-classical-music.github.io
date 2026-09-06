# Ticketing

## The short version

**The website never handles money.** An event holds a link; clicking it takes the
visitor to a ticketing company's own site, where they pay. That is the whole
design.

```yaml
ticketUrl: https://www.eventbrite.co.uk/e/your-event-123456
ticketProvider: eventbrite # only changes the button wording
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

> **Fees checked September 2026.** Payment pricing changes; re-check the
> providers' own pages before acting on the numbers below. The _reasoning_ ages
> better than the figures — read that first.

### The thing that matters: fixed fees, not headline percentages

Society tickets are cheap — usually £5 to £10. At that size a flat "+20p" costs
more than the percentage does, so the provider with the lowest advertised rate is
often not the cheapest. **Compare the fee on an actual ticket price, never the
headline percentage.**

| Provider       | Rate                     | Fee on £8 | Fee on £10 | Effective      |
| -------------- | ------------------------ | --------- | ---------- | -------------- |
| **Eventbrite** | 6.95% + 59p              | £1.15     | £1.29      | **12.9–14.3%** |
| Square         | 1.4% + 25p               | £0.36     | £0.39      | 3.9–4.5%       |
| **Stripe**     | 1.5% + 20p               | £0.32     | £0.35      | 3.5–4.0%       |
| **SumUp**      | ~1.69%, **no fixed fee** | £0.14     | £0.17      | **1.69%**      |
| Open banking   | ~20p flat                | £0.20     | £0.20      | 2.0–2.5%       |
| Bank transfer  | —                        | £0        | £0         | 0%             |

### Recommendation: SumUp for paid tickets

SumUp charges a percentage with **no fixed pence component**, which is the whole
argument at these prices. Stripe's 20p is already 2.5% of an £8 ticket before its
own percentage applies.

Stripe only becomes cheaper above roughly **£105 per transaction**. The society
will not sell a £105 ticket, so SumUp wins on every realistic concert.

Two caveats to check before committing:

- Published sources disagree on SumUp's online rate (1.69% versus 2.5%). Even at
  2.5% it beats Stripe below £20 a ticket, but confirm it on SumUp's own page.
- SumUp also sells card readers, which are useful for payments on the door.

**Stripe remains an excellent second choice** and is better documented. If
whoever sets this up is more comfortable with Stripe, the difference is a few
pounds per concert — not worth agonising over.

### The saving that actually matters

At a realistic 40 tickets at £8 — £320 a concert:

| Provider      | Lost in fees |
| ------------- | ------------ |
| Eventbrite    | **~£46**     |
| Stripe        | ~£13         |
| SumUp         | ~£5          |
| Bank transfer | £0           |

Eventbrite costs roughly **nine times** what SumUp does. Moving from Stripe to
SumUp saves about £8 a concert; moving off Eventbrite saves about £40. If only
one thing is done, do that one.

**But Eventbrite is free for free tickets**, so it remains a perfectly sensible
choice for free workshops, where it handles sign-up lists well. Providers can be
mixed per event — nothing in the site cares.

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

Weigh it honestly: bank transfer saves about **£5 a concert** against SumUp, in
exchange for twenty to thirty minutes of reconciliation by a volunteer who
changes every year. That is usually a bad trade. Offer it as a secondary option
for people who ask, not as the main route.

### Open banking — not worth it at this scale

Pay-by-bank providers (TrueLayer, Volt, Yapily) offer near-zero flat fees, but
they are sales-led and priced for volume. The integration work alone would cost
more than a decade of SumUp fees. Revisit only if ticket income grows by an order
of magnitude.

### Do not build a payment interface

Tempting, and the one thing that would genuinely damage this project.

The moment card details touch a page the society controls, it acquires
**PCI-DSS obligations** and needs a backend — which breaks the static
architecture (ADR-001) and hands the next committee a live secret key to look
after.

**Hosted payment links avoid all of it.** Stripe Payment Links and SumUp Pay by
Link both produce a URL with no code at all:

```yaml
ticketUrl: https://pay.sumup.com/b2c/XXXXX
ticketProvider: sumup
priceInfo: £8 / £5 students
```

No backend, no secret, no PCI scope, and it drops straight into the existing
content model.

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

## Adding tickets to an event

1. Create the event with your ticketing provider.
2. Copy the public booking link.
3. Add the three lines to the event file (see
   [CONTENT_GUIDE.md](CONTENT_GUIDE.md)):

   ```yaml
   ticketUrl: https://www.eventbrite.co.uk/e/your-event-123456
   ticketProvider: eventbrite
   priceInfo: £10 / £6 students and under-18s
   ```

4. Merge. The page shows a **Book on Eventbrite** button.

### Free events, or events with no booking

Leave `ticketUrl` out. The page then says "No booking needed — just come along"
instead of showing a button that goes nowhere. Use `priceInfo` for anything worth
saying about cost:

```yaml
priceInfo: Free for members, £3 otherwise. No booking required.
```

### Naming the provider is worth doing

`ticketProvider` only changes the wording of the button — "Book on Eventbrite"
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

## If Stripe Checkout is chosen later

Stripe has two routes, and it is worth knowing that the easy one exists:

**Payment Links** (recommended). Create a link in the Stripe dashboard and paste
it in as `ticketUrl`, exactly like Eventbrite. **No code, no keys, nothing to
deploy.** This is the right first step for almost every society.

**Custom checkout.** Only if you need something Payment Links cannot do —
per-ticket seat allocation, for instance. This means writing server code, which
means the site stops being purely static (ADR-001), and it introduces a **secret
key that must be kept out of this repository**.

If you get there:

- Put the endpoint in a Cloudflare Worker or Pages Function, not in this site.
- The **secret key** goes in the platform's encrypted environment settings, never
  in Git. Only the **publishable** key may appear in the site.
- Verify webhooks with the signing secret.
- Never store card details anywhere. Stripe holds them; the society does not.

Before doing any of this, ask whether the fee saving justifies handing a new
committee a system with a live secret key in it. Usually it does not.

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
