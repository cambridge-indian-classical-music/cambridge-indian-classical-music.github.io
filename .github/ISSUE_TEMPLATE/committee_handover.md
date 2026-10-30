---
name: Committee handover
about: The annual handover checklist — open one each year, and tick it off together
title: 'Committee handover 20XX–XX'
labels: ''
assignees: ''
---

<!--
This is the only copy of the handover checklist. To change the checklist,
edit .github/ISSUE_TEMPLATE/committee_handover.md — docs/HANDOVER.md links here
rather than repeating it.

This repository is public — anyone can read this issue. Do not write passwords,
recovery codes or anyone's personal details in it. Tick boxes and say who did
what; the credentials themselves belong in the society password manager.
-->

Work through this with the outgoing committee, ideally in one sitting together.
Background on every item is in [HANDOVER.md](https://github.com/cambridge-indian-classical-music/cambridge-indian-classical-music.github.io/blob/main/docs/HANDOVER.md). Close this issue when every box is ticked — next year's committee can find it to see what was done.

### Before the outgoing committee leaves

- [ ] New committee members added to the **GitHub organisation**, with at least
      two as **Owners**
- [ ] New committee members added to the **`committee` team** (the
      organisation's **Teams** tab). That team is what gives them write access
      to the website, and it is who GitHub asks to review each pull request
- [ ] Only two or three people are **Owners** — everyone else is a plain
      member. Owners can merge without anyone's approval (see
      [DEPLOYMENT.md](https://github.com/cambridge-indian-classical-music/cambridge-indian-classical-music.github.io/blob/main/docs/DEPLOYMENT.md),
      "Protect main")
- [ ] New members added to the **ticketing provider** account
- [ ] **Stripe account representative** changed to an incoming committee member,
      who has completed Stripe's identity check themselves. Stripe's home page
      shows **no outstanding tasks**. This is separate from adding logins: the
      representative is a named person Stripe has verified, and if it is left
      as somebody who has graduated, Stripe can pause payments and payouts.
      See
      [HANDOVER.md](https://github.com/cambridge-indian-classical-music/cambridge-indian-classical-music.github.io/blob/main/docs/HANDOVER.md),
      "Stripe is tied to a named person"
- [ ] New members able to sign in to the **society Google account**, and the
      Apps Script behind the membership form confirmed as owned by **that
      account and not a person** — Apps Script → Project Settings names the
      owner. This one is worth doing carefully: the form runs as whoever
      deployed it, so if that was a student, it stops working when they graduate
      and it stops **silently**, with the website still showing a form that
      quietly fails. See
      [MEMBERSHIP_FORM.md](https://github.com/cambridge-indian-classical-music/cambridge-indian-classical-music.github.io/blob/main/docs/MEMBERSHIP_FORM.md)
- [ ] A test membership application submitted end to end, and the row checked
- [ ] New members added to the **Cloudflare** account, _only if_ the CMS sign-in
      worker or analytics are set up — most committees will have neither
- [ ] Credentials and **two-factor recovery codes** transferred to the society
      password manager
- [ ] Confirmed the **society email** is being read by someone continuing
- [ ] The accounts table in
      [HANDOVER.md](https://github.com/cambridge-indian-classical-music/cambridge-indian-classical-music.github.io/blob/main/docs/HANDOVER.md)
      updated with who now has access
- [ ] Someone new has **made a change to the website and published it**, start to
      finish — pull request, approval, merge — with the outgoing committee
      watching. This is the real test — do not skip it
- [ ] Confirmed the **University subdomain** still resolves and its certificate
      is valid — there is nothing to renew, but it is worth looking. Open
      <https://indianclassicalmusic.societies.cam.ac.uk/> and check the padlock;
      if it is missing,
      [DEPLOYMENT.md](https://github.com/cambridge-indian-classical-music/cambridge-indian-classical-music.github.io/blob/main/docs/DEPLOYMENT.md)
      step 5 explains what to check

### After they have left

- [ ] Departing members **removed** from GitHub, the ticketing provider, and
      Cloudflare if it is in use
- [ ] Removing someone from the **GitHub organisation** is what actually stops
      them editing the website — it takes them out of the `committee` team too.
      The `/admin` page is public and always was, so there is no separate list
      to prune
- [ ] Passwords on shared accounts **changed**
- [ ] `src/content/committee.yml` updated — see
      [CONTENT_GUIDE.md](https://github.com/cambridge-indian-classical-music/cambridge-indian-classical-music.github.io/blob/main/docs/CONTENT_GUIDE.md)
- [ ] Contact address in `src/site.config.ts` still correct

### Once a year, worth checking

- [ ] The site still builds — open the **Actions** tab on GitHub and check
      recent runs are green
- [ ] The **repository settings** still match the list in
      [DEPLOYMENT.md](https://github.com/cambridge-indian-classical-music/cambridge-indian-classical-music.github.io/blob/main/docs/DEPLOYMENT.md),
      "Protect main" — branch protection, merge settings, security. They live in
      GitHub, not in the repository, so nothing notices if one is switched off
- [ ] Any Dependabot pull requests merged (see
      [MAINTAINING.md](https://github.com/cambridge-indian-classical-music/cambridge-indian-classical-music.github.io/blob/main/docs/MAINTAINING.md))
- [ ] Old events still read sensibly
- [ ] The membership spreadsheet is **not** shared as "anyone with the link"
- [ ] Last year's unpaid membership applications deleted — the retention rule in
      [MEMBERSHIP_FORM.md](https://github.com/cambridge-indian-classical-music/cambridge-indian-classical-music.github.io/blob/main/docs/MEMBERSHIP_FORM.md);
      nothing enforces it by itself
- [ ] **The membership year rolled over**, when a new one opens: `SHEET_NAME`
      and `MEMBERSHIP_YEAR` in the Apps Script changed **together**, plus a new
      file in `src/content/membership/`. Changing only one of the two properties
      fails silently — applications keep arriving, carrying last year's
      reference. MEMBERSHIP_FORM.md has the table
- [ ] Committee list and About page current
