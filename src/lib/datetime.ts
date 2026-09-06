/**
 * Dates and times.
 *
 * Event times are stored as plain Cambridge wall-clock strings ("2026-11-14T19:30")
 * — the time you would print on a poster, with no timezone attached.
 *
 * Why, and why the code below looks slightly odd:
 *
 *  - Asking editors to write a timezone offset means asking them to know whether
 *    a given date falls in GMT or BST. That is a reliable way to publish concert
 *    times that are an hour wrong.
 *  - Handing a naive string like "2026-11-14T19:30" straight to `new Date()`
 *    makes JavaScript interpret it in *the machine's* timezone. That would mean
 *    the site behaved differently on a laptop in Cambridge and on a build server
 *    in UTC — a genuinely nasty bug to track down.
 *
 * So we do something deliberate and boring: we pin the stored string to UTC when
 * parsing, and we format it back in UTC too. Those two decisions cancel out, and
 * the time displayed is always exactly the time that was typed, on every machine.
 *
 * The one accepted imprecision: during British Summer Time, "has this event
 * finished?" is judged up to an hour late. An event stays listed as upcoming for
 * an hour after it starts, which is harmless — arguably even correct, since
 * latecomers are still trying to find the venue.
 */

const LOCALE = 'en-GB';

/** Turn a stored wall-clock string into a Date that sorts and compares correctly. */
export function toInstant(wallClock: string): Date {
  return new Date(`${wallClock}:00Z`);
}

/** Read the stored wall clock back out unchanged. See the note above about UTC. */
function parts(wallClock: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: 'UTC' }).format(toInstant(wallClock));
}

/** "Saturday 14 November 2026" */
export function formatDate(wallClock: string): string {
  return parts(wallClock, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** "Sat 14 Nov 2026" — for cards and other tight spaces. */
export function formatDateShort(wallClock: string): string {
  return parts(wallClock, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

/** "7:30 pm" */
export function formatTime(wallClock: string): string {
  return parts(wallClock, { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** "7:30 pm – 9:30 pm", or just the start time if there is no end. */
export function formatTimeRange(start: string, end?: string): string {
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);
}

/**
 * The value for a `<time datetime="...">` attribute.
 *
 * Cambridge is UTC+00:00 in winter and UTC+01:00 in summer, so we work out which
 * applies on the day in question rather than guessing. This matters because
 * calendar apps and search engines read this attribute, and getting it wrong
 * puts the event in someone's diary at the wrong time.
 */
export function toMachineDateTime(wallClock: string): string {
  return `${wallClock}:00${londonOffset(wallClock)}`;
}

/**
 * Work out Cambridge's UTC offset on a given date, without a date library.
 *
 * `Intl` knows the full history of British Summer Time, so we ask it rather than
 * trying to reimplement the rules (which have changed more often than people
 * expect). We pin the naive string to UTC first; the result is only wrong within
 * the single ambiguous hour when the clocks go back, which no concert programme
 * has ever depended on.
 */
function londonOffset(wallClock: string): string {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    timeZoneName: 'longOffset',
  }).formatToParts(toInstant(wallClock));

  const name = formatted.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  // `longOffset` gives "GMT" in winter and "GMT+01:00" in summer.
  return name === 'GMT' ? '+00:00' : name.replace('GMT', '');
}
