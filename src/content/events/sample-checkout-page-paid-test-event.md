---
# ---------------------------------------------------------------------------
# SAMPLE CONTENT — delete this file before the site goes live, or as soon as
# the Checkout Page trial ends, whichever is sooner.
#
# This is the PAID test event for the Checkout Page trial. The ticket link
# goes to a real event on the society's Checkout Page account, and buying a
# ticket takes a real card payment (£0.25 student, £0.50 public) through the
# society's Stripe account.
# It exists to check the Stripe side of the booking journey: the payment, the
# name on the bank statement, and the refund. See "Testing it" in
# docs/TICKETING.md. Do not book it for real.
#
# It LINKS to Checkout Page rather than embedding Checkout Page's own script,
# for the same reason as sample-checkout-page-test-event.md (ADR-006).
# ---------------------------------------------------------------------------
title: TEST – Test paid event
type: other
summary: A low-price test event for checking Checkout Page payments. Please do not book.
start: '2026-12-12T19:30'
end: '2026-12-12T21:00'
venue:
  name: Test venue — no event is taking place
ticketUrl: https://cuicms.checkoutpage.com/test-paid-event
ticketProvider: other
priceInfo: £0.25 students, £0.50 public — test tickets, please do not book
status: scheduled
featured: false
---

**This is a test, not a real event.** The society is trying out a new ticketing
provider, and this page exists to check that card payments work from start to
finish. Booking it takes a real payment, so please do not book it.
