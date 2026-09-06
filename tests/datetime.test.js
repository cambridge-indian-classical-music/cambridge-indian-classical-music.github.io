/**
 * Tests for date handling.
 *
 * Dates are the part of this site most likely to go subtly wrong: a concert
 * showing the wrong time is worse than a concert not showing at all, and British
 * Summer Time means the bug would only appear for half the year. These tests pin
 * down the behaviour described in src/lib/datetime.ts.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDate,
  formatDateShort,
  formatTime,
  formatTimeRange,
  toInstant,
  toMachineDateTime,
} from '../src/lib/datetime.ts';

describe('displaying times', () => {
  test('shows back exactly the time that was typed', () => {
    // The whole point: an editor writes 19:30, the audience sees 7:30 pm —
    // regardless of the timezone of the machine that built the site.
    assert.equal(formatTime('2026-11-14T19:30'), '7:30 pm');
    assert.equal(formatTime('2026-06-14T19:30'), '7:30 pm'); // same in British Summer Time
    assert.equal(formatTime('2026-11-14T09:05'), '9:05 am');
  });

  test('formats dates readably', () => {
    assert.equal(formatDate('2026-11-14T19:30'), 'Saturday, 14 November 2026');
    assert.equal(formatDateShort('2026-11-14T19:30'), 'Sat, 14 Nov 2026');
  });

  test('shows a time range only when there is an end time', () => {
    assert.equal(formatTimeRange('2026-11-14T19:30', '2026-11-14T21:30'), '7:30 pm – 9:30 pm');
    assert.equal(formatTimeRange('2026-11-14T19:30'), '7:30 pm');
  });
});

describe('machine-readable times', () => {
  test('uses GMT in winter and BST in summer', () => {
    // Calendar apps and search engines read this. Getting it wrong puts the
    // concert in someone's diary an hour out.
    assert.equal(toMachineDateTime('2026-11-14T19:30'), '2026-11-14T19:30:00+00:00');
    assert.equal(toMachineDateTime('2026-06-14T19:30'), '2026-06-14T19:30:00+01:00');
  });

  test('handles the days the clocks change', () => {
    // In 2026 BST runs from 29 March to 25 October.
    assert.equal(toMachineDateTime('2026-03-28T12:00'), '2026-03-28T12:00:00+00:00');
    assert.equal(toMachineDateTime('2026-03-30T12:00'), '2026-03-30T12:00:00+01:00');
    assert.equal(toMachineDateTime('2026-10-24T12:00'), '2026-10-24T12:00:00+01:00');
    assert.equal(toMachineDateTime('2026-10-26T12:00'), '2026-10-26T12:00:00+00:00');
  });
});

describe('sorting', () => {
  test('orders events correctly and does not depend on the build machine', () => {
    assert.ok(toInstant('2026-11-14T19:30') > toInstant('2026-05-02T19:30'));
    assert.equal(toInstant('2026-11-14T19:30').toISOString(), '2026-11-14T19:30:00.000Z');
  });
});
