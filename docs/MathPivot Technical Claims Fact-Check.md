# MathPivot Technical Claims Fact-Check

**Reference date: October 7, 2026.**

The technical draft presents a **plausible research-and-development hypothesis**, but does not establish technical novelty, implementation, or validated performance. Fine-grained skill models, prerequisite representations, adaptive assessment, Bayesian student modeling/knowledge tracing, targeted hints, and coach-facing support all have substantial published prior art. The potentially differentiated work is narrower: empirically calibrating a defined secondary-mathematics ontology, modeling soft prerequisite relationships in an auditable way, and testing whether that model improves a specific coach decision against serious baselines. [1] [2] [3] [4] [5] [6]

Nothing in the supplied record verifies that MathPivot has implemented, calibrated, or validated a 179-node directed acyclic graph (DAG), its edges, a Bayesian engine, real-time telemetry, automated brief generation, a one-to-two-probe method, fewer-than-15-item diagnosis, reduction in tutor preparation time, learner outcomes, or the claimed “root prerequisite gap.” The supplied home page contains public product assertions, but neither marketing assertions nor the technical draft are independent technical evidence. [13]

The appropriate funding posture is therefore a **bounded feasibility proposal**: test one defined grade band/unit and 25–40 version-controlled skills, not a completed AP-wide, patentable, or efficacy-proven platform. This document does not offer a patentability opinion.

## Claim-by-claim fact check and safe replacement language

### 1. “Existing LMS/CAI is broad, linear, coarse, and generic; MathPivot is a paradigm shift.”

**Finding: materially overbroad.** Course-oriented products can report at a course or standards level, but fine-grained cognitive-rule tracking, individualized sequencing, adaptive assessment, targeted feedback, and prerequisite/knowledge-space representations predate MathPivot. Cognitive Tutors tracked rule-level knowledge, knowledge-space theory modeled prerequisite-like structures and adaptive assessment, and Bayesian student models have long supported tailored feedback. [1] [2] [5] [6]

**Use instead:** “Many course-oriented implementations report at the course or standards level. MathPivot proposes to test whether an explicitly specified fine-grained skill model produces more useful diagnostic and coaching decisions than selected course/standards-level and adaptive baselines.”

Do not state that all LMS/CAI tools use only broad linear modules, provide only generic repetition, or cannot localize meaningful skill-level needs.

### 2. “A single graph of exactly 179 non-divisible concepts covers middle school through AP Precalculus, Calculus, and Statistics.”

**Finding: unverified design assertion.** The public page asserts “179 atomic concepts,” but it does not supply a node list, definitions, grade/standards/AP crosswalk, graph export, mappings, expert review, reliability analysis, or validation dataset. Its wording also alternates between 179 curriculum concepts and “179 atomic concepts per course,” so it does not independently establish one cross-grade/AP graph. [13]

“Atomic” or “non-divisible” is not a self-proving mathematical or psychometric property. Granularity must be specified, reviewed, and validated for the intended decision.

**Use instead:** “MathPivot has specified, or proposes to specify, a version-controlled 179-node secondary-mathematics ontology. Its coverage, node granularity, item mappings, and grade/standards/AP crosswalk require expert and empirical validation.”

### 3. “Every directed edge is a strict prerequisite, with P(child mastered | parent unmastered) approximately zero.”

**Finding: unsupported and too strong.** A DAG can be a useful modeling hypothesis, but a drawing of an arrow does not establish acyclicity, strict necessity, or a structural-zero conditional probability. Learners can use alternate strategies, have learned information elsewhere, guess, encounter flawed items, or show responses inconsistent with a proposed edge. Prior work explicitly treats prerequisite structures and student-model relations as objects to elicit or learn, not as universally settled facts. [1] [3] [6]

**Use instead:** “Each edge is a testable, probabilistic prerequisite hypothesis. The model will estimate conditional relations and uncertainty, permit exceptions/alternate strategies, and report out-of-sample fit.”

For each edge, retain the operational mastery definition, expert-elicitation record, prior, conditional-probability estimate with uncertainty, and evidence that the graph can be treated as acyclic for the selected scope.

### 4. “Traditional adaptive testing is one-dimensional IRT and gives zero insight into why a student failed.”

**Finding: misleading comparison.** A unidimensional IRT computer-adaptive test estimates a general latent trait and does not itself encode a prerequisite graph. But IRT is not inherently one-dimensional: multidimensional IRT estimates multiple latent traits, and cognitive-diagnostic models with Q-matrices connect items to discrete attributes to provide fine-grained diagnostic information. These are necessary comparison baselines, not edge cases that can be omitted. [7] [8]

**Use instead:** “A unidimensional IRT CAT estimates general ability without an explicit prerequisite graph. This project will compare its method with multidimensional IRT and cognitive-diagnostic/Q-matrix adaptive models as well as other selected baselines.”

### 5. “BKT plus BFS/DFS maps a student’s exact graph location in real time.”

**Finding: combination of known methods plus an unverified accuracy claim.** Bayesian Knowledge Tracing (BKT) has estimated the probability of learning individual cognitive rules since 1994. Bayesian networks have also been used extensively as intelligent-tutoring student models, including problem-solving systems that combined solution graphs with tailored hints. [4] [5] [6]

Graph search and Bayesian inference are different operations. BFS/DFS or another search policy can select which parent node or probe to examine. Bayesian inference updates a posterior using an explicit prior, transition/forgetting assumptions, and observation likelihoods. Traversal is not itself Bayesian inference.

**Use instead:** “The proposed system will estimate node-level mastery posteriors and use a specified search policy to select candidate prerequisite probes in near real time. Its diagnostic accuracy, latency, and useful decision rate will be tested against external criteria.”

“Exact location” is inappropriate unless calibrated error rates, a ground-truth definition, abstention rules, and subgroup performance support it.

### 6. “Latency anomalies and response patterns reliably trigger a missing-concept diagnosis.”

**Finding: unsupported as a causal trigger.** Response time may be a useful input to a calibrated response/engagement-time model, but it is confounded by rapid guessing, reading load, device/network effects, accommodations, anxiety, strategy, disengagement, and item difficulty. Research on rapid guessing shows that treatment choices can materially bias speed and ability conclusions. [10]

**Use instead:** “Response time may be modeled alongside correctness, item properties, attempts, hints, and context. The incremental value of latency over correctness-only models will be evaluated.”

Do not call latency alone evidence of a prerequisite failure or causal “friction” mechanism.

### 7. “One to two micro-probes diagnose candidate parent nodes.”

**Finding: unverified feasibility claim.** With guessing, slips, varied item quality, and several plausible parent skills, one or two responses cannot be assumed sufficient for a reliable diagnosis. Cognitive-diagnostic adaptive assessment requires item-to-skill mappings and explicit uncertainty; BKT likewise models observation uncertainty rather than treating a small response count as proof. [4] [8]

**Use instead:** “The pilot will test whether one or two additional items can meet a pre-specified posterior-confidence, coverage, and classification-accuracy threshold for selected local decisions. The system will abstain or request more evidence when thresholds are not met.”

Report item parameters, probe selection policy, stopping rule, abstention rate, and accuracy by node and learner subgroup.

### 8. “Recursive traversal finds the lowest unmastered node, the Root Prerequisite Gap/root cause.”

**Finding: causal certainty is not supported.** A response pattern can support a posterior association under a selected ontology; it does not prove that one node caused a downstream error. Existing student models and learned prerequisite-graph work reinforce the need to validate model inferences rather than label them causal truth. [3] [5] [6]

**Use instead:** “The method produces a model-identified candidate prerequisite gap or highest-priority remediation hypothesis.”

Validate the claim through blinded expert diagnosis, targeted remediation versus a comparison condition, downstream performance, and delayed retention—not simply model agreement with its own graph.

### 9. “Exact breakages are found in fewer than 15 interactions, versus a standard 40–60 item adaptive diagnostic.”

**Finding: the claimed result is unsubstantiated and its universal comparator is contradicted.** No code, item bank, parameters, pilot log, test protocol, or external result supports the fewer-than-15 claim. A prominent knowledge-space adaptive system, ALEKS, describes an initial adaptive Knowledge Check of 25–30 questions. This disproves a universal 40–60-item “standard,” but it does not prove MathPivot can reach an equivalent decision in fewer than 15. [1] [8] [9]

**Use instead:** “We will compare median and 90th-percentile item counts and time, coverage, abstention, calibration, and externally assessed diagnostic accuracy using pre-specified baselines.”

### 10. “High-dosage human tutoring is the gold standard; MathPivot makes it precision engineered.”

**Finding: tutoring has evidence in some conditions, but neither phrase proves MathPivot efficacy.** The evidence supports substantial gains from well-designed tutoring in certain settings. The cited federal evidence summary describes stronger effects when tutoring occurs three or more times weekly for at least 30 minutes, with secondary groups no larger than 1:4. [11] [12]

The public Foundation offer asserts two 60-minute sessions weekly, typically five students and never more than six. That differs from the stated frequency/ratio guidance. Labels such as “high-dose” or “high-impact” do not establish learning recovery, implementation fidelity, or outcome effect. [11] [12] [13]

**Use instead:** “Research finds that tutoring can produce substantial learning gains when well implemented. MathPivot will test whether its diagnostic-plus-brief workflow improves tutor efficiency and learner outcomes relative to a matched tutoring baseline.”

### 11. “Tutors frequently spend 20–30 minutes per session reviewing work to decide where to begin.”

**Finding: not verified.** The draft provides no time logs, sampling frame, definition of preparation, or study. It must not be represented as an industry-wide fact.

**Use instead:** “A time-and-motion study will measure pre-session review minutes, diagnostic agreement, and preparation burden among participating tutors.”

### 12. “The automated coaching script is a complete session protocol.”

**Finding: internally incomplete.** The stated Hook (3 minutes), Guided Practice (7 minutes), and Mastery Check (5 minutes) total **15 minutes**, while the Foundation offer states two **60-minute** sessions weekly. It may be a 15-minute diagnostic/remediation segment, but the remaining 45 minutes, transitions, grouping, coach actions, and contingencies are not specified. [13]

**Use instead:** “The proposed 15-minute diagnostic/remediation segment will be integrated into a documented 60-minute session protocol, including remaining instructional time, group-management steps, and fidelity criteria.”

A written script is not evidence of coach adherence or learning impact.

### 13. “The platform automatically generates briefs, logs telemetry/fidelity, and continuously updates global mastery states.”

**Finding: publicly asserted but not independently verified.** The public page says coaches receive pre-built prep briefs, session templates, and mastery tracking, and it says coaches must log what was taught. That does not prove automated brief generation, data-model writes, real-time updates, telemetry coverage, data quality, security controls, or measured protocol adherence. [13]

**Use instead:** “MathPivot proposes or advertises coach prep briefs, templates, mastery tracking, and session logging. The implementation, automation level, model updating, data quality, and fidelity coverage remain to be verified.”

### 14. “The technical-summary comparison proves an NSF Phase I innovation.”

**Finding: unsupported.** Broad module/standards placement, knowledge spaces, BKT, Bayesian student modeling, cognitive diagnosis/Q-matrices, adaptive testing, and tailored hints are established bodies of work. A claim that a 179-node DAG plus traversal is an unprecedented “new category” is contradicted as a categorical novelty claim by the literature. The particular ontology, edge calibration, integration, auditability, and coach workflow could still be differentiating only after evidence is produced. [1] [3] [4] [5] [6] [7] [8]

**Use instead:** “The research question is whether an empirically calibrated secondary-math skill/prerequisite model plus a coach-facing workflow can reduce diagnostic burden while maintaining or improving external diagnostic accuracy and learning outcomes relative to selected knowledge-space, BKT, MIRT/CDM/Q-matrix, and human-tutor baselines.”

## Implemented, proposed, and evidenced: the required distinction

**Publicly asserted:** The MathPivot site describes 179 atomic concepts, two 60-minute Foundation sessions per week, typical cohorts of five (maximum six), coach prep briefs, session templates, mastery tracking, and required coach logging. Those are public assertions only. [13]

**Proposed in the technical draft:** A 179-node cross-grade/AP DAG; strict prerequisites; approximate-zero conditional mastery; BKT plus conditional BFS/DFS; latency-triggered graph traversal; one-to-two micro-probes; a “root” gap; fewer-than-15-item diagnosis; automated briefs; real-time fidelity/telemetry; and continuous mastery-state updates.

**Not evidenced in the authorized record:** Source code; a controlled demonstration; node inventory; edge list; edge provenance; grade/AP standards crosswalk; item bank and Q-matrix; BKT/likelihood/parameter specification; calibration data; scoring logs; probe behavior; system latency; data-retention/security controls; coach fidelity records; implementation records; active product use; independent diagnostic accuracy; learner outcomes; tutor time savings; or evidence for the fewer-than-15-item claim.

This distinction must appear in every funding narrative, deck, technical memo, and application. Do not convert a diagram, a product page, or a proposal description into evidence of deployment, validity, novelty, efficacy, confidence improvement, career readiness, or scalability.

## Bounded Phase I feasibility hypotheses

Do not start with a claim to validate all 179 concepts from middle school through AP. Start with one grade band and one well-defined secondary-math unit, potentially using **25–40 version-controlled skills**. This is a proposed scoping range, not a program requirement or a validated optimum; the item bank, decision purpose, available sample, and budget must determine the final scope. The work should test the following linked hypotheses:

1. **Ontology/edge hypothesis:** A documented soft-prerequisite model for the selected unit can achieve acceptable held-out response prediction and expert-agreement performance. Fixed expert edges and learned/updated soft edges will be compared rather than assumed equivalent.
2. **Diagnostic-efficiency hypothesis:** A model that selects targeted probes can achieve non-inferior externally assessed diagnostic accuracy, calibration, and coverage with fewer items/time than pre-specified baselines, while reporting an honest abstention rate.
3. **Coach-decision hypothesis:** A model-informed coach brief can reduce measured tutor preparation time and improve pre-specified decision quality or fidelity versus an otherwise comparable generic brief.
4. **Learning hypothesis:** Any effect on immediate next-skill performance and delayed retention will be estimated against a matched tutoring/brief comparison, not inferred from diagnostic output alone.

These are tests of uncertain feasibility. They should not be rephrased as promises of root-cause isolation, 15-item performance, or outcome improvement.

## Feasible evaluation plan

### A. Define the artifact before collecting outcome claims

1. Freeze a versioned node dictionary, learning objectives, grade/standards crosswalk, item-to-skill/Q-matrix mapping, edge list, and explicit atomicity criteria.
2. Conduct structured content/expert review, record inter-rater agreement, and specify the edge-acceptance/revision process.
3. Define mastery operationally. Publish or retain priors, BKT transition/guess/slip/forgetting choices, observation/response-time likelihoods, graph-search policy, stopping threshold, abstention rule, and model-versioning policy.
4. Design the item bank for content validity, accessibility, reading load, accommodations, and item-level difficulty/quality. Do not equate an item with a skill without supporting mapping evidence.

### B. Use credible comparison conditions

Compare the proposed model with, at minimum:

1. Course/standards-level placement plus tutor judgment.
2. Skill-tagged BKT without prerequisite edges.
3. Multidimensional IRT or a cognitive-diagnostic model with a reviewed Q-matrix and adaptive stopping.
4. The same skill graph with fixed expert edges versus learned/updated soft edges.
5. Generic coach brief versus model-informed coach brief, with the tutoring experience otherwise held comparable.

The selected models need not all be commercial products. They must be specified before outcome review and implemented/evaluated fairly enough to test the claimed advantage.

### C. Pre-specify outcomes and failure criteria

Report, by overall sample and relevant learner subgroup:

- number of items, completion time, coverage, and abstention;
- held-out response prediction, calibration/Brier score, confidence intervals, and error analyses;
- externally anchored skill-level classification accuracy and agreement with blinded expert diagnosis;
- false candidate-gap rate and failure-to-identify rate;
- incremental value of latency beyond correctness and other item/context features;
- tutor pre-session preparation minutes, brief-use rate, coach protocol fidelity, and implementation deviations;
- immediate next-skill performance and delayed retention; and
- privacy/safeguarding incidents, missingness, attrition, and access/accommodation effects.

Pre-register analysis decisions and set decision thresholds before seeing the primary outcome data. Use an independent evaluator or blinded expert protocol where practicable. The evaluation needs appropriate consent/privacy/FERPA or IRB determination, a data-governance plan, and an equity/accessibility review before collecting student data.

### D. Evidence that would permit stronger language later

Only after the above work can MathPivot consider claims such as “implemented,” “calibrated,” “diagnostically accurate,” “reduces burden,” or “improves outcomes.” Each claim should identify the version, comparison, population, sample, time frame, effect/uncertainty, and limitations. A successful pilot still would not establish a universal causal root, an AP-wide ontology, general efficacy, or patentability.

## Safe technical summary for a proposal

> **MathPivot proposes to build and evaluate a bounded, auditable skill/prerequisite model and coach-facing decision-support workflow for one defined mathematics domain. The work will test whether targeted probes can provide calibrated, actionable candidate-gap information with lower assessment burden than specified adaptive and human-judgment baselines, and whether a model-informed brief improves measured coach preparation or decision quality. The 179-node/AP-wide architecture, automated telemetry, diagnostic performance, and learner outcomes are design claims to be validated rather than established facts.**

## References

[1]: https://www.sciencedirect.com/science/article/pii/0022249690900358 "Koppen & Doignon, How to build a knowledge space by querying an expert"
[2]: http://act-r.psy.cmu.edu/papers/Lessons_Learned.html "Anderson et al., Cognitive Tutors: Lessons Learned"
[3]: https://eric.ed.gov/?id=ED592684 "Chen, González-Brenes & Tian, Joint Discovery of Skill Prerequisite Graphs and Student Models"
[4]: https://link.springer.com/article/10.1007/BF01099821 "Corbett & Anderson, Knowledge tracing: Modeling the acquisition of procedural knowledge"
[5]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5978531/ "Culbertson, Bayesian Networks in Educational Assessment: The State of the Field"
[6]: https://www.cs.ubc.ca/~conati/my-papers/Gertner-AAAI98.pdf "Gertner, Conati & VanLehn, Generating hints using a Bayesian network student model"
[7]: https://pmc.ncbi.nlm.nih.gov/articles/PMC7328237/ "da Silva et al., Incorporating the Q-Matrix Into Multidimensional Item Response Theory Models"
[8]: https://openpublishing.library.umass.edu/pare/article/id/1553/ "Huebner, An Overview of Recent Developments in Cognitive Diagnostic Computer Adaptive Assessments"
[9]: https://www.aleks.com/highered/math/New_IM_HE_Math_Quick_Start_Guide.pdf "ALEKS Faculty Training Guide"
[10]: https://pmc.ncbi.nlm.nih.gov/articles/PMC10177319/ "Deribo, Goldhammer & Kroehne, Changes in the Speed–Ability Relation Through Different Treatments of Rapid Guessing"
[11]: https://ies.ed.gov/learn/blog/high-quality-tutoring-evidence-based-strategy-tackle-learning-loss "U.S. Department of Education IES/REL West, High Quality Tutoring"
[12]: https://edresearchforaction.org/research-briefs/accelerating-student-learning-with-high-dosage-tutoring/ "EdResearch for Action, Design Principles for Accelerating Student Learning With High-Impact Tutoring"
[13]: https://www.mathpivot.com/ "MathPivot public home page"
