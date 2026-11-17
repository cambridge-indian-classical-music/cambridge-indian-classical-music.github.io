import { defineCollection } from 'astro:content';
import type { ImageFunction } from 'astro:content';
import { file, glob } from 'astro/loaders';
// Imported from 'astro/zod' rather than 'astro:content': the latter is
// deprecated and is removed in Astro 8.
import { z } from 'astro/zod';

/**
 * The content model for the CUICM website.
 *
 * Everything the site publishes is validated here before it can be built. If a
 * content file breaks one of these rules, `npm run build` fails with a message
 * naming the file and the field. That is deliberate: it is far better for a
 * mistake to stop the build than to appear quietly on the public site.
 *
 * If you change anything in this file, read docs/CONTENT_GUIDE.md first — the
 * rules below are explained there in plain English for non-technical editors.
 */

/* -------------------------------------------------------------------------- */
/* Shared building blocks                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Dates and times are stored as plain Cambridge wall-clock time, e.g.
 * "2026-11-14T19:30" — exactly what would be printed on a poster.
 *
 * We deliberately do NOT ask editors to write a timezone. Expecting a student
 * to know whether November is GMT or BST is a reliable way to get concert times
 * wrong. They write the time the audience should turn up; the site shows that
 * time back, unchanged. See src/lib/datetime.ts for how this is handled.
 */
const wallClock = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    'Must be a date and time like "2026-11-14T19:30" (24-hour clock, Cambridge local time). Remember to wrap it in quotes.',
  )
  .refine((value) => !Number.isNaN(Date.parse(`${value}:00Z`)), {
    message: 'That is not a real date — check the month and day.',
  });

/**
 * Images are always stored together with their alt text, so that it is
 * impossible to add a picture without describing it. A missing description is
 * not an oversight to be caught in review later — it stops the build.
 */
const imageWithAlt = (image: ImageFunction) =>
  z.object({
    src: image(),
    alt: z
      .string()
      .min(1)
      .describe(
        'Describe the image for someone who cannot see it, e.g. "Sudha Ragunathan singing, seated with a tanpura".',
      ),
  });

/**
 * Venues are stored inline on each event rather than as their own collection.
 * See ADR-003: promoting them is easy later, and premature today.
 */
const venue = z.object({
  name: z.string().min(1).describe('e.g. "Fitzwilliam College Auditorium"'),
  address: z.string().optional().describe('Street address, to help people find it.'),
  mapUrl: z.url().optional().describe('A Google Maps or OpenStreetMap link.'),
  accessNotes: z
    .string()
    .optional()
    .describe(
      'Step-free access, accessible toilets, hearing loop. Audiences need this before booking, not on the night.',
    ),
});

/* -------------------------------------------------------------------------- */
/* Events — concerts, workshops and everything else the society puts on       */
/* -------------------------------------------------------------------------- */

/**
 * Concerts and workshops are ONE collection with a `type` field, not two
 * collections. They share almost every field, and a single collection means the
 * events calendar is one sorted list rather than a merge of two. Adding a new
 * kind of event later means adding one value below. See ADR-003.
 */
export const EVENT_TYPES = ['concert', 'workshop', 'social', 'other'] as const;

/**
 * `status` is only for things the calendar cannot work out for itself.
 *
 * Note that "past" is NOT a status. Whether an event has happened is worked out
 * from its date every time the site is built, so nobody has to remember to move
 * an event to the archive. See ADR-003.
 */
export const EVENT_STATUSES = ['scheduled', 'cancelled', 'postponed', 'sold-out'] as const;

/**
 * Which ticketing service is being used. This is purely cosmetic — it decides
 * whether the button reads "Book on Eventbrite" or "Buy tickets", and nothing
 * else. No code behaves differently based on it, which is exactly why the
 * society can change ticketing provider by editing a link. See ADR-006.
 */
export const TICKET_PROVIDERS = [
  'trybooking',
  'sumup',
  'eventbrite',
  'stripe',
  'university',
  'other',
] as const;

const events = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/events' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        type: z.enum(EVENT_TYPES),

        /** Shown on cards, in search results and in social previews. Keep it to one sentence. */
        summary: z
          .string()
          .min(1)
          .max(200, 'Keep the summary under 200 characters — it is used as the page description.'),

        start: wallClock,
        end: wallClock.optional(),

        venue,

        /**
         * Who is performing or teaching, written as plain names. Optional: an
         * event can be announced before its line-up is confirmed.
         *
         * The site used to have a separate Artists section with a profile page
         * per musician, and events pointed at those pages. The society removed
         * it, so a performer is now just a name and a role on the event itself.
         */
        people: z
          .array(
            z.object({
              name: z.string().min(1).describe('e.g. "Anoushka Shankar".'),
              role: z
                .string()
                .min(1)
                .describe('e.g. "Vocal", "Mridangam", "Workshop leader", "Tabla accompaniment".'),
            }),
          )
          .default([]),

        image: imageWithAlt(image).optional(),

        /**
         * A PDF programme or flyer. Put the file in `public/brochures/` and
         * write its address here, e.g. "/brochures/michaelmas-recital.pdf".
         *
         * Kept in `public/` so the link never changes — brochure addresses get
         * printed on posters and shared in messages. See ADR-008. The full path
         * is stored (rather than just the filename) so that the CMS file-upload
         * widget and hand-editing produce exactly the same thing.
         */
        brochure: z
          .string()
          .regex(
            /^\/brochures\/[a-z0-9-]+\.pdf$/,
            'Write the full address, e.g. "/brochures/michaelmas-recital.pdf" — lowercase, no spaces.',
          )
          .optional(),

        /** What the brochure is, for its button: "programme" if left out, or e.g. "poster". */
        brochureLabel: z.string().min(1).default('programme'),

        /** Where to buy tickets. Leave it out and the page says no booking is needed. */
        ticketUrl: z.url('Must be a full web address starting with https://').optional(),
        ticketProvider: z.enum(TICKET_PROVIDERS).optional(),
        priceInfo: z
          .string()
          .optional()
          .describe('Free text, e.g. "£8 / £5 students" or "Free entry, no booking required".'),

        status: z.enum(EVENT_STATUSES).default('scheduled'),

        /** Pin to the homepage. */
        featured: z.boolean().default(false),
        /** Work in progress — hidden from the built site. */
        draft: z.boolean().default(false),
      })
      /* An event that finishes before it starts is always a typo. */
      .refine((data) => !data.end || data.end > data.start, {
        message: 'The end time is before the start time — check both.',
        path: ['end'],
      })
      /* A ticket provider without a link is a button that goes nowhere. */
      .refine((data) => !data.ticketProvider || data.ticketUrl, {
        message: 'You have named a ticket provider but not given a ticketUrl.',
        path: ['ticketUrl'],
      }),
});

/* -------------------------------------------------------------------------- */
/* Membership                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The annual society membership.
 *
 * This is its own collection rather than an event, because a membership is not
 * an event: it runs for over a year, has no venue, and would otherwise sit at
 * the top of the "upcoming events" list until it expired. See docs/TICKETING.md.
 *
 * It is a collection rather than settings in code because the price, the dates
 * and the joining link all change every year, and changing them must not require
 * editing TypeScript. One file per membership year, so last year's terms stay
 * readable in Git.
 */
const membership = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/membership' }),
  schema: z
    .object({
      /** e.g. "Membership 2026–27". Shown as the page heading. */
      title: z.string().min(1),

      /** Used on the page and in social previews. One sentence. */
      summary: z
        .string()
        .min(1)
        .max(200, 'Keep the summary under 200 characters — it is used as the page description.'),

      /**
       * The two rates, exactly as the member will be charged. Write what they
       * pay, not what the society receives after fees.
       *
       * There are deliberately EXACTLY TWO, named rather than listed, because
       * the joining form branches on them: a current student pays the student
       * rate, everybody else — alumni included — pays the general rate. A list
       * could be reordered or misspelled; this cannot.
       *
       * These prices are what the website DISPLAYS. What the member is actually
       * charged is set on the Stripe payment link, which lives outside this
       * repository. The two can drift, so changing a price here means changing
       * it in Stripe as well — docs/MEMBERSHIP_FORM.md says where.
       */
      rates: z.object({
        student: z.object({
          price: z.string().min(1).describe('e.g. "£12".'),
          note: z
            .string()
            .min(1)
            .describe('Who qualifies, e.g. "Current students of the University of Cambridge".'),
        }),
        general: z.object({
          price: z.string().min(1).describe('e.g. "£15".'),
          note: z.string().min(1).describe('e.g. "Alumni and everyone else".'),
        }),
      }),

      /** When membership becomes valid, and when it runs out. */
      opens: wallClock,
      closes: wallClock,

      /**
       * Where the joining form sends what somebody types into it — the Google
       * Apps Script web app described in docs/MEMBERSHIP_FORM.md.
       *
       * **The form renders whether or not this is set** (issue #12). Left out,
       * the fields still appear and submitting them fails — which is fine while
       * the site is in development and nobody is being asked to join, and is
       * not fine the day it is. SET THIS BEFORE ROLLOUT: nothing in the code
       * checks any more, because the check was deliberately removed.
       *
       * This is not where payment happens. The script writes the application to
       * the society's spreadsheet and then sends the applicant on to the right
       * Stripe payment link, which it holds itself — so no payment link appears
       * in this repository, and the site still never takes a payment (ADR-006,
       * ADR-012).
       */
      formEndpoint: z
        .url('Must be a full web address starting with https://')
        .refine((value) => value.startsWith('https://script.google.com/macros/s/'), {
          message:
            'Must be the Apps Script web app URL, which starts https://script.google.com/macros/s/ and ends /exec. See docs/MEMBERSHIP_FORM.md.',
        })
        .optional(),

      /**
       * Where the "Join the Society" button goes, e.g. a Google Form. If it is
       * left out, the button goes to the site's own joining form at
       * /membership/join instead. Change it each year along with the dates.
       */
      joinUrl: z.url('Must be a full web address starting with https://').optional(),

      /**
       * A short list of what a member gets. Optional: if the page text (the
       * body of the file) already sets out the benefits, leave this out — the
       * list is only shown when it is filled in, so nothing is said twice.
       */
      benefits: z
        .array(z.string().min(1))
        .default([])
        .describe('One line each, e.g. "Perform in Society concerts".'),

      /** Work in progress — hidden from the built site. */
      draft: z.boolean().default(false),
    })
    /* A membership that expires before it starts is always a typo. */
    .refine((data) => data.closes > data.opens, {
      message: 'Membership closes before it opens — check both dates.',
      path: ['closes'],
    }),
});

/* -------------------------------------------------------------------------- */
/* Ordinary pages and committee list                                          */
/* -------------------------------------------------------------------------- */

/** Editorial pages such as "About" — prose that does not belong to an event. */
const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1).max(200),
    draft: z.boolean().default(false),
  }),
});

/**
 * The text at the top of the homepage. Only the words are editable; the layout,
 * the button's destination and the event lists stay in src/pages/index.astro,
 * so editing this file cannot break the page's design.
 *
 * The length limits keep the opening screen from overflowing on a phone. They
 * are generous — the original text is well inside them.
 */
const home = defineCollection({
  loader: glob({ pattern: 'home.md', base: './src/content' }),
  schema: z.strictObject({
    eyebrow: z.string().min(1).max(60),
    heading: z.string().min(1).max(80),
    introduction: z.string().min(1).max(400),
    buttonLabel: z.string().min(1).max(30),
  }),
});

/**
 * The committee changes completely every year, so it lives in one small file
 * that can be replaced wholesale at handover rather than being scattered
 * through the templates.
 */
const committee = defineCollection({
  loader: file('./src/content/committee.yml'),
  schema: ({ image }) =>
    z.object({
      id: z.string(),
      /** Position on the About page, 1 first. The file's own order is not kept. */
      order: z.number().int().positive(),
      name: z.string().min(1),
      role: z.string().min(1),
      /** A short extra line under the role, e.g. "Creator of this website". */
      note: z.string().min(1).optional(),
      /** Show this member's photo 20% bigger than the others. */
      larger: z.boolean().default(false),
      email: z.email().optional(),
      /** Square portrait with a description. Optional — see committee.yml. */
      photo: imageWithAlt(image).optional(),
    }),
});

export const collections = { events, membership, pages, home, committee };
