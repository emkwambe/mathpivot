# MathPivot: Additional Blind Spots

**The largest remaining uncertainty is whether MathPivot can reliably form, deliver, and retain a profitable cohort—not whether the homepage can attract more leads.** The earlier audit covered public UI, commercial accuracy, trust, search, positioning, and acquisition. It did not establish actual delivery economics, student experience, safeguarding implementation, access controls, or recovery behavior.

The items below are **unverified operational risks and proposed tests**, not newly discovered live defects. Existing controls may already address them. Inspect and accept adequate existing evidence before creating new processes. This addendum uses the October 6, 2026 audit record and targeted official guidance; it is not a fresh recrawl of MathPivot or an internal systems audit.

## BS-01 — Cohort formation is a matching problem, not just a sales problem

A filled customer pipeline does not necessarily produce a viable live group. Five interested families may differ in course, prerequisite readiness, goals, available times, time zone, pace, or coach fit. A headline cohort cap is only one constraint. The public offer reviewed earlier describes typically five learners and a maximum of six. [1]

**What the first report did not sufficiently resolve:** time between payment and a compatible cohort starting; minimum enrollment for launch; whether a family receives interim support; what happens when one learner advances or leaves; and the economics of a partly filled cohort.

**Action:** maintain a matching board by actual instructional readiness, course, schedule, coach, and available seats. Define the minimum launch condition, maximum waiting period, reassignment policy, and truthful waitlist/refund alternative. Avoid taking payment for an uncertain start without explicit terms. A referral from a friend must not override appropriate placement.

**Evidence to close the gap:** reconstruct the first cohort from inquiry to first session. Record eligible inquiries, incompatible schedules, qualified but unmatched families, days to placement, actual group size, and unused coach hours. Model two-, three-, five-, and six-seat cases before setting acquisition budgets.

**Owner:** program operations, supported by enrollment and finance.

## BS-02 — Actual coach compensation may change the entire economics model

The earlier audit recorded a public 60% coach-revenue-share statement and recruitment copy describing $26–$30 per session. Their contractual basis was not verified. They might describe different units, plans, or arrangements; they must not be treated as interchangeable or added together without clarification. [2]

**A material sensitivity:** using the previously audited $379 Foundation monthly price, if 60% means 60% of collected learner revenue, coach compensation is **$227.40 per paid learner-month**, leaving **$151.60 before every other cost**. That alone exceeds the first report's illustrative $205 total variable-cost assumption. The $205 input was a placeholder, not an estimate of MathPivot's actual costs. Under this interpretation it is too low even before other variable costs. [1] [2]

For five full-price paid seats under that same assumed arrangement: billed revenue is $1,895; coach share is $1,137; the remainder is $758 before payment fees, preparation/reporting not included in the share, support, software, acquisition, refunds, and overhead. Formula: `price × paid seats × (1 − coach share)`. These are calculated scenarios, not actual margins.

A different assumed model—$26–$30 per one-hour **cohort** session at two sessions weekly—would imply $225.33–$260.00 per average month for live delivery alone, using `session pay × 2 × 52 ÷ 12`. That is an alternative interpretation, not a verified contract or a directly comparable learner-level cost.

**Action:** obtain the actual agreement and specify the share basis, per-session unit, discount/refund handling, minimum guarantees, preparation, parent reporting, training, substitution, and cancellation pay. Model delivered contribution at actual occupancy and coach workload. Separately track prepaid cash, remaining delivery obligations, refund exposure, and founder labor.

**Evidence to close the gap:** one reconciled cohort-month with collections, coach payouts, all other direct costs, hours worked, refunds/credits, and the resulting contribution. Replace the illustrative acquisition model before deciding what a customer can cost to acquire.

**Owner:** finance and coach operations. Dollar-symbol amounts follow the audited site's notation; its currency code was not confirmed.

## BS-03 — Parent demand does not establish student adoption

Parents pay, but students must attend, participate, and practice. A parent can love a progress report while the learner feels embarrassed, finds the pace wrong, dislikes the group, or silently disengages. Parent satisfaction, student engagement, and mathematical progress are different measures.

**Action:** test the first student experience, not only the landing page. Explain the purpose without deficit labels; give the learner an understandable goal and feedback; check whether peers are compatible; and ask the student directly what helps or obstructs participation. Use brief, age-appropriate feedback with the necessary adult permissions and safeguarding process. Do not turn learner disclosures into advertising segments.

**Evidence to close the gap:** a small supervised pilot records attendance, voluntary participation, appropriate practice follow-through, learner feedback, parent feedback, and reasons for mismatch or departure. Investigate disagreement between parent enthusiasm and student reluctance before expanding the cohort.

**Owner:** learning lead and coach operations.

## BS-04 — Safeguarding needs more than screening and a privacy policy

The first report discussed coach vetting and child-data privacy, but not enough about day-to-day boundaries. Screening is not a complete operating policy for adults interacting with minors. Tutor guidance addresses one-to-one arrangements, professional boundaries, session recording, keeping parents informed, and recognising/responding to concerns. The NSPCC guidance is UK-oriented; it supplies practical examples, not US legal requirements. [3] CDC likewise treats youth-serving organisations as important partners in child-abuse prevention. [4]

**Action:** define permitted communication channels; parent visibility where appropriate; boundaries for direct messages and off-platform contact; handling of one-to-one sessions and breakouts; recording notice, consent, access and retention; appropriate screen-sharing; harassment/bullying response; and reporting/escalation. Name a safeguarding lead and backup. Review mandatory-reporting obligations and emergency procedures with qualified advisers for each actual jurisdiction.

An adult email or parent checkbox is also not proof of legal guardianship or, by itself, whatever verifiable parental consent may be required. Review the real consent pathway rather than assuming the proposed adult-first UI settles it. [7]

**Evidence to close the gap:** coaches can explain and rehearse the response to an inappropriate direct message, peer harassment, an unauthorised adult joining, and a student disclosure. The incident route works even when the founder is unavailable. Do not automatically record every session as a substitute for safeguarding; recording creates its own privacy and retention obligations.

**Owner:** safeguarding lead, operations, and legal/privacy reviewer.

## BS-05 — A secure-looking login does not prove record isolation

The public audit did not test whether a parent can see another family's report, a coach can access unassigned learners, or an institution can retrieve another organisation's roster. It also did not test exports, emailed report links, account recovery, shared-family access, or permissions after a coach leaves.

**Action:** define a role/permission matrix for parent, student, assigned coach, administrator, and partner organisation. Test access server-side with synthetic accounts in an authorised staging environment. Include object IDs, shared links, downloads, reassignment, permission revocation, account recovery, and administrative audit trails—not just whether pages are hidden in the UI.

**Evidence to close the gap:** negative tests confirm cross-family, cross-coach, and cross-organisation requests are denied. A removed coach loses access; report links expire or otherwise follow an approved access policy; administrative changes are attributable. Approve guardian access changes through an appropriate identity and custody-sensitive process rather than a support-agent guess.

**Owner:** engineering/security, supported by privacy and operations. No vulnerability is asserted and no intrusive testing was performed.

## BS-06 — Happy-path checkout QA is not enough

The earlier plan called for end-to-end payment testing. The overlooked part is repeated and incomplete events: payment succeeds but enrollment creation fails; a webhook arrives twice; a cancellation and renewal arrive out of order; the last seat is purchased concurrently; or a refund leaves learning access inconsistent.

Stripe documents duplicate deliveries, retries, and no guaranteed event order. These are normal integration conditions that should be handled, not exceptional assumptions. [5]

**Action:** use verified, idempotent billing-event processing, durable event records, reconciled subscription/enrollment/seat state, and recoverable failures. Do not grant access from a browser success URL alone. Establish a controlled policy for failed payments, grace periods, pauses, cancellations, refunds, and cohort re-entry.

**Evidence to close the gap:** authorised sandbox tests replay and reorder events, interrupt fulfillment, race for the last seat, and exercise cancellation/refund. Each produces one correct enrollment and seat allocation, the correct access/billing state, an appropriate receipt/message, and an operator-visible recovery path.

**Owner:** engineering and revenue operations.

## BS-07 — The emailed diagnostic can fail even when the assessment works

Email is part of the product's delivery promise and its sales handoff. The earlier audit did not verify sender authentication, inbox placement, bounces, wrong-address handling, reminders, or whether the Google Calendar handoff produces a trackable confirmed booking.

Google's guidance distinguishes all-sender requirements from bulk-sender requirements and recommends SPF, DKIM, and DMARC to improve authentication/delivery. Their configuration was not checked for MathPivot. [6]

**Action:** verify sending-domain authentication and actual test messages; distinguish transactional results from optional marketing; monitor failures; provide a secure recovery/resend path; and track provider-confirmed bookings rather than outbound calendar clicks. Avoid placing student details in email subjects or insecure downloadable links.

**Evidence to close the gap:** approved synthetic reports reach test Gmail/Outlook mailboxes; bounces trigger a useful recovery path; an adult can recover a result without receiving another family's data; booking, cancellation, reschedule, and time-zone changes are recorded correctly.

**Owner:** revenue operations and engineering.

## BS-08 — Approved static content does not validate live AI behaviour

The prior record noted an AI-powered-practice claim, but no AI activity was tested. Independent question/answer review does not establish that runtime AI hints, grading, generated follow-ups, or explanations are correct and suitable.

**Action:** define where AI is used, what it may change, and when human review is required. Prefer deterministic or appropriately validated mathematics scoring for consequential answers. Test equivalent forms, rounding, units, notation, diagrams, misleading prompts, attempted answer extraction, and unsafe/off-topic interactions. Make a safe fallback available and avoid letting unreviewed generated material automatically set mastery or placement.

**Evidence to close the gap:** a fixed, reviewed regression set measures mathematical correctness, grading consistency, feedback usefulness, and failure handling across model/prompt versions. A model update does not silently change the learning decision rule. Logs follow the approved child-data policy.

**Owner:** product learning and engineering. If live generative AI is not actually used, record that and apply these checks only to the relevant functionality.

## BS-09 — Measured improvement can be misleading, and graduation is not always failure

The earlier report required baseline and follow-up evidence but did not sufficiently separate repetition effects, selective retention, different test versions, independent instruction, attendance, and missing follow-up data. Higher scores on familiar items are not automatically durable mastery or proof that MathPivot caused the change.

**Action:** include delayed checks and appropriate novel transfer tasks; keep denominators; report missing data and instructional exposure; distinguish service/process evidence from causal learning claims. Separate cancellation because of dissatisfaction, schedule/affordability, coach mismatch, or unmet need from successful goal completion. Do not optimise lifetime subscription length against a learner's interests.

**Evidence to close the gap:** reports identify the tested objective/version, baseline/follow-up population, elapsed period, attendance/exposure, missing observations, and limits. The operating dashboard distinguishes planned completion/graduation, pause, and preventable churn. Testimonials do not substitute for that evidence.

**Owner:** learning/evaluation lead and customer operations.

## BS-10 — Coach continuity and business continuity are distinct promises

A named-coach model is exposed when a coach becomes ill, quits, or cannot serve a timetable. A platform can also fail through lost credentials, database mistakes, vendor outages, or a founder becoming unavailable. Backup existence does not establish successful restoration.

**Action:** maintain a qualified substitute process, handover notes, parent communication, and coach-access revocation. Assign two authorised owners for critical accounts with appropriate security controls. Define recovery objectives and actually rehearse restoring approved test data, outage communication, rescheduling/credits, and deletion propagation to backups as applicable. Keep the recovery process consistent with privacy commitments.

Also review coach agreements for content/IP ownership, confidentiality, permitted communication, training obligations, pay rules, and appropriate employment/contractor treatment. Review insurance needs with a qualified broker. These are review questions, not findings of legal or insurance gaps.

**Evidence to close the gap:** one coach absence is handled without exposing records or losing the learning plan; one restore drill succeeds and its duration is recorded; operations continue without relying on one person's memory or password.

**Owner:** operations, engineering/security, and legal/people adviser.

## Two earlier recommendations should remain hypotheses

**Charlotte is not proven to be the strongest market.** The earlier choice was grounded in the parent company's location, not local conversion evidence, customer concentration, affordability, or coach supply. Confirm actual customer/waitlist distribution and capacity before investing in a city-specific launch. An online, course-specific cohort may prove more coherent than a geographic segment.

**Diagnostic-first is not proven to be the best first action for every buyer.** A parent facing an imminent exam may want a consultation; an advanced student may need specialist fit screening; a school buyer needs procurement-oriented discovery. Test the right entry action by intent. Do not hard-code one funnel merely because it makes the site architecture cleaner.

These refinements do not invalidate the earlier strategy. They distinguish sensible starting assumptions from validated customer behaviour.

## The next evidence to collect

Prioritise a real cohort-month economics reconciliation, a readiness-and-schedule matching review, a supervised student onboarding observation, safeguarding/permissions evidence, and an authorised payment-to-session-to-report failure test. Then run a small round of adult buyer conversations that includes qualified non-buyers and cancellations—not only enthusiastic referrals. Use it to test willingness to pay, the first desired action, objections to group delivery, and what proof changes a purchase decision.

The goal is not ten more documents or a blanket shutdown. It is a short evidence pack showing which controls already work, which specific failures need correction, who owns them, and whether a paid family can receive the promised service with sustainable economics.

## References

[1]: https://www.mathpivot.com/pricing "MathPivot programs and pricing, recorded in the October 6, 2026 public audit"
[2]: https://www.mathpivot.com/careers "MathPivot coach recruitment and compensation claims, recorded in the October 6, 2026 public audit"
[3]: https://learning.nspcc.org.uk/safeguarding-child-protection/tutors "NSPCC safeguarding and child protection for tutors; UK-oriented practical guidance"
[4]: https://www.cdc.gov/child-abuse-neglect/programs/index.html "CDC child-abuse prevention in youth-serving organisations"
[5]: https://docs.stripe.com/webhooks "Stripe webhook event delivery, duplicate handling, ordering, retries, and verification"
[6]: https://support.google.com/mail/answer/81126?hl=en "Google email sender authentication and delivery guidelines"
[7]: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions "FTC COPPA guidance on parental notice, consent, and covered data practices"
