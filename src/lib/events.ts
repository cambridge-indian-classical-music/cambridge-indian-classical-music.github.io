/**
 * Loading and sorting events.
 *
 * Every page that lists events goes through this file, so that "which events are
 * upcoming?" is answered in exactly one place. If that logic ever needs to
 * change, it changes here and the whole site follows.
 */

import { getCollection, type CollectionEntry } from 'astro:content';
import { toInstant } from './datetime';

export type Event = CollectionEntry<'events'>;

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
    case 'trybooking':
      return 'Book on TryBooking';
    case 'sumup':
      return 'Buy tickets';
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
