/**
 * CUICM membership form — the receiving end.
 *
 * This file is NOT part of the website. It is a Google Apps Script web app,
 * bound to the society's membership spreadsheet, that receives what somebody
 * types into /membership/join, writes it down, and sends them to the Stripe
 * payment link for the rate they qualify for.
 *
 * It lives in this repository so that it has a history and survives handover —
 * the copy that RUNS is the one in Apps Script, and the two can drift. Edit
 * here first, then paste. docs/MEMBERSHIP_FORM.md has the whole setup, and the
 * reasons behind the awkward parts.
 *
 * NOTHING SECRET BELONGS IN THIS FILE. This repository is public. The
 * spreadsheet ID and both Stripe links are read from Script Properties, which
 * live in the Apps Script project and are editable from its settings screen
 * without touching code. That is deliberate: changing a price at the start of a
 * year must not require a committee member to edit JavaScript.
 */

/* -------------------------------------------------------------------------- */
/* Configuration — all of it in Script Properties, none of it here             */
/* -------------------------------------------------------------------------- */

/**
 * Required properties. If one is missing the script fails loudly on the first
 * submission rather than silently dropping applications, which is the failure
 * nobody would notice until somebody asked why the list was empty.
 */
var REQUIRED_PROPERTIES = [
  'SPREADSHEET_ID',
  'SHEET_NAME',
  'STRIPE_LINK_STUDENT',
  'STRIPE_LINK_GENERAL',
  'MEMBERSHIP_YEAR',
  /*
   * SITE_URL is a property rather than a constant because the website is moving
   * from its github.io address to a societies.cam.ac.uk subdomain — a decision
   * recorded as open in ARCHITECTURE.md section 5. A hardcoded address here
   * would keep working while pointing at the old site, which is the worst kind
   * of wrong: nothing errors, the links just go somewhere stale.
   */
  'SITE_URL',
  'CONTACT_EMAIL',
];

function config_() {
  var properties = PropertiesService.getScriptProperties().getProperties();
  var missing = REQUIRED_PROPERTIES.filter(function (key) {
    return !properties[key];
  });
  if (missing.length) {
    throw new Error(
      'Apps Script is not set up: missing Script Properties ' +
        missing.join(', ') +
        '. See docs/MEMBERSHIP_FORM.md.',
    );
  }
  return properties;
}

/* -------------------------------------------------------------------------- */
/* Validation — the same rules the form applies, applied again                 */
/* -------------------------------------------------------------------------- */

/*
 * Why all of this is repeated here: the browser checks are a courtesy to the
 * person filling the form in. They are not a control. Anyone can open developer
 * tools and post whatever they like to this endpoint, so every rule that
 * matters is applied on this side too — above all WHICH RATE SOMEBODY PAYS,
 * which is worked out here from the answers and never taken from the form.
 */

var UNIVERSITY_EMAIL = /^[^@\s]+@([A-Za-z0-9-]+\.)*cam\.ac\.uk$/i;
var ALUMNI_EMAIL = /^[^@\s]+@(cantab\.net|cantab\.ac\.uk)$/i;
var ANY_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
var CRSID = /^[A-Za-z]{2,4}[0-9]{1,6}$/;
var DATE_OF_BIRTH = /^\d{4}-\d{2}-\d{2}$/;
var GENDERS = ['female', 'male', 'other', 'undisclosed'];

/** Trim, collapse runs of whitespace, and cap the length. */
function clean_(value, maxLength) {
  return String(value == null ? '' : value)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength || 200);
}

/**
 * Check one submission and return either the row to write or the first problem
 * to report back.
 *
 * Returns { ok: true, application: {...} } or { ok: false, message: '...' }.
 */
function validate_(params) {
  var application = {
    firstName: clean_(params.firstName, 80),
    lastName: clean_(params.lastName, 80),
    gender: clean_(params.gender, 20).toLowerCase(),
    dateOfBirth: clean_(params.dateOfBirth, 10),
    cambridge: clean_(params.cambridge, 4).toLowerCase(),
    cambridgeStatus: clean_(params.cambridgeStatus, 10).toLowerCase(),
    universityEmail: clean_(params.universityEmail, 120).toLowerCase(),
    alumniEmail: clean_(params.alumniEmail, 120).toLowerCase(),
    crsid: clean_(params.crsid, 12).toLowerCase(),
    preferredEmail: clean_(params.preferredEmail, 120).toLowerCase(),
    mobile: clean_(params.mobile, 24),
  };

  function fail(message) {
    return { ok: false, message: message };
  }

  if (!application.firstName) return fail('Please give your first name.');
  if (!application.lastName) return fail('Please give your last name.');

  if (GENDERS.indexOf(application.gender) === -1) {
    return fail('Please choose one of the gender options.');
  }

  if (!DATE_OF_BIRTH.test(application.dateOfBirth)) {
    return fail('Please give your date of birth as a real date.');
  }
  /*
   * A date of birth in the future, or implying an age no member has, is a typo
   * or a bot — not somebody to argue with, but not a row worth keeping either.
   */
  var age = ageOn_(application.dateOfBirth, new Date());
  if (age === null || age < 10 || age > 120) {
    return fail('Please check your date of birth.');
  }

  if (application.cambridge !== 'yes' && application.cambridge !== 'no') {
    return fail('Please say whether you are a current student or alumnus of the University.');
  }

  if (application.cambridge === 'yes') {
    if (application.cambridgeStatus !== 'student' && application.cambridgeStatus !== 'alumnus') {
      return fail('Please say whether you are a current student or an alumnus.');
    }
    if (application.cambridgeStatus === 'student') {
      if (!UNIVERSITY_EMAIL.test(application.universityEmail)) {
        return fail('Please give a University email address ending in cam.ac.uk.');
      }
      application.alumniEmail = '';
    } else {
      if (!ALUMNI_EMAIL.test(application.alumniEmail)) {
        return fail('Please give an alumni email address ending in cantab.net or cantab.ac.uk.');
      }
      application.universityEmail = '';
    }
    if (!CRSID.test(application.crsid)) {
      return fail(
        'Please give your CRSid — the letters and numbers at the start of your University email address.',
      );
    }
  } else {
    /* Answers to questions that were not asked are not kept. */
    application.cambridgeStatus = '';
    application.universityEmail = '';
    application.alumniEmail = '';
    application.crsid = '';
  }

  if (application.preferredEmail && !ANY_EMAIL.test(application.preferredEmail)) {
    return fail('That does not look like an email address. Please check it.');
  }

  /*
   * Somebody with no University address and no preferred address has given us
   * no way to reach them at all. The form asks for this; the check is here
   * because the form is not the only way to reach this script.
   */
  var contactEmail = application.preferredEmail || application.universityEmail || application.alumniEmail;
  if (!contactEmail) {
    return fail('Please give an email address we can reach you on.');
  }
  application.contactEmail = contactEmail;

  /*
   * The rate is decided HERE, from the answers, and nowhere else. The form
   * shows a price as a courtesy; it does not get a say in what is charged.
   */
  application.tier =
    application.cambridge === 'yes' && application.cambridgeStatus === 'student' ? 'student' : 'general';

  return { ok: true, application: application };
}

/** Whole years between a yyyy-mm-dd string and a date, or null if unparseable. */
function ageOn_(dateOfBirth, on) {
  var parts = dateOfBirth.split('-');
  var year = Number(parts[0]);
  var month = Number(parts[1]);
  var day = Number(parts[2]);
  var born = new Date(year, month - 1, day);
  if (born.getFullYear() !== year || born.getMonth() !== month - 1 || born.getDate() !== day) {
    return null;
  }
  var years = on.getFullYear() - year;
  var beforeBirthday = on.getMonth() < month - 1 || (on.getMonth() === month - 1 && on.getDate() < day);
  return beforeBirthday ? years - 1 : years;
}

/* -------------------------------------------------------------------------- */
/* The reference — what ties a row here to a payment in Stripe                 */
/* -------------------------------------------------------------------------- */

/**
 * Every application gets a short reference, which is written to the spreadsheet
 * AND passed to Stripe as `client_reference_id`. It then appears against the
 * payment in the Stripe dashboard.
 *
 * THIS IS THE WHOLE RECONCILIATION MODEL, so it is worth being clear about why
 * it exists. Filling in this form is not paying. Some people will fill it in
 * and never pay; a few will pay from a link somebody sent them without ever
 * filling it in. Matching the two lists on a name or an email address means
 * matching on things people type differently every time. The reference is a
 * value both sides agree on because one side generated it.
 *
 * Without it, "who is actually a member?" becomes a fuzzy-matching job every
 * September. Do not remove it because it looks like clutter.
 */
function reference_(year) {
  var alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; /* no I, O, 0, 1 */
  var suffix = '';
  for (var i = 0; i < 6; i++) {
    suffix += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return 'CUICM-' + year + '-' + suffix;
}

/* -------------------------------------------------------------------------- */
/* Writing it down                                                             */
/* -------------------------------------------------------------------------- */

var COLUMNS = [
  'Reference',
  'Submitted',
  'First name',
  'Last name',
  'Gender',
  'Date of birth',
  'Cambridge',
  'Status',
  'CRSid',
  'University email',
  'Alumni email',
  'Preferred email',
  'Contact email',
  'Mobile',
  'Rate',
  'Paid',
];

function sheet_(properties) {
  var book = SpreadsheetApp.openById(properties.SPREADSHEET_ID);
  var sheet = book.getSheetByName(properties.SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(properties.SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function record_(application, reference, properties) {
  var sheet = sheet_(properties);
  sheet.appendRow([
    reference,
    new Date(),
    application.firstName,
    application.lastName,
    application.gender,
    /*
     * As text, not a date. A spreadsheet will happily reinterpret 03/04/2005 as
     * March or April depending on who opens it and where they are, and a date of
     * birth that quietly changes meaning is worse than one that is awkward to
     * sort. It arrives from the form as yyyy-mm-dd, which sorts correctly as
     * text anyway.
     */
    "'" + application.dateOfBirth,
    application.cambridge,
    application.cambridgeStatus,
    application.crsid,
    application.universityEmail,
    application.alumniEmail,
    application.preferredEmail,
    application.contactEmail,
    /* Also as text: a leading 0 on a mobile number is not optional. */
    application.mobile ? "'" + application.mobile : '',
    application.tier,
    /* Filled in by a human, or by matching against Stripe. See the doc. */
    '',
  ]);
}

/* -------------------------------------------------------------------------- */
/* Where they go next                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Build the payment URL: the right link for the rate, carrying the reference
 * and prefilling the email address so they do not type it twice.
 *
 * `client_reference_id` and `prefilled_email` are Stripe Payment Link query
 * parameters. VERIFY BOTH against Stripe's current documentation before going
 * live — they are the kind of thing that is easy to assume and expensive to get
 * wrong, because a mistyped parameter is silently ignored rather than rejected,
 * and the first sign of trouble is a dashboard full of payments with no
 * reference against them. Test with one real payment and look at it in Stripe.
 */
function paymentUrl_(application, reference, properties) {
  var base = application.tier === 'student' ? properties.STRIPE_LINK_STUDENT : properties.STRIPE_LINK_GENERAL;

  return (
    base +
    (base.indexOf('?') === -1 ? '?' : '&') +
    'client_reference_id=' +
    encodeURIComponent(reference) +
    '&prefilled_email=' +
    encodeURIComponent(application.contactEmail)
  );
}

/* -------------------------------------------------------------------------- */
/* The endpoint                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Two kinds of caller, one handler.
 *
 *   - The website's JavaScript, which sets `render=json` and wants JSON back.
 *   - A browser with JavaScript off, which posted the form the ordinary way and
 *     is now looking at whatever this returns. It gets a page with a link.
 *
 * The second is not a nicety. It is the only thing standing between a student
 * on a locked-down machine and a form that loses their answers silently.
 */
function doPost(e) {
  var params = (e && e.parameter) || {};
  var wantsJson = params.render === 'json';

  try {
    var properties = config_();

    /* Honeypot: invisible on the form, so anything in it came from a bot. */
    if (clean_(params.website, 100)) {
      /* Answer as though it worked. Telling a bot it was caught teaches it. */
      return reply_(wantsJson, true, 'Thank you.', properties.STRIPE_LINK_GENERAL);
    }

    /* Submitted implausibly fast — also a bot. Three seconds is generous. */
    var startedAt = Number(params.startedAt);
    if (startedAt && Date.now() - startedAt < 3000) {
      return reply_(wantsJson, false, 'Please take a moment to check your answers, then try again.', '');
    }

    var checked = validate_(params);
    if (!checked.ok) {
      return reply_(wantsJson, false, checked.message, '');
    }

    var reference = reference_(properties.MEMBERSHIP_YEAR);

    /*
     * One writer at a time. Two people submitting in the same instant can
     * otherwise both be handed the same last row, and one application is lost —
     * rare, entirely silent, and exactly the sort of thing that happens for the
     * first time during the freshers' fair rush.
     */
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      record_(checked.application, reference, properties);
    } finally {
      lock.releaseLock();
    }

    return reply_(wantsJson, true, 'Thank you.', paymentUrl_(checked.application, reference, properties));
  } catch (error) {
    /*
     * Log it where a committee member can find it (Apps Script → Executions),
     * and tell the applicant something true and useful rather than showing them
     * a stack trace.
     */
    console.error(error);
    var contact = PropertiesService.getScriptProperties().getProperty('CONTACT_EMAIL') || 'the Society';
    return reply_(
      wantsJson,
      false,
      'Something went wrong at our end. Please email ' + contact + ' and we will sign you up by hand.',
      '',
    );
  }
}

/**
 * A GET on this URL is somebody pasting it into a browser, not an applicant.
 * Say so plainly rather than returning a confusing error.
 */
function doGet() {
  var siteUrl = PropertiesService.getScriptProperties().getProperty('SITE_URL') || '';
  return HtmlService.createHtmlOutput(
    '<p>This address receives the membership form on the Society website. ' +
      'There is nothing to see here — join at ' +
      '<a href="' +
      siteUrl.replace(/"/g, '&quot;') +
      '/membership">the membership page</a>.</p>',
  );
}

function reply_(wantsJson, ok, message, redirectUrl) {
  var siteUrl = PropertiesService.getScriptProperties().getProperty('SITE_URL') || '';
  if (wantsJson) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: ok, message: message, redirectUrl: redirectUrl }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  /*
   * The no-JavaScript reply. It cannot be an HTTP redirect — an Apps Script web
   * app returns content, not status codes — so it is a page with a link, styled
   * enough to look like it belongs to the Society rather than like an error.
   */
  var escaped = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  var body =
    ok && redirectUrl
      ? '<h1>Almost done</h1><p>Your details are saved. One step left — paying.</p>' +
        '<p><a class="button" href="' +
        redirectUrl.replace(/"/g, '&quot;') +
        '">Continue to payment</a></p>'
      : '<h1>That did not work</h1><p>' +
        escaped +
        '</p><p><a href="' +
        siteUrl.replace(/"/g, '&quot;') +
        '/membership/join">Go back to the form</a></p>';

  return HtmlService.createHtmlOutput(
    '<!doctype html><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Membership — Cambridge University Indian Classical Music Society</title>' +
      '<style>body{font:17px/1.5 Georgia,serif;background:#faf7f2;color:#1a1714;' +
      'margin:0;padding:3rem 1.5rem;max-width:34rem;margin-inline:auto}' +
      '.button{display:inline-block;padding:.75rem 1.5rem;background:#7c3a2d;color:#faf7f2;' +
      'text-decoration:none;border-radius:4px;font-weight:600}</style>' +
      body,
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}
