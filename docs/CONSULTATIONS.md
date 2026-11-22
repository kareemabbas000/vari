# Free consultation call (articles → panel)

The "free 30-minute project call" offer turns article readers into enquiries without sending
them anywhere: every entry point opens the same form over the page.

## Entry points (all in `components/consult/`)

| Placement | Where | Trigger name in the panel |
| --- | --- | --- |
| Offer in the article | between the two middle sections of every article (`ConsultInline`) | `in-article` |
| Reminder card | bottom of the screen (desktop: bottom-left, clear of the sidebar) after real engagement (`ConsultNudge`) | `reminder` |
| Reminder tab | the card folds into a small tab if ignored while scrolling on | `reminder-tab` |
| Sidebar card | desktop article sidebar, under the share buttons (`ConsultSideCard`) | `sidebar` |
| End of article / blog | the closing call to action (`BlogCta`) | `blog-cta` |
| Shared link | any URL ending in `#free-call` opens the form | `link` |

The reminder appears once per visit, never before 15 s, and only after 40 s of actual reading
plus half the article, the end of the article, or (desktop) the pointer heading for the tabs.
It stays away for 7 days after "Not now" (30 after the second time) and for good after a request.
It never covers the cookie banner, the form or the in-article offer. State lives in the visitor's
own browser (`state.ts`), never on the server.

## The form (`ConsultDialog`, loaded only when needed)

Phone: bottom sheet. Tablet: centred card. Desktop: two columns with a project image. Two steps:
the kind of project (one tap; skipped when the article's category already says it), then name,
email, optional phone/WhatsApp, preferred time (with quick chips and the visitor's detected time
zone) and an optional note. Esc, the close button, a click outside and the phone's back button
close it; the address only gains `#free-call` while it is open.

## Server and data

`POST /api/consultation` → `submit_consultation()` (service_role only; validates, throttles
3 per email per 10 min and 6 per sender per hour) → table `consultation_requests` → email to the
studio and a confirmation to the visitor in their language (`lib/emails.ts`) → Meta Lead only
with marketing consent. Migration: `supabase/migrations/20261122090000_consultations.sql`
(also schedules deletion after 24 months).

Cost: reading an article costs nothing extra (static page, about 6 KB more JavaScript; the form
loads on demand). One function call and one insert per request.

## Panel

Inbox → Free consultation calls (`/admin/consultations`): statuses new → contacted → call
scheduled → call done (or no-show, archived, spam), a "call booked for" time, internal notes,
one-click email / call / WhatsApp, the person's local time now, and which placement brings the
requests (last 90 days). All texts are editable under Texts & translations → "Free consultation call".
