# Adding and editing content

This guide is for committee members updating the website. **You do not need to
be able to program, and you do not need to install anything.** Everything here
can be done in a web browser.

If something goes wrong, nothing is broken permanently. Every change is recorded
and can be undone, and the site refuses to publish anything malformed.

---

## The one thing to understand

The website is built from **text files**, one per event and one per artist. You
edit those files; the site rebuilds itself.

Every file has two parts:

```markdown
---
title: An Evening of Carnatic Vocal Music     <- the details, one per line
type: concert
start: '2026-11-14T19:30'
---

The longer description goes down here, in ordinary prose.
```

The part between the two `---` lines holds the details. The part underneath is
the description shown on the page.

**Two rules that prevent most problems:**

1. **Keep the spacing exactly as it is.** Indentation is meaningful. If a line is
   indented by two spaces in the example, keep both spaces.
2. **Put quotes around dates.** Write `start: '2026-11-14T19:30'`, with the
   quotes. Without them the date may be misread.

---

## Adding a concert

The quickest way is to copy an existing event.

1. Go to the repository on GitHub and open `src/content/events/`.
2. Open an event that resembles the one you are adding and click **Copy raw
   file** (or select all the text and copy it).
3. Go back to `src/content/events/`, click **Add file → Create new file**.
4. Name it after the date and the event, in lowercase with hyphens instead of
   spaces:

   ```
   2026-11-14-carnatic-vocal-recital.md
   ```

   **The name matters** — it becomes the page's web address, and it should not
   change once the event has been advertised.

5. Paste in what you copied, then change the details.
6. At the bottom, choose **Create a new branch for this commit and start a pull
   request**, and click **Propose new file**.
7. On the next screen, click **Create pull request**.

Now wait a minute. Two things happen:

- **Checks run.** A green tick means everything is valid. A red cross means
  something is wrong — click **Details** to see which file and which line, fix
  it, and the check runs again.
- **A preview appears.** A link is added to the pull request showing the site
  exactly as it will look. Click it and check your work.

When the tick is green and the preview looks right, click **Merge pull request**.
The live site updates within a couple of minutes.

### The fields

| Field            | Required               | Notes                                                                            |
| ---------------- | ---------------------- | -------------------------------------------------------------------------------- |
| `title`          | yes                    | The name of the event                                                            |
| `type`           | yes                    | `concert`, `workshop`, `social` or `other`                                       |
| `summary`        | yes                    | One sentence, under 200 characters. Appears on listings and when shared          |
| `start`          | yes                    | `'2026-11-14T19:30'` — 24-hour clock, in quotes                                  |
| `end`            | no                     | Same format. Include it if you know it                                           |
| `venue`          | yes                    | `name` is required; `address`, `mapUrl` and `accessNotes` are optional           |
| `people`         | concerts and workshops | Performers or teacher — see below                                                |
| `image`          | no                     | A photograph, with a description — see below                                     |
| `brochure`       | no                     | A PDF programme — see below                                                      |
| `ticketUrl`      | no                     | The full booking address. Leave it out if no booking is needed                   |
| `ticketProvider` | no                     | `eventbrite`, `stripe`, `university` or `other`. Only changes the button wording |
| `priceInfo`      | no                     | Free text: `£10 / £6 students`                                                   |
| `status`         | no                     | Defaults to `scheduled`. See below                                               |
| `featured`       | no                     | `true` pins it to the homepage                                                   |
| `draft`          | no                     | `true` hides it from the site while you work on it                               |

### Times: write what is on the poster

Write the time the audience should arrive. **Do not convert anything, and do not
add a timezone.** The site handles British Summer Time by itself.

```yaml
start: '2026-11-14T19:30' # a 7:30 pm concert
```

### You never need to move an event to "past"

The site works out whether an event has happened from its date, every time it
rebuilds. Past events move to the archive at the bottom of the events page by
themselves.

`status` is only for changes to a _scheduled_ event:

| Status      | Use it when                                                                   |
| ----------- | ----------------------------------------------------------------------------- |
| `scheduled` | Normal. The default                                                           |
| `cancelled` | The event is not happening. A notice appears and the ticket button is removed |
| `postponed` | Moved, new date not yet set                                                   |
| `sold-out`  | Still happening, no tickets left                                              |

### Performers and teachers

Events refer to artists by their **filename**, without the `.md`:

```yaml
people:
  - artist: lakshmi-venkataraman # src/content/artists/lakshmi-venkataraman.md
    role: Vocal
  - artist: ravi-sharma
    role: Tabla
```

The artist file must exist first — see below. For a workshop, use the same
structure with a role such as `Workshop leader`.

If you misspell an artist's filename the checks will fail and tell you the exact
name that was not found. Nothing broken reaches the site.

---

## Adding an artist

Artists have their own files so that a biography is written once, however many
times they perform. Create a file in `src/content/artists/` named after them in
lowercase with hyphens — `lakshmi-venkataraman.md`:

```markdown
---
name: Lakshmi Venkataraman
discipline: Carnatic vocal
tradition: carnatic # carnatic, hindustani, both or other
summary: A Carnatic vocalist known for unhurried raga exposition.
image:
  src: ../../assets/images/lakshmi-venkataraman.jpg
  alt: Lakshmi Venkataraman singing, seated with a tanpura.
links:
  - label: Website
    url: https://example.org/
---

The full biography goes here, in ordinary prose.
```

Their page lists every event they have been part of automatically. You never
maintain that list by hand.

**Do not rename an artist file** once events refer to it — the events would no
longer find it. (The checks would catch this, but it is easier not to.)

---

## Photographs

1. **Resize before uploading.** Photographs straight off a camera are enormous.
   Save at about **1600 pixels wide** and under **500 KB**. Any photo editor,
   Preview on a Mac, or an online image resizer will do it.

   This matters more than it sounds: images stay in the repository's history
   forever, and deleting a large file later does not reclaim the space.

2. Upload to `src/assets/images/` on GitHub (**Add file → Upload files**).
3. Refer to it from the event or artist file, **always with a description**:

   ```yaml
   image:
     src: ../../assets/images/your-photo.jpg
     alt: Describe the picture for someone who cannot see it.
   ```

The `../../` at the start is required — it is how the site finds the file.

The site automatically produces correctly-sized, modern-format versions for
phones and large screens, so one good-quality upload serves everyone.

**Alt text is not optional.** The site will not build without it. Describe what
is in the picture — "Ravi Sharma playing sitar, seated cross-legged" — not
"photo" or "image of artist".

---

## PDF programmes and brochures

1. Name the file in lowercase with hyphens: `michaelmas-recital.pdf`.
2. Upload it to `public/brochures/`.
3. Refer to it with its full address:

   ```yaml
   brochure: /brochures/michaelmas-recital.pdf
   ```

If you misspell the filename the automated checks will catch it before it
reaches the site.

---

## Ticket links

```yaml
ticketUrl: https://www.eventbrite.co.uk/e/your-event-123456
ticketProvider: eventbrite
priceInfo: £10 / £6 students
```

Leave `ticketUrl` out entirely if no booking is needed — the page then says so
rather than showing a dead button. To change ticketing provider, change the link.
See [TICKETING.md](TICKETING.md).

---

## Updating the committee

Once a year, after elections. Open `src/content/committee.yml` on GitHub and
click the pencil icon.

The file is a simple list. Replace the entries, keeping the layout identical:

```yaml
- id: president # lowercase, no spaces, unique. Not shown on the site
  name: A. N. Example
  role: President
  email: president@example.org # optional — leave the line out if not wanted

- id: treasurer
  name: B. Example
  role: Treasurer
```

The order in the file is the order shown on the site. Propose the change as a
pull request, check the tick is green, and merge.

---

## Editing the About page

`src/content/pages/about.md`. Everything below the second `---` is ordinary
prose. Blank lines separate paragraphs, `## ` at the start of a line makes a
subheading, and `[text](https://address)` makes a link.

---

## When a check fails

A red cross is the system doing its job: it has stopped a broken page from being
published. Click **Details** to see the message, which names the file and the
problem.

| Message mentions                                 | Usually means                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `Must be a date and time like...`                | The date is the wrong shape, or is missing its quotes                                                          |
| `references "..." but that entry does not exist` | An artist filename is misspelt, or the artist file has not been created                                        |
| `that artist is marked draft: true`              | An event lists an artist whose own entry is still a draft. Finish the artist entry, or take them off the event |
| `alt` or `Required`                              | A photograph has no description                                                                                |
| `Broken internal links`                          | A brochure filename is misspelt                                                                                |
| `too_big` or `200 characters`                    | A summary is too long                                                                                          |
| `List at least one person`                       | A concert or workshop has no performers or teacher                                                             |

Edit the file again in the same pull request and the check re-runs by itself. If
you are stuck, close the pull request — nothing on the live site changes.

---

## Using the editing interface instead

If the site's `/admin` page has been set up, it offers forms instead of text
files, which is easier for uploading pictures. It saves to exactly the same
files, so the two can be mixed freely.

It needs one-off setup by someone technical — see [DEPLOYMENT.md](DEPLOYMENT.md).
Plenty of committees will never need it: editing on GitHub is quicker for
changing a date or a link.
