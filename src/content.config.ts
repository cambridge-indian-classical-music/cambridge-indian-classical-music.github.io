import { defineCollection, reference } from 'astro:content';
import type { ImageFunction } from 'astro:content';
import { file, glob } from 'astro/loaders';
// Imported from 'astro/zod' rather than 'astro:content': the latter is
// deprecated and is removed in Astro 8.
import { z } from 'astro/zod';

/**
 * The content model for the CUICMS website.
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

/** A link out to somewhere else — an artist website, a recording, a social profile. */
const externalLink = z.object({
  label: z.string().min(1).describe('What the link is called, e.g. "Website" or "YouTube".'),
  url: z.url('Must be a full web address starting with https://'),
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
export const TICKET_PROVIDERS = ['sumup', 'eventbrite', 'stripe', 'university', 'other'] as const;

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
         * Who is performing or teaching. One mechanism covers a concert's lead
         * artist and accompanists as well as a workshop's teacher, because a
         * workshop teacher IS an artist — same biography, same photograph.
         */
        people: z
          .array(
            z.object({
              artist: reference('artists'),
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
      /* A concert with no performers, or a workshop with no teacher, is unfinished. */
      .refine((data) => !['concert', 'workshop'].includes(data.type) || data.people.length > 0, {
        message:
          'List at least one person under `people` — a concert needs its performers and a workshop needs its teacher.',
        path: ['people'],
      })
      /* A ticket provider without a link is a button that goes nowhere. */
      .refine((data) => !data.ticketProvider || data.ticketUrl, {
        message: 'You have named a ticket provider but not given a ticketUrl.',
        path: ['ticketUrl'],
      }),
});

/* -------------------------------------------------------------------------- */
/* Artists                                                                    */
/* -------------------------------------------------------------------------- */

export const TRADITIONS = ['carnatic', 'hindustani', 'both', 'other'] as const;

/**
 * Artists get their own collection because they recur: the same musician may
 * play three concerts and teach a workshop, and their biography should be
 * written once. Events point at artists by filename, and Astro checks at build
 * time that the artist exists — so deleting an artist who is still booked fails
 * the build instead of silently leaving a concert with no performers.
 */
const artists = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/artists' }),
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1),
      /** Instrument or voice, e.g. "Vocal", "Sitar", "Mridangam". */
      discipline: z.string().min(1),
      tradition: z.enum(TRADITIONS),
      /** One sentence, used on cards and in social previews. */
      summary: z.string().min(1).max(200),
      image: imageWithAlt(image).optional(),
      links: z.array(externalLink).default([]),
      draft: z.boolean().default(false),
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
 * The committee changes completely every year, so it lives in one small file
 * that can be replaced wholesale at handover rather than being scattered
 * through the templates.
 */
const committee = defineCollection({
  loader: file('./src/content/committee.yml'),
  schema: z.object({
    id: z.string(),
    name: z.string().min(1),
    role: z.string().min(1),
    email: z.email().optional(),
  }),
});

export const collections = { events, artists, pages, committee };
