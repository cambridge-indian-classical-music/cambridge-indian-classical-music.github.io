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

| Provider                        | Rate                       | Fee on £8 | Fee on £10 | What you get   |
| ------------------------------- | -------------------------- | --------- | ---------- | -------------- |
| **TryBooking**                  | 5% + 15p                   | £0.55     | £0.65      | Full ticketing |
| **FIXR** (student rate)         | 3.99% + 49p **plus VAT**   | ~£0.97    | ~£1.07     | Full ticketing |
| **Eventbrite**                  | 6.95% + 59p                | £1.15     | £1.29      | Full ticketing |
| **SumUp** (online)              | 2.5%, **no fixed fee**     | £0.20     | £0.25      | Payment only   |
| **Stripe**                      | 1.5% + 20p                 | £0.32     | £0.35      | Payment only   |
| SumUp (card reader, in person)  | 1.69%                      | £0.14     | £0.17      | Payment only   |
| TryBooking Box Office, **cash** | 15p, **no processing fee** | £0.15     | £0.15      | Full ticketing |
| Bank transfer                   | —                          | £0        | £0         | Nothing        |

Two rows deserve a second look.

**Cash through TryBooking's Box Office app skips the processing fee entirely** —
only the 15p ticket fee applies. At a freshers' fair, where somebody is standing
there anyway, that turns a 55p fee into 15p. Card sales through Box Office are
charged normally.

**FIXR's rate is quoted excluding VAT**, unlike TryBooking's, which includes it.
Comparing like with like, FIXR's 3.99% is really 4.79% and its 49p is really 59p.
Fees are also rounded up to the nearest 10p.

**Every figure here assumes a UK card.** TryBooking applies additional surcharges
for foreign cards and some alternative payment methods, and every provider does
something similar — Stripe charges 3.15% + 20p on international cards against
1.5% + 20p domestically. For a society with a good number of international
students this is not hypothetical. It does not change which provider wins, since
they all surcharge, but the real blended rate will run slightly above the numbers
above.

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

#### FIXR, and an important qualification to "cheaper"

**The society already has a FIXR page.** The original comparison above was made
without knowing that, which weakened it: "we already run a working platform" is a
real argument that never entered the reckoning. Anyone re-reading this should
weigh it.

FIXR is student-focused, and on **percentage alone it beats TryBooking** — its
student rate is 3.99% against TryBooking's 5%. The gap is entirely in the fixed
fee: **59p including VAT against 15p**. The two are level at about **£207 a
ticket**, and TryBooking is cheaper the whole way below that — £0.55 against
£0.97 on an £8 ticket, £2.65 against £2.98 even at £50. So on total fees
TryBooking wins at every price this society will ever charge, and FIXR's lower
percentage never gets the chance to matter.

**But "cheaper" needs qualifying, because it depends who pays.** FIXR's fee is
**always added to the buyer** and cannot be absorbed; the society always receives
face value. TryBooking lets you choose — and this society chose to absorb. On an
£8 ticket:

| Setup                                | Society receives | Buyer pays |
| ------------------------------------ | ---------------- | ---------- |
| FIXR                                 | **£8.00**        | £9.00      |
| TryBooking, fees absorbed _(in use)_ | **£7.45**        | £8.00      |
| TryBooking, fees passed to buyer     | £8.00            | £8.55      |

TryBooking is genuinely more efficient — 45p less per ticket leaves the system.
But because the society absorbs rather than passes on, that efficiency is handed
to the buyer, and **the society's own income is about 55p per ticket lower than it
would be on FIXR**. Across a few hundred tickets a year that is well over £100.

So: TryBooking is cheaper in total, FIXR is better for the bank balance under the
current settings, and TryBooking is cheaper for the audience. All three statements
are true at once, and which matters is a judgement rather than a calculation.

**What would actually justify moving off FIXR** is capability, not fees: whether
it can do a 13-month membership, a searchable per-ticket attendee name, and wallet
passes. That was never established. Whoever revisits this should check those
before assuming a switch is warranted.

### The saving that actually matters

At a realistic 40 tickets at £8 — £320 a concert:

| Approach                                           | Cost to the society |
| -------------------------------------------------- | ------------------- |
| Eventbrite                                         | **~£46**            |
| **TryBooking, society absorbs both fees** ← in use | **£22**             |
| TryBooking (default fee split)                     | £16                 |
| TryBooking (fees passed to buyer)                  | **£0**              |
| Bank transfer                                      | £0                  |

**Moving off Eventbrite is the only fee decision worth real effort.** Everything
below that line is a few pounds a concert, which is less than the value of one
committee member's afternoon.

The society absorbs both fees by choice, which is the dearest TryBooking option
rather than the cheapest. The reasoning — honest advertised prices, and refunds
that actually return what people paid — is in "Before you sell" below, along with
the reason not to change it casually.

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
handoverable at all. Which role to give whom is in
[HANDOVER.md](HANDOVER.md) — the short version is that the **society email
address must hold the Account Owner role**, because handing it to a person
silently demotes the society.

### Which bank account, and connecting it

**Lloyds serves unregistered societies**, which matters because the obstacles
elsewhere in this project — Apple's D-U-N-S requirement, Cambridge SU's finance
accounts — all turned on not being a registered legal entity. Two products apply:

- **Community Account** — not-for-profit clubs, societies and associations,
  **explicitly including unregistered societies**, turnover under £250,000.
- **Treasurer's Account** — charity, church, club or society, turnover under
  £50,000.

Both support **up to four signatories** with 1-, 2- or 3-to-sign mandates, which
satisfies the two-signatory requirement above. Note that Lloyds moved to charging
clubs and societies **up to £8.50 a month**; if that applies it is around £102 a
year, more than the society's entire ticketing fee bill, so confirm the current
terms rather than assuming the account is free.

**There is no fee-free way to request a fixed amount by bank transfer.** Lloyds'
"Request a Payment" — which pre-fills the amount and reference, and would have
made bank transfer far less painful — is a **personal** banking feature and is not
available on a society account. Their business equivalent, Pay by Link via
Cardnet, is a card product with merchant fees, so it is not in the zero-fee
category at all. Plain bank transfer with hand-typed references is therefore the
only free route, with all the reconciliation that implies.

**Connecting the account to TryBooking has two traps:**

- **You cannot add a bank account to a fresh TryBooking account.** A **paid event
  or a fundraising page must exist first**. So the order is: create the account,
  build the event, then add banking — do not go hunting for the banking screen on
  day one.
- **Verification is a micro-deposit, not instant.** TryBooking sends a random
  amount under £1, which appears on the statement labelled "TryBooking Payment"
  after one to two business days; you then enter the exact figure. A small
  balance may be needed before it will run, so this is the long pole — start it
  early. Multiple bank accounts can be connected, so swapping a test account for
  the society one later just triggers re-verification.

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

Two small things worth knowing when creating the event. Use the **Space**
allocation type unless seats are genuinely being allocated — reserved seating
means drawing a seating plan for every venue, every time, so that people can
argue about row F. And TryBooking generates a **QR code for the booking page**,
which is for posters and freshers' fair signage, not for this website: a visitor
is already on a device and can simply tap the button. Check it resolves to the
right page before anything goes to print.

### Before you sell: four settings to get right first

All four are far easier to set before the first ticket is sold than to fix
afterwards, and the first one cannot be fixed at all. Work through them when you
create the event, not on the morning of the concert.

> **Rehearse on a throwaway first.** Create a **private test event** with a cheap
> ticket, buy one from another account, and check the whole path: the confirmation
> email arrives, the wallet pass adds to a phone, the QR scans, and the attendee
> name is searchable in the scanning app. It also unlocks the banking screen,
> which needs a paid event to exist. Doing this on a disposable event rather than
> on the real membership matters, because setting number 1 below cannot be applied
> retrospectively — you want the mistakes to land somewhere they cost nothing.
> Delete it afterwards. The only real cost is a few pence in non-refundable
> booking fees.

#### 1. Collect the attendee name on every ticket

**Turn on the Prebuilt Attendee Name field in TryBooking's Custom Forms, and ask
it per ticket rather than once per booking.** Do it when you create the event.

**Why.** The scanning app can look somebody up by name on the door, but it
searches two different things:

- **Booked By** — whoever paid. Always recorded, no setup needed.
- **Attendee Name** — the person the ticket is actually for. Recorded **only** if
  you asked for it.

TryBooking's documentation is explicit: _"To search by Attendee Name, you must use
our Prebuilt Attendee Name fields in Custom Forms."_

Without it, a parent booking for two children, or one student booking for three
friends, produces tickets that name only the payer. The people actually standing
in front of you are invisible to the search.

**Use the Prebuilt field, not a question you write yourself.** A custom text
question called "Name" will print on the ticket and appear in reports, but it is
**not** wired into the app's search. Only the prebuilt one is.

**This matters most for memberships.** The question you need to answer all year is
"is this person a member?", and the payer's name cannot answer it. A single
concert is more forgiving, because a group usually arrives together with whoever
booked.

**It cannot be fixed afterwards.** Anyone who buys before the field exists has no
attendee name against their ticket, and there is no way to go back and collect it.
If in doubt, switch it on — an unused field costs nothing, a missing one costs a
year.

Source:
[TryBooking scanning app](https://learn.trybooking.com/en/articles/42585-trybooking-scanning-app).

#### 2. Turn on Apple and Google Wallet passes

**Dashboard → Global event settings → "Apple and Google wallet tickets".**
TryBooking's wording is _"Now you can decide if your ticket buyers can add their
tickets to their smartphone wallets. Simply toggle this option to either enable or
disable"_. **Observed to be on by default when an account was created in September
2026**, which their documentation does not state either way — so glance at it
rather than trusting this note, particularly if a future committee starts from a
fresh account.

**Why it matters more than it looks.** TryBooking has no account for ticket
buyers — its own help centre says "Accounts are for Event Organisers only." There
is no attendee app and no purchase history to log into. Email is the only channel
TryBooking owns, and the self-service resend at `trybooking.com/resend-tickets`
has **two limits**: it only returns tickets for events still in the future, _and_
only for bookings made "within the last 12 months". **The wallet pass is therefore
the only durable copy a buyer holds**, and it survives a changed email address, a
lost inbox and a new phone.

**Worked through for a membership**, because the twelve-month limit is easy to
miss. A member who books on a given day loses self-service resend twelve months
later. For a membership running 15 September 2026 to 30 October 2027, anyone
joining before 30 October 2026 loses it _before their membership expires_ — a
member who joins on the opening day is cut off 45 days early. Since most people
join in the first weeks of Michaelmas, that is most of the membership.

It is survivable because of two things, but only if both are in place: buyers who
added the **wallet pass** are unaffected, and **organiser-side resend** (Booking &
Refunds → Manage bookings → Resend Booking Confirmation) has no documented
lookback limit, so the committee is always the backstop. Expect a few "I've lost
my membership" emails each autumn and resend them by hand.

Tell buyers to add the pass at the moment of purchase — it is the single step
that makes a long-lived ticket genuinely durable. It is not a deadline, though:
the "add to wallet" buttons appear in the **confirmation email** as well as on the
confirmation page, so somebody who booked on a laptop can add the pass from their
phone later. That only works on the phone itself — the link does nothing useful on
a desktop, which looks like a fault if nobody says so first.

A useful property: wallet passes **update automatically** if you later correct the
event or booking details, so a mistake in a membership's dates can still be fixed
after the passes are issued.

Note it is a **global** setting that applies account-wide; cloned events inherit
it, though individual events can be adjusted afterwards.

Source:
[Global event settings](https://learn.trybooking.com/en/articles/41723-global-event-settings).

#### 3. Decide how you will check people in at the door

**A ticket is marked used the first time it is scanned.** TryBooking applies a
"No duplicates" rule by default; scanning the same ticket again returns _"Invalid
Ticket Already Scanned"_. For a single concert that is exactly what you want.

**For anything valid more than once, that default is wrong**, and the fix is more
work than it first appears. Multi-use scanning needs **Settings → Scanning Rules →
Create a Rule (Custom)**, with **one rule per session**, and the multi-use ticket
selected in every rule. It also needs a second step that is easy to miss: tickets
must be **checked out** between sessions — _"To allow the multi-day ticket to be
scanned in successfully on the next day/session, it needs to be checked-out"_ —
which resets them from checked-in so they can be scanned again. That sync needs
an internet connection.

**Be honest about whether this is worth it for a membership.** Scanning a
year-long membership at every concert means creating a scanning rule for each
event and checking every ticket out afterwards, all year, by a volunteer who
changes. **The simpler route is the [Attendee List
Report](https://learn.trybooking.com/en/articles/41801-attendee-list-report)** as
a door list, searched by name — which is the other reason setting up the Prebuilt
Attendee Name field above matters. Keep scanning for single concerts, where it is
genuinely quick and the default behaviour is correct.

**One scanning-app setting worth knowing** whatever you choose: leave **Real-Time
Verification off** in a venue with poor signal. With it off the app scans
offline and syncs when the connection returns; with it on, scanning needs a live
connection and will stall at the door.

Source:
[Multi-day access scanning](https://learn.trybooking.com/en/articles/46348).

#### 4. Fees: the society absorbs both (decided September 2026)

**Dashboard → Global event settings → fee structure.** TryBooking charges two
things on top of your ticket price, and each can be billed either to the society
or to the buyer:

|                    | What it is             | Setting      |
| ------------------ | ---------------------- | ------------ |
| **Processing fee** | 5% of the ticket price | Society pays |
| **Ticket fee**     | 15p per ticket         | Society pays |

Neither is the ticket price. TryBooking's "ticket fee" is its own service charge —
in their words, _"a service fee for using the system… not a fee for attending the
event"_. The buyer always pays the ticket price regardless.

**The effect:** an £8 membership costs the buyer exactly £8.00, and the society
receives £7.45. Nothing is added at checkout. The advertised price is the price on
the poster, the website, the card statement and the refund.

**Why this rather than passing the fees on**, which would cost the society
nothing:

- **The advertised price is honest.** Fees appearing at the last screen are a
  well-known cause of abandoned baskets, and for a membership — where the ask is
  "join us" — a £0.55 surprise is a poor first impression.
- **It is the only setting under which refunds work properly.** See below. This is
  the load-bearing reason.

**The cost, so it is not a surprise:** roughly **£22 on a 40-ticket concert at
£8**, or about **£176 a year** across eight events. That is about £48 a year more
than the default split and £176 more than passing everything to buyers. It was
judged worth it for the two reasons above.

> **Do not flip this without reading TERMS.md.** The 15p ticket fee is **never
> refunded** — TryBooking keep it "in any circumstances (including where the
> ticket price has been refunded by the Event Organiser)". The 5% processing fee
> _is_ reversed. So while the society absorbs the ticket fee, a refunded buyer
> gets back exactly what they paid, and clause 4.1 of [TERMS.md](TERMS.md) —
> _"If we cancel an event, you will receive a full refund"_ — is a promise that
> can be kept. Move the ticket fee onto the buyer and it silently becomes one that
> cannot: they would be 15p short on every refund, including refunds caused by the
> society cancelling. If a future committee changes this setting, clause 4.1 must
> be reworded at the same time.

One consequence to expect: a cancelled event now costs the society the 15p booking
fee on every ticket sold, on top of the lost income. That is the right way round —
it should not fall on the audience — but it is a real cost of cancelling.

### Does the membership need a ticketing platform at all?

Ask this before configuring anything. It was asked late, and the answer is less
obvious than it looks.

**The reason to buy a ticketing platform is capacity counting.** A payment link
cannot stop selling at sixty seats. But **the membership is uncapped** — so that
argument, which drives the whole of "First decide which kind of thing you need"
above, simply does not apply to it. Concerts need a platform. The membership may
not.

**And membership carries no door.** Look at what it actually entitles someone to
(clause 2.2 of [TERMS.md](TERMS.md)): performing in concerts, voting at the AGM,
standing for committee. Every one of those is settled by the **committee checking
a list** — you programme the performers, you check the roll at the AGM, you check
eligibility at nomination. Nobody arrives at a door and has to convince a stranger
they belong. That is the opposite of a concert ticket.

**Which makes a QR code decoration.** A QR is only meaningful if something
validates it — scanning asks a database "is this genuine, and has it been used?"
With no scanning and no database, a QR on a membership PDF encodes a number nobody
can check. It looks official and proves nothing. The original specification asked
for one because the membership was framed as a ticket; on the benefits as written,
it does not earn its place.

**What the membership actually needs is a reliable list**: name, email, date paid,
amount. That is all three benefits administered.

#### Cheaper routes that become available

Because no capacity counting is needed, options ruled out for concerts are back.
Membership is **£15** for 2026–27, so these are costed at that price rather than
the £8 concert ticket used elsewhere in this document:

| Route                           | Fee on £15 | Effective | Society nets | Worth knowing                                |
| ------------------------------- | ---------- | --------- | ------------ | -------------------------------------------- |
| **Cambridge SU societies page** | Unknown    | —         | —            | **Ask first** — see below                    |
| **Bank transfer**               | £0         | 0%        | £15.00       | Reconciliation by hand                       |
| **Cash via Box Office app**     | £0.15      | **1.0%**  | £14.85       | In person only; no processing fee on cash    |
| **SumUp Payment Link**          | £0.38      | 2.5%      | £14.63       | Cheapest card route; thinner data collection |
| **Stripe Payment Link**         | £0.43      | **2.8%**  | £14.58       | Collects names and custom fields. **Chosen** |
| TryBooking online               | £0.90      | 6.0%      | £14.10       | Twice the fee, for capacity you do not need  |
| FIXR                            | ~£1.40     | 9.3%      | £15.00       | Buyer pays £16.40; fee cannot be absorbed    |

**At 100 memberships a year that is £90 in fees if everything is sold online,
against £15 if it is all taken as cash.** Most sign-ups happen at the freshers'
fair, where somebody is standing there anyway, so **taking cash through the Box
Office app is the single largest saving available** — roughly £75 a year for no
extra work, and everyone still lands in the same attendee list.

A note on the price itself: to net a clean £15 while absorbing the fees you would
have to charge **£15.95**. That was considered and rejected — £15 is a better
number to advertise, print and say out loud at a freshers' fair, and the cash
route recovers most of the same money without making the headline price awkward.

#### Recommendation: a Stripe Payment Link (decided September 2026)

**Use a Stripe Payment Link for online membership, and cash through the Box
Office app at the freshers' fair.** Keep TryBooking for concerts, where capacity
counting genuinely earns its fee.

**Why a payment link rather than a ticketing platform.** A membership is a
fixed-price product with no capacity cap, no QR code and no door check. That is
exactly what a payment link is for, and payment links cost roughly **half** what
a ticketing platform does — 2.8% against 6.0%, or about **£43 a year instead of
£90** across a hundred memberships. Paying a ticketing platform for a membership
means paying for seat counting that nothing is counting.

**Why Stripe rather than SumUp**, which is 5p cheaper: Stripe Payment Links can
collect, with no code at all —

- the member's **name**, as a built-in option;
- their **email**, as standard;
- **custom fields** — free text, number or dropdown — for anything else worth
  asking;
- a **terms-of-service checkbox** linking to the society's published terms, which
  matters because membership carries AGM voting rights (see [TERMS.md](TERMS.md)).

Everything collected appears against the payment in the Stripe dashboard, which is
searchable and exportable. **That was the membership registry** — the list this
document says the membership actually needs. It arrived free, with no database, no
admin page and no code to maintain. ADR-012 gave that up deliberately, for
questions Stripe cannot ask; Stripe remains the record of who actually **paid**,
which is the half that matters most. SumUp's link product is thinner and much less
clear about what it captures; for a membership where the record _is_ the point,
Stripe's data collection is worth the 5p.

**What this costs:** a second payment account to hand over. Stripe requires
identity checks on a named individual and ties to a bank account, so it carries
the same discipline as everything else — society email, society bank account,
never personal. See "Who owns the payment account" above.

> **Partly superseded — see ADR-012.** The conclusion below still holds: a
> payment link, not a ticketing platform. What changed is everything after it.
> The society now asks for more than a payment link can collect (conditional
> questions, a CRSid, two price tiers), so there is a form at
> `/membership/join`, a Google Sheet behind it, and **two** payment links rather
> than one. The sentence below about holding no member data is **no longer
> true** — the society holds the list now, with the obligations that brings.
> [MEMBERSHIP_FORM.md](MEMBERSHIP_FORM.md) is the current description.

**What the website does about it.** `/membership` shows the prices, the validity
dates and what membership includes, then sends people to the joining form. It
never takes a payment, exactly as with concert tickets (ADR-006). Content lives in `src/content/membership/`, one file per year, so the
price, dates and joining link can be changed without touching code. Leave
`joinUrl` out until a real link exists and the page says joining opens shortly
rather than showing a button that goes nowhere.

**Setting it up** is dashboard work, not development: create a product at £15,
create a Payment Link for it, switch on name collection and the terms-of-service
checkbox, then paste the link into `joinUrl`. No keys, no webhooks, nothing
deployed.

**Ask Cambridge SU first.** Many students' unions run a societies portal where
students join and pay through the union, often at no commission. The society is
SU-registered, so if Cambridge SU offers this it could be free **and** solve the
society bank account problem that blocks everything else. This could not be
confirmed from their published material — **email activities@cambridgesu.co.uk**
and ask whether societies can collect membership fees through their SU page, and
at what commission.

**Bank transfer deserves a fairer hearing here than in "Zero-commission" above.**
That section's objections are that it cannot cap numbers and cannot issue a ticket
at the moment of payment. Neither applies to an uncapped membership that does not
need a ticket. What remains is reconciliation — and at a freshers' fair somebody
is standing there anyway and can watch the transfer complete and tick the name off
on the spot. That is the one situation where its weakness largely disappears.

#### Two things to get right if the platform is dropped

**Where the member list lives.** It is personal data, so **never in this
repository** — it is public. It belongs on society-owned storage, registered to
the society email, for the same reason as every other account. A list in a
graduating student's personal Drive is the failure this project exists to prevent.

**Who maintains it, and when it is checked.** A list nobody keeps current is worse
than none, and the moment it becomes load-bearing — a contested vote at the AGM —
is the worst moment to discover it is out of date.

#### What would reverse this conclusion

**If members ever get free or discounted entry to concerts**, there _is_ a door,
strangers _do_ have to be checked, and a scannable ticket earns its place again.
That is not among the current benefits, but it is the obvious thing a future
committee might add — and it would change the answer completely. Anybody adding
that benefit should re-read this section first.

### Modelling the annual membership

TryBooking has **no membership or season-pass product**. Its model is an event
with sessions, so a membership has to be built out of those parts. This is how,
and why.

**One event, one long session.** The session _is_ the validity period. For
2026–27 that is **Tuesday 15 September 2026, 08:00** to **Saturday 30 October
2027, 16:00** — the same dates as clause 2.1 of [TERMS.md](TERMS.md), which must
be kept in step.

> Both of those are **BST**, not GMT. British Summer Time in 2027 does not end
> until Sunday 31 October, so the closing time falls one day inside it. This is
> exactly the trap the website's own date handling was designed to avoid, and it
> is easy to repeat when the dates are typed by hand into someone else's system.

**Price: £15** for 2026–27, with the society absorbing both fees, so the buyer is
charged exactly £15.00 and the society receives £14.10 online or £14.85 on cash.
See "Cheaper routes" above for why the price was not raised to £15.95 to cover
the fees.

**Allocation type: Space.** A membership has no seating, so general admission is
the only sensible choice. Space is also where the capacity number lives. There is
no confirmed "unlimited" option, so set a comfortably high figure — a thousand,
say — rather than hunting for one. TryBooking's 100-ticket limit is **per
transaction**, not a cap on total sales, so it never comes near a membership
people buy one or two of.

**Venue, not online.** A membership is neither, but online mode implies joining
instructions and a link that do not exist, which would put nonsense on a
membership card.

#### Session dates are not the same as booking dates

The mistake to avoid: **if sales close when the session starts, nobody can join
after the first morning.** Booking availability has to run across the membership
period so somebody can join in January.

But do not run sales to the very end either, for two reasons:

- Somebody joining on 29 October 2027 pays a full year's fee for one day, which
  is a refund request waiting to happen.
- **The membership year overlaps itself.** Thirteen and a half months means that
  when the 2027–28 membership opens in September 2027, both are on sale at once.
  The overlap is deliberate — it stops members lapsing at the start of Michaelmas
  before the new year opens — but it lets somebody buy the _old_ membership by
  mistake and get six weeks instead of a year.

**So close each year's sales when the next year's open**, around mid-September.
Set it when the event is created; a future committee will not know the overlap was
intentional and will not think to close it.

**Not verified:** whether TryBooking permits booking availability to extend beyond
the session _start_. If it does not, the single-long-session model does not work
and the membership needs rethinking — check this before building the rest. See
"Open questions for TryBooking support" below.

### Open questions for TryBooking support

Things this document assumes but could not confirm from TryBooking's own
documentation, as of September 2026. They are collected here so a future
committee can see at a glance what is verified and what is merely assumed.

**If you get an answer, write it in here** and delete the question. An
unanswered question that has quietly become folklore is worse than no note at
all.

**1. Can booking availability extend beyond the session start?** _(ask this one
first)_

Some platforms tie ticket sales to the event date. If TryBooking does, the
membership cannot be modelled as one long session, because sales would close on
15 September 2026 and nobody could join for the rest of the year. Everything in
"Modelling the annual membership" above depends on the answer being yes.
_Assumed: yes._

**2. Is unlimited capacity possible, or must a finite number be entered?**

The capacity documentation only describes typing a number into "Number of
Attendees". If there is no unlimited option, a high finite cap has to stand in
for one. _Assumed: no unlimited option; set a high number._ Low stakes — the
workaround is fine — but worth knowing rather than guessing.

**3. On a refund, is the processing-fee reversal applied at the same moment as
the payout, or afterwards?**

A refund returns the buyer the full ticket price, but the account balance only
ever received the price minus fees. If the 5% reversal lands simultaneously the
balance nets out; if it lands later, the balance can dip below what the refund
needs. _Assumed: it nets out._ This one may answer itself the first time a refund
is processed — if it does, record what happened.

**4. Does a session ending far in the future slow payouts?** _(low priority)_

Transfers requested "before your event date" can face additional checks taking up
to seven days, against one to three normally. The membership's session does not
end until October 2027, so every withdrawal during the membership year is
technically pre-event. _Assumed: an inconvenience, not a problem_ — nothing
time-critical is paid out of membership income, unlike a concert where an artist
may need paying. Worth asking only if payouts actually turn out to be slow.

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

The society's own terms — refunds, membership rights, non-transferability and
what happens to a buyer's data — are in **[TERMS.md](TERMS.md)**. That file is the
master copy; the live version sits in TryBooking's Global event settings and must
be kept in step with it.
