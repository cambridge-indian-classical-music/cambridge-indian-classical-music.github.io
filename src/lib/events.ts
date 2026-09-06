/**
 * Loading and sorting events.
 *
 * Every page that lists events goes through this file, so that "which events are
 * upcoming?" is answered in exactly one place. If that logic ever needs to
 * change, it changes here and the whole site follows.
 */

import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { toInstant } from './datetime';

export type Event = CollectionEntry<'events'>;
export type Artist = CollectionEntry<'artists'>;

/** Drafts are visible while developing, but never published. */
const isPublished = ({ data }: { data: { draft: boolean } }) => import.meta.env.DEV || !data.draft;

/**
 * Whether an event is still to come.
 *
 * Derived from the date every time the site is built — there is no "past"
 * checkbox for anyone to forget to tick. An event that has an end time counts as
 * upcoming until it finishes, so an all-day workshop does not vanish from the
 * listings at lunchtime.
 */
export function isUpcoming(event: Event, now: Date = new Date()): boolean {
  return toInstant(event.data.end ?? event.data.start) >= now;
}

const bySoonest = (a: Event, b: Event) =>
  toInstant(a.data.start).getTime() - toInstant(b.data.start).getTime();
const byMostRecent = (a: Event, b: Event) => -bySoonest(a, b);

/** All published events, soonest first. */
export async function getEvents(): Promise<Event[]> {
  return (await getCollection('events', isPublished)).sort(bySoonest);
}

/**
 * Upcoming events soonest first, past events most-recent first.
 *
 * The two orderings differ on purpose: for something still to come you want the
 * next one at the top, but in an archive you want the newest at the top.
 */
export async function getEventsByTime(now: Date = new Date()) {
  const events = await getEvents();
  return {
    upcoming: events.filter((event) => isUpcoming(event, now)),
    past: events.filter((event) => !isUpcoming(event, now)).sort(byMostRecent),
  };
}

/** All published artists, alphabetically. */
export async function getArtists(): Promise<Artist[]> {
  return (await getCollection('artists', isPublished)).sort((a, b) => a.data.name.localeCompare(b.data.name));
}

/**
 * The label for an event's booking button.
 *
 * Naming the provider is a small thing that measurably helps: "Book on
 * Eventbrite" reads as legitimate in a way that a bare "Tickets" does not, and
 * people are rightly wary of unexplained payment links. This is the only place
 * the provider is used, and nothing branches on it — swapping ticketing service
 * is an edit to a content file, never a code change. See ADR-006.
 */
export function ticketLabel(event: Event): string {
  switch (event.data.ticketProvider) {
    case 'eventbrite':
      return 'Book on Eventbrite';
    case 'stripe':
      return 'Buy tickets';
    case 'university':
      return 'Book via the University';
    default:
      return 'Book tickets';
  }
}

/** How an event type is described in the interface. */
export const EVENT_TYPE_LABELS: Record<Event['data']['type'], string> = {
  concert: 'Concert',
  workshop: 'Workshop',
  social: 'Social',
  other: 'Event',
};

/**
 * Resolve the artists booked for an event, failing loudly if one is missing.
 *
 * Astro reports a broken artist reference as an error but still finishes the
 * build with a success code, which would leave a concert quietly published with
 * no performers listed — exactly the silent failure this project is trying to
 * avoid. Throwing here turns it into a real build failure that names the event
 * and the missing artist. See ADR-003.
 */
export async function resolvePeople(event: Event) {
  return Promise.all(
    event.data.people.map(async (person) => {
      const artist = await getEntry(person.artist);
      if (!artist) {
        throw new Error(
          `Event "${event.id}" lists an artist "${person.artist.id}" that does not exist.\n` +
            `Either add src/content/artists/${person.artist.id}.md, or correct the name in ` +
            `src/content/events/${event.id}.md.`,
        );
      }

      // A draft artist gets no page of their own, so an event linking to them
      // would publish a link to nowhere. Caught here, where we can explain it,
      // rather than surfacing later as a puzzling broken link.
      if (artist.data.draft && !import.meta.env.DEV) {
        throw new Error(
          `Event "${event.id}" lists the artist "${artist.id}", but that artist is marked ` +
            `\`draft: true\` and so has no page.\n` +
            `Either remove \`draft: true\` from src/content/artists/${artist.id}.md, or remove ` +
            `them from src/content/events/${event.id}.md.`,
        );
      }

      return { role: person.role, artist };
    }),
  );
}
