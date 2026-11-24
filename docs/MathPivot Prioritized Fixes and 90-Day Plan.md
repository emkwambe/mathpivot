# MathPivot Prioritized Fixes and 90-Day Plan

**Operating decision:** run MathPivot as a controlled launch, not a scale campaign, until P0 release gates are passed. The immediate objective is not lead volume. It is a truthful sellable offer, a governed diagnostic, an adult-first data flow, a usable mobile conversion path, and an activated first cohort with reliable parent evidence.

**Distinguish correction from verification:** pricing, mobile overflow, public policy access, and crawler-route defects were observed. Internal assessment/content controls, backend behavior, and service outcomes were not audited. Inspect and accept adequate existing internal controls before scheduling new systems; the plan is not evidence that live content is incorrect or that the current service must shut down.

## Severity rules

- **P0 — launch blocker:** confirmed public commercial/data/learning-decision conflict or a non-negotiable release control. Do not add paid traffic or expand through the affected flow until acceptance is met and the accountable owner signs off.
- **P1 — broad-launch blocker:** reproducible accessibility, routing, proof, search, or delivery-readiness issue that harms an acquisition or institutional buyer. Fix before broad launch; any exception needs an owner, expiry date, and written risk acceptance.
- **P2 — optimization:** valuable improvement that must not displace P0/P1 remediation.

**Evidence tags:** **Observed** = directly documented public page/response/render. **Inferred** = evidenced risk or dependency; it does not assert that unobserved app behavior is absent. **Proposed** = recommended operating design.

## Operator backlog

### FIX-01 — P0 — Canonicalize commercial terms and capacity promises

- **Evidence type:** Observed.
- **Why now:** `/pricing` shows Foundation/Acceleration/Advanced at $379/$549/$649 monthly; `/compare` states $349–$799 and Foundation from $349; other audience routes vary plan price/cadence. The homepage displays “15:1 Max Coach Ratio” while programs say cohorts are typically five and never more than six. [1] [2] [3]
- **Accountable role:** Product/finance owner.
- **Supporting roles:** Web/content owner, operations/capacity owner, revenue operations, legal/consumer-terms reviewer.
- **Planning estimate:** 1–3 business days for source/configuration and public copy, plus 1–2 days cross-channel QA. Estimate, not a commitment.
- **Dependencies:** Confirm effective price, USD/currency, tax treatment, current promotion rules, billing/renewal/refund policy, live-cohort cap, coach portfolio definition, and session inclusions.
- **Work:** Create a versioned offer object. It must feed program cards, enrollment, comparison, audience pages, ad/SEO metadata, confirmation emails, CRM templates, and sales scripts. Retire $349/$799 claims unless a live promotion is explicitly qualified. Define “live cohort” and “coach portfolio” separately. Put effective date and owner in the CMS. Replace or close the Summer 2026 scarcity/waitlist route, whose displayed dates are already past at the audit date. [4]
- **Acceptance checks:**
  1. Page/template QA returns the same plan name, price, billing cadence, session frequency, cohort cap, one-to-one inclusion, cancellation/refund treatment, and effective date on every customer-facing asset.
  2. Every plan summary before checkout states amount due today, currency, tax treatment, renewal date/cadence, cancellation-effective date, access through paid period, refund/credit rule, and support route.
  3. A reviewer unfamiliar with operations can explain the maximum live-session size after one read.
  4. No live page uses past date/urgency language for Summer 2026.

### FIX-02 — P0 — Establish assessment, recommendation, and curriculum release governance

- **Evidence type:** Inferred release gate from observed public claims.
- **Why now:** The public diagnostic promises a ~15-minute grade-based, adaptive/domain-scored recommendation and the site markets concept-level mastery. No public blueprint, item/rubric, scoring rule, confidence treatment, report, or versioning artifact was inspectable before the gate. Absence of public artifacts does not mean hidden controls are absent; it does make release governance essential before recommendations steer paid pathways. [5] [6] [3]
- **Accountable role:** Product learning lead.
- **Supporting roles:** Independent qualified math SME, pedagogy reviewer, accessibility/editorial reviewer, engineering QA, coach operations, privacy/legal reviewer.
- **Planning estimate:** 6–10 weeks for first grade-band dossier/pilot; 4–8 weeks for first content registry/release control. Overlapping workstreams are possible. Estimate, not a commitment.
- **Dependencies:** Named learning owner, current item inventory, answer keys/rubrics, event/version storage, staging environment, coach override process.
- **Work:** First inspect existing internal controls and remediate documented gaps. Where needed, create a dossier for every live diagnostic version: intended purpose/limits; grade-domain blueprint; objective/standard and item IDs; adaptive constraints; scoring/recommendation rules; minimum evidence; insufficient-evidence state; accommodations/accessibility; fairness review; change log; pilot/monitoring plan; human review/override. Create or validate a registry requiring objective/prerequisite/grade mapping, author record, independent clean-prompt solution, validated key/rubric/accepted equivalents, pedagogy/accessibility review, product QA, approvals, rollback, re-score, and affected-family remediation.
- **Acceptance checks:**
  1. Synthetic strong, mixed, sparse/low-confidence, and accommodations-flag profiles yield a report with domain evidence, confidence/insufficient-evidence treatment, and a rule trace or human-review flag.
  2. A deliberately wrong answer key, ambiguous item, and broken adaptive branch are blocked in staging.
  3. A post-release defect can roll back an item, identify affected reports, and trigger human remediation.
  4. Recommendation language is approved by learning, product, and privacy/legal owners and describes a preliminary coaching recommendation where appropriate.

### FIX-03 — P0 — Deliver an adult-first, transparent child/student data flow

- **Evidence type:** Observed public collection/design; inferred data-governance requirement.
- **Why now:** The Grade 6 route asks for Parent Name, Email, and Student Name before the assessment, displays COPPA/“Never shared” text, and had no visible public Privacy/Terms link on the inspected route/footer. Direct `/privacy` and `/terms` requests rendered sign-in. This does not establish legal noncompliance or absence of private policies. [6] [8]
- **Accountable role:** Privacy/legal owner.
- **Supporting roles:** Product, web, analytics engineering, CRM/revenue operations, security/IT.
- **Planning estimate:** 1–3 weeks, subject to actual data-map and counsel review. Estimate, not a legal timetable.
- **Dependencies:** Data inventory; processor/subprocessor inventory; retention/deletion/access processes; consent records; privacy contact; counsel-approved wording.
- **Work:** Publish unauthenticated Privacy, Terms, Child/Student Data Notice, and support path. Place visible links beside every relevant form CTA and in footer. Change first diagnostic step to adult email, parent/guardian attestation, entering-grade band, and purpose; defer a full child name where unnecessary. Split service/result contact from optional adult marketing consent. Establish adult marketing, parent account, and student/diagnostic/learning data zones. Prohibit retargeting/ad pixels, advertising audiences, and student identifiers/results in zone 3. Do not upload student lists to ad platforms.
- **Acceptance checks:**
  1. A parent opens readable policy/notice before data entry and can request access/deletion without a login.
  2. Consent record includes purpose, policy/consent version, timestamp, source, adult contact, and withdrawal state.
  3. Network/tag QA finds no student identifier, answer, score, recommendation, or advertising/retargeting request on diagnostic/student routes.
  4. Counsel signs off on policy copy against actual systems, contracts, and operational process.

### FIX-04 — P1 — Repair mobile navigation, accessible names/labels, and contrast

- **Evidence type:** Observed.
- **Why now:** At 390px, the pricing header clips the Free Diagnostic CTA; a narrow-width check found a roughly 480px document layout. The mobile menu control lacks an accessible name and was measured at 36×36px. Public diagnostic/get-started fields lack programmatic labels. Sampled normal text/helper/badge combinations fail the 4.5:1 contrast criterion. [1] [3] [6] [8] [9]
- **Accountable role:** Front-end engineering lead.
- **Supporting roles:** Product designer, QA, accessibility reviewer.
- **Planning estimate:** 3–7 business days for component/remediation work and QA. Estimate, not a commitment.
- **Dependencies:** Shared component shell, actual form validation/error states, accessibility test device/browser access.
- **Work:** Ship a global desktop/mobile header: desktop navigation with Free diagnostic CTA; at ≤767px logo plus 44–48px accessible menu/drawer containing all links/CTA. Add `aria-label`, `aria-expanded`, `aria-controls`, Escape close, focus containment/return. Add persistent visible labels, helpers/errors via `aria-describedby`, and preserved input on error. Update design tokens to pass contrast and provide 2–3px visible focus. Use 44–48px design targets for primary touch controls even though WCAG AA minimum target size is 24×24. [9] [10]
- **Acceptance checks:**
  1. At 320, 360, 390, 414, 768, and 1280px, there is no global horizontal overflow; each header/CTA is fully visible and operable.
  2. Keyboard test opens/closes menu, traps/returns focus correctly, and reaches a skip link/main landmark.
  3. Automated button-name, label/select-name, contrast checks pass; manual screen-reader check announces label, required state, selected value, and error.
  4. Complete form/header QA covers default, focus, hover, loading, disabled, error, and success at 200%/400% zoom.

### FIX-05 — P1 — Move the homepage to diagnostic-first family conversion and visible proof

- **Evidence type:** Observed hierarchy plus inferred conversion risk.
- **Why now:** Homepage primary hero CTA sends families to pricing even though diagnostic is the placement mechanism. It foregrounds 60% coach revenue share and a 15:1 ratio, later mixes recruiting CTA with family conversion, and the inspected public homepage uses abstract cards/SVGs rather than a person/product/report proof artifact. [3] [5] [1]
- **Accountable role:** Growth/product marketing lead.
- **Supporting roles:** Design, front-end, coach operations, claims/privacy owner.
- **Planning estimate:** 2–4 weeks contingent on approved coach/product visual evidence. Estimate, not a commitment.
- **Dependencies:** FIX-01 commercial truth; active-coach/matching facts; permissioned visuals; approved de-identified artifacts.
- **Work:** Use the homepage order in the comprehensive report: diagnostic-first hero; factual three-point proof strip; one assess→coach→report explanation; outcome-first program cards; de-identified report/sample; coach/matching proof; compact audience routes; diagnostic close; support/legal footer. Move recruitment economics to Careers.
- **Acceptance checks:**
  1. Hero primary CTA goes to `/diagnostic`; secondary CTA goes to `/pricing`.
  2. A family can find process, price cue, program fit, report/proof, and diagnostic CTA within five intentional sections.
  3. Final family CTA has only “Start free diagnostic” and “Talk to a coach”; recruiting does not compete.
  4. All visual proof has consent/claim approval and meaningful alt text or decorative marking.

### FIX-06 — P1 — Publish decision-ready product, coach, scope, and school proof

- **Evidence type:** Observed public evidence gap; no hidden functionality is assumed missing.
- **Why now:** Public copy promises practice, mastery logging, weekly reports, named coaches, broad grade/subject availability, state alignment, and homeschool/school exports. The Grade 6 entry gates actual questions behind PII; no public sample report, active coach profile, capability matrix, state/course crosswalk, or export specimen was observed. [5] [6] [3] [11] [12]
- **Accountable role:** Product learning lead.
- **Supporting roles:** Coach operations, school sales, content, privacy/legal, design.
- **Planning estimate:** 2–6 weeks for parent proof/capability matrix; 5–10 weeks for priority state/course mapping and school artifacts. Estimate, not a commitment.
- **Dependencies:** FIX-02 review process; active coach/availability inventory; state/course owners; output/report versions.
- **Work:** Publish three-to-five PII-free diagnostic samples and feedback; redacted diagnostic/weekly report; learner workflow; capability matrix; active coach cards or a transparent matching/quality page; priority state/course crosswalks, sample export, attendance/mastery definitions, data dictionary, and scope limitations. Reconcile “179 concepts.”
- **Acceptance checks:**
  1. No-PII visitor completes a non-persistent sample and understands feedback, report, recommendation limit, and next step.
  2. Parent can state what happens after an incorrect response, what changes mastery, who reviews it, and what weekly action they receive.
  3. Grade/course/modality selector gives a truthful available/consultation-only/waitlist/unsupported result before form submit.
  4. A school buyer retrieves mapping version, owner, review date, export definitions, and a “consultation required” state for uncovered scope.

### FIX-07 — P1 — Restore crawl semantics, search metadata, and seasonal lifecycle control

- **Evidence type:** Observed.
- **Why now:** `/robots.txt`, `/sitemap.xml`, and sitemap-index candidates redirect to login; an intentionally invalid path redirects to login rather than 404. Sampled public pages lack self-canonicals; price metadata is stale; non-home social metadata is incomplete/generic. [13] [14] [1]
- **Accountable role:** Engineering/SEO owner.
- **Supporting roles:** Content owner, program owner, QA.
- **Planning estimate:** 3–7 business days plus post-release inspection. Estimate, not a commitment.
- **Dependencies:** Index/noindex policy, canonical URL inventory, FIX-01 offer data, seasonal owner/expiry dates.
- **Work:** Exempt robots/sitemap from auth middleware; serve public robots and valid XML sitemap. Scope auth only to protected route groups. Render 404 for unknown public paths. Add one absolute canonical, unique title/description, `og:title`, `og:description`, `og:url`, and appropriate social image per indexable route. Apply data-driven title/description to price-bearing pages. Add 30/7/0-day content freshness alerts for seasonal pages. [15] [16]
- **Acceptance checks:**
  1. Unauthenticated `GET /robots.txt` returns 200 text/plain with absolute Sitemap line; `/sitemap.xml` returns valid XML of only indexable, canonical 200 routes.
  2. Unknown public route returns 404; known protected route retains intended auth behavior.
  3. Metadata test reports exactly one canonical, no generic default title, no missing social URL/image, and no visible/metadata price conflict.
  4. Search Console validates sitemap fetch and representative URL inspection after deployment.

### FIX-08 — P1 — Separate family and institution routing, service eligibility, and procurement readiness

- **Evidence type:** Observed/inferred.
- **Why now:** School CTA goes to a family form although a dedicated partnership form exists. General intake invites Grades 1–12, advanced math/CS, and online/in-person/either without public availability/location/service rules. School claims are broad while public proof pack was not observed. [11] [12] [17]
- **Accountable role:** Schools sales lead.
- **Supporting roles:** Revenue operations, web, operations/capacity, privacy/security/legal, product learning.
- **Planning estimate:** 1–3 weeks for routing/forms/service matrix; 2–6 weeks for first procurement pack. Estimate, not a commitment.
- **Dependencies:** Service-owner inventory; geographic delivery rule; school privacy/security process; verified claims/mappings.
- **Work:** Point school CTAs to `/partnerships` or a dedicated `/schools/consultation` route. Add work-email/organization/title/state/grades/learner-count/use-case/timing/procurement fields; never require a roster/child name for first contact. Publish availability matrix and school due-diligence pack. Preserve family `/get-started` route for family leads.
- **Acceptance checks:**
  1. Test school lead produces Account + Opportunity fields with correct `source=school-page`; family lead does not enter B2B pipeline without reclassification.
  2. All paid/partner landing pages state online/in-person coverage or eligibility routing before booking.
  3. No school proposal advances without controlled implementation, data, claims, standards, and sample-report materials.

### FIX-09 — P1 — Govern claims and narrow comparison/competition positioning

- **Evidence type:** Observed claims; proposed governance.
- **Why now:** `/compare` has unsourced competitor facts; schools/homeschool pages make alignment/outcome/compliance-style claims without observed public artifacts; competition page offers AMC/MATHCOUNTS/AIME positioning and price/cadence conflict while active coach evidence is thin. [2] [3] [17] [18]
- **Accountable role:** Claims/legal and marketing lead.
- **Supporting roles:** Product learning, school sales, coach operations.
- **Planning estimate:** 2–6 weeks for claims ledger and reviewed refresh; competition offering may require materially longer staffing/content work. Estimate, not a commitment.
- **Dependencies:** Verified source archive, named evidence owner, legal/marketing approval, specialist coach/curriculum evidence.
- **Work:** Build claim ledger with exact wording, source/method, scope, owner, approval, retrieval date, refresh/retirement date. Reduce competitor comparison to at most three alternatives and source/date every factual claim. Do not lead with competition preparation until scope and qualified delivery are demonstrated; use waitlist/referral if not supported. [19] [20] [21]
- **Acceptance checks:**
  1. Every external claim has a retrievable support record.
  2. Comparison page identifies source/date/plan/region scope and presents fair alternative fit; unsupported fields are removed.
  3. Competition route names coach/scope/prerequisite or changes to an honest waitlist/referral.
  4. School claims link to methodology/proof pack or are narrowed to factual service description.

### FIX-10 — P2 — Simplify secondary forms and measure performance/security changes

- **Evidence type:** Observed form density and lab-only technical opportunity.
- **Why now:** Consultation form requests a dense subject inventory early. The diagnostic picker is a high-quality reusable low-friction pattern. The comparison table needs mobile scroll affordance. Lab Lighthouse is a useful baseline only; CSP is report-only and cache behavior differs by route. [5] [3] [13]
- **Accountable role:** Growth/front-end lead.
- **Supporting roles:** Analytics, security engineering, QA.
- **Planning estimate:** 1–3 weeks for form/comparison improvements; CSP/performance work is staged and measured. Estimate, not a commitment.
- **Dependencies:** Consent design, form/CRM mapping, RUM tooling, checkout/booking compatibility test.
- **Work:** Use progressive family qualification; add mobile comparison cue/cards; add RUM; review report-only CSP telemetry and progressively enforce a tested policy; only adjust cache/JS after confirming anonymous pages are not personalized.
- **Acceptance checks:**
  1. Initial family form has ≤4 adult-controlled required fields; selected values persist after errors.
  2. Compare region has an accessible name/scroll cue or card alternative.
  3. Route/device p75 LCP/INP/CLS and errors are visible; no change is declared successful from one Lighthouse run alone.
  4. Enforced CSP releases only after documented public page, Stripe, and Calendar compatibility tests.

## 90-day implementation sequence

### Week 1 — stop commercial drift and establish owners

**Accountable:** Founder/product owner, finance, operations, web lead.

- Approve one offer truth table: plan, price, currency, tax, cadence, cohort, one-to-one, cancellation/refund/credit, date, and owner.
- Correct comparison/audience/pricing/metadata conflicts. Disable or archive Summer 2026 scarcity.
- Name owners for learning release, privacy, sales/partners, web/SEO, coach operations, and revenue operations.
- Start a live capacity board by grade/course, coach, modality, time zone, recurring session, cohort size, and open seats.

**Exit gate:** FIX-01 fully passes. There is one approved price sheet and no stale public price/seasonal statement.

### Week 2 — repair the public acquisition perimeter

**Accountable:** Web/front-end and SEO lead; privacy/legal owner.

- Ship responsive header/labels/contrast/mobile overflow remediation and shared component QA.
- Fix robots, sitemap, unknown-route 404, canonical/meta/OG framework.
- Publish Contact & Support, Privacy, Terms, cancellation/refund, and Child/Student Data Notice outside authentication.
- Configure the adult-first diagnostic gate and documented privacy/consent capture; do not activate paid media.

**Exit gate:** FIX-04 and core FIX-07 checks pass; FIX-03 must pass before additional acquisition through the collection flow. A test parent can view policy before data entry, and test mobile/keyboard flows work at required breakpoints. Counsel/data-map review may take longer than this planning week; shift downstream launch dates rather than bypassing it.

### Week 3 — make product claims inspectable

**Accountable:** Product learning lead and coach operations.

- Inspect existing registry/dossier/review controls; gate new scored/mastery releases on verified controls, and remediate documented gaps without assuming current live content is defective.
- Inventory actual grade/course/coaches/modalities/locations; publish availability matrix status categories.
- Draft the assessment dossier, mastery definition, coach override/escalation policy, and first parent-friendly method page.
- Assemble only verified active coach profiles or transparent matching/process content.

**Exit gate:** No grade/subject/formats are marketed as active without a delivery owner. Diagnostic/recommendation language is provisionally approved or removed from campaigns.

### Week 4 — publish proof and route buyers correctly

**Accountable:** Growth, product learning, schools sales, revenue ops.

- Build PII-free diagnostic samples, redacted report, weekly parent report, and annotated learning-loop artifact from reviewed content/test data.
- Route school CTA to institutional form; configure Account/Opportunity/B2B source fields and separate family flow.
- Build the first due-diligence packet outline and claims ledger.
- Release homepage conversion architecture/design specification; begin implementation only with approved visuals/artifacts.

**Exit gate:** A no-PII visitor can inspect representative quality and a school lead is no longer forced through family intake.

### Weeks 5–6 — validate the end-to-end service path

**Accountable:** Product, engineering, coach operations, revenue ops, privacy/legal.

- Run authorized controlled end-to-end tests with non-production/test data: adult consent, diagnostic, report/recommendation, plan/terms, payment, CRM source, receipt, coach/seat assignment, welcome, cancellation, support, and parent report routing.
- Execute FIX-02 synthetic profiles, wrong-key/ambiguous-item/broken-branch test, rollback, and affected-report remediation drill.
- Establish consent-aware event dictionary, network QA, de-duplication, CRM stage exits, response SLA, and weekly scorecard.
- Use customer-facing copy only after terms and claims owner approval.

**Exit gate:** No paid traffic or partner cohort if any controlled flow loses data, misstates price/terms, lacks assigned coach/seat confirmation, lacks counsel-approved child-data treatment, or fails assessment/content release control.

### Weeks 7–8 — test the focused message without media scale

**Accountable:** Founder, growth lead, coach/program lead.

- Publish the adult family landing page for **Charlotte-metro Grade 7–9 families** only if service geography and online/in-person availability are confirmed. Charlotte is a launch hypothesis based on parent-company location, not a public availability assertion. [22]
- Publish one coach-reviewed grade-transition resource and one comparison/decision guide with current sourced claims.
- Run one adult workshop and a small number of permissioned community/partner placements. Use referrals and founder/coach outreach only to adult organizers/parents.
- Use the family discovery script, capacity rules, and one weekly scorecard. Do not launch competition, compliance, district, or broad CS demand generation.

**Exit gate:** Positive feedback alone is insufficient. To proceed, the flow must show real source tagging, adult consent, serviceable fit, timely response, available seats, first-session activation, and parent artifact delivery.

### Weeks 9–10 — capped high-intent acquisition experiment

**Accountable:** Growth and finance; founder owns sales quality.

- Finance replaces illustrative unit-economics assumptions with actual costs, early retention, refunds, and activation estimates; signs a contribution-based media cap.
- Launch only adult high-intent search, using separate readiness and advanced-pathway ad groups and matching landing pages. Initial media cap: **$280–$560 total** ($20–$40/day for 14 days) is a planning range, not a promised budget or performance forecast.
- Record verified diagnostic start/completion, booked/attended calls, paid enrollment, activation, and capacity—not just form fills.
- Do not add social/retargeting unless consent/tag tests are passed and adult traffic exists. Any social test is 18+ adult-only, benefit-focused, and never uses student data/audiences. [23] [24]

**Stop rules:** Stop immediately for a privacy/pixel defect, broken form, price/terms discrepancy, no coach-seat availability, or an unsupported claim. Pause a query/ad group when spend reaches twice the finance-approved allowable qualified-outcome cost without a qualifying outcome; analyze intent before changing budgets.

### Weeks 11–12 — readiness-gated partner motion and bottleneck correction

**Accountable:** Founder/schools sales; product learning; privacy/security/legal.

- Complete the first procurement-ready proof packet only to the extent verified: exact scope, sample report, data map, privacy/security contact, mapping method, coach quality process, implementation roles, and pilot template.
- Select up to ten adult-run co-op/learning-center/organization accounts using lawful public organization information or permissioned referrals; no fabricated/purchased lead list.
- Hold founder-led discovery only where coordinator, viable cohort, decision process, and capacity plausibly exist.
- Correct the biggest actual funnel bottleneck: eligibility, diagnostic start/completion, report understanding, consultation show rate, payment/seat handoff, activation, or retention—not whichever metric is easiest to improve.

**Exit gate:** No school/district proposal advances without verified due-diligence materials, operations owner, coach capacity, data/privacy review, scope, and pilot scorecard.

### Week 13 — evidence-based scale/iterate/stop decision

**Accountable:** Founder, finance, product learning, operations, growth.

Review: price/terms parity; policy/consent exceptions; open capacity; source-to-qualified consultation; paid enrollment; first-session activation; attendance; parent-report delivery; early paid-month continuation; refunds/cancellations; support/complaints; contribution; diagnostic/content incidents; and school/pilot readiness. Report counts and denominators, never invented benchmarks.

**Scale only if:** commercial truth remains clean; P0 controls are operating; no material privacy/consent exception exists; current capacity supports enrolled families; activated cohorts receive promised parent artifacts; early contribution is within finance-approved guardrail; and the message/route has evidence of serviceable adult demand. Otherwise iterate one constraint or stop spend.

## Growth KPI definitions and guardrails

Track source and cohort separately. Never report child identifiers, diagnostic answers, scores, recommendations, or free-text goals in marketing analytics.

- **Adult-consented lead:** valid adult contact with recorded purpose/version/timestamp and appropriate contact basis.
- **Diagnostic start/completion:** server-side verified state; do not send score/recommendation to marketing tools.
- **Qualified consultation:** attended adult conversation with documented need, service eligibility, decision path, and capacity plausibility—not an outbound click.
- **Paid enrollment:** secure payment/webhook confirmation with selected approved plan.
- **Activated enrollment:** placement confirmed and first scheduled coaching session attended.
- **30-day continuation:** still paid/active at the defined next paid period; report exact denominator and treatment of pauses/refunds.
- **Cohort fill and live cohort size:** seats filled and actual attendance relative to the defined live cohort cap, not coach portfolio.
- **Parent artifact delivery:** approved weekly report/update delivered on the stated cadence, with delivery-failure reason.
- **Contribution:** collected revenue less agreed direct variable delivery/payment/support/refund costs; it is not profit.

### Illustrative finance guardrail — replace before spend

The observed Foundation price is $379/month. These **assumptions only** were checked in Python: $205 direct variable cost per paid month, 80% activation, 5% adult lead-to-paid-enrollment, and a 3:1 contribution-LTV:CAC rule. They yield maximum enrolled CAC / maximum CPL of: 2 paid months per activated family $92.80 / $4.64; 4 months $185.60 / $9.28; 6 months $278.40 / $13.92. Formula: `(379 − 205) × paid months conditional on activation × 0.80 ÷ 3`, then × 0.05 for CPL. This simplified scenario assumes zero contribution and no additional loss from nonactivated enrollments; actual failed-activation costs/refunds must be added. If observed paid-month retention already includes all enrollments, do not multiply by activation again. This excludes fixed overhead, taxes, marketing operations, and unknowns. It is not a target, benchmark, or forecast. [1]

## Reusable sales and growth assets

### Family hero

> **Find a clearer next step for your student’s math.**  
> Start with a free grade-based diagnostic. Explore coach-led small cohorts for prerequisite skills, current coursework, and advanced learning.  
> **Start the free 15-minute diagnostic**  
> *No cost. No commitment. Results emailed.*

Use only while the diagnostic/recommendation, a named coach or accurate matching process, and result delivery are real and available for the audience.

### First-step family lead form

> **Let’s start with the right next step**  
> Parent or guardian email — required  
> I am a parent or legal guardian — required  
> Student entering-grade band — required  
> What brings you here? — readiness gaps / current-course consistency / advanced planning / other  
> Optional note  
> [Privacy & Child Data Notice]  
> [ ] Send me occasional parent resources and program updates. Optional.

### Parent call close

> “If there is a fit and a seat, I can outline the next step. If you need one-off homework help, a specialist contest sequence, or a service we do not support, I will say so. Would you prefer to start the diagnostic, review a recommendation, or look at current availability?”

### Partnership outreach

> **Subject:** A diagnostic-led math cohort for [Organization]
>
> Hello [Name],
>
> I’m reaching out because [specific public fact about the organization’s math/enrichment program]. MathPivot offers diagnostic-led small-cohort math coaching for families and partner organizations. I’m not assuming it is a fit.
>
> Would a 20-minute conversation be useful to explore whether a bounded cohort or placement diagnostic could complement [Organization]’s current offer for [grades/course]? If not, I will not continue to follow up.
>
> If useful, we will discuss cohort size, schedule, coordinator responsibilities, data handling, and a scoped pilot—not promise an academic outcome.

### Partner/school discovery close

> “I heard [need], [scope], [constraints], and [decision path]. The responsible next step is [send the reviewed packet / draft a bounded pilot / decline or refer] by [date]. Is that accurate?”

### Pilot offer

> **[Organization] × MathPivot Readiness Pilot**  
> Purpose: test operational fit and agreed evidence for [population], not guarantee academic outcomes.  
> Population: [grades/courses], [estimated learners], [selection method], [access needs].  
> Delivery: [dates], [cohorts], [sessions/week], [modality], [coach], [organization coordinator].  
> Evidence: [baseline], data owner, permitted fields, reporting cadence, deletion/return plan.  
> Deliverables: placement output, sessions, attendance/fidelity report, approved update, end-of-pilot review.  
> Scorecard: activation, delivery fidelity, attendance, data completeness, stakeholder experience, and agreed learning measure set after baseline.  
> Decision: stop, adjust, renew, or expand on [date] based on evidence and verified capacity.

## Limits that remain material

- This plan synthesizes only supplied public, read-only evidence from October 6, 2026. It is not a legal, security, WCAG, efficacy, market-demand, financial, or full technical audit.
- No form submission, diagnostic start, report, booking, payment, enrollment, cancellation, login, dashboard, lesson, CRM, analytics, tag-manager, or vendor console was accessed. Back-end behavior is untested, not assumed absent.
- Public claims about effectiveness, coach qualifications, content quality, compliance, standards alignment, availability, outcomes, and privacy were not independently verified.
- The timing and effort figures are **planning estimates**, not commitments. Legal/privacy, assessment validity, and contractual obligations require qualified review based on actual systems and jurisdictions.

## References

[1]: https://www.mathpivot.com/pricing "MathPivot programs and pricing"
[2]: https://www.mathpivot.com/compare "MathPivot comparison page"
[3]: https://www.mathpivot.com/ "MathPivot homepage"
[4]: https://www.mathpivot.com/summer "MathPivot Summer 2026 clinics"
[5]: https://www.mathpivot.com/diagnostic "MathPivot free diagnostic"
[6]: https://www.mathpivot.com/diagnostic/grade/6 "MathPivot Grade 6 diagnostic entry"
[8]: https://www.mathpivot.com/get-started "MathPivot consultation intake"
[9]: https://www.w3.org/TR/WCAG22/#contrast-minimum "W3C WCAG 2.2 contrast minimum"
[10]: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html "W3C Understanding target size minimum"
[11]: https://www.mathpivot.com/for/schools "MathPivot for schools"
[12]: https://www.mathpivot.com/partnerships "MathPivot partnerships"
[13]: https://www.mathpivot.com/robots.txt "MathPivot robots endpoint"
[14]: https://www.mathpivot.com/sitemap.xml "MathPivot sitemap endpoint"
[15]: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap "Google Search Central build and submit a sitemap"
[16]: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls "Google Search Central canonical URL guidance"
[17]: https://www.mathpivot.com/for/homeschool "MathPivot homeschool pathway"
[18]: https://www.mathpivot.com/for/competition "MathPivot competition-family page"
[19]: https://www.mathnasium.com/math-programs "Mathnasium math programs"
[20]: https://artofproblemsolving.com/ "Art of Problem Solving"
[21]: https://www.khanacademy.org/about "Khan Academy about"
[22]: https://mpingo.ai/ "Mpingo Systems"
[23]: https://www.facebook.com/legal/leadgen/tos "Meta Lead Ad Terms"
[24]: https://support.google.com/adspolicy/answer/6008942?hl=en "Google Ads policy on child and teen protections"
