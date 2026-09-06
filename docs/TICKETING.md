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

| Option                         | Cost to the society                                           | Effort                                   | Good when                                                 |
| ------------------------------ | ------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------- |
| **Eventbrite**                 | Free for free events; roughly 5–8% plus a fee on paid tickets | Very low                                 | Starting out. Handles guest lists, refunds and QR tickets |
| **Stripe Checkout**            | ~1.5% + 20p per transaction                                   | Medium — someone must build the checkout | Ticket volume makes the saving worthwhile                 |
| **University / SU box office** | Varies                                                        | Low, but depends on their process        | The SU already offers it                                  |
| **No online tickets**          | Nothing                                                       | None                                     | Free events. Leave `ticketUrl` out entirely               |

**Recommendation: start with Eventbrite.** It is free to set up, needs no
technical work, and produces a link you paste into a content file. Revisit only
if the fees start to matter — and the site will not need changing when you do.

For a society selling perhaps a hundred tickets a term, the difference between
Eventbrite's fees and Stripe's is small in absolute terms, and considerably
smaller than the value of a committee member's time.

---

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
