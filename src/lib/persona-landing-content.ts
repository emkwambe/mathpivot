export interface PersonaLandingContent {
  slug: string;
  personaKey: string;
  title: string;
  metaDescription: string;
  hero: {
    eyebrow: string;
    headline: string;
    headlineAccent: string;
    subheadline: string;
  };
  painPoints: { heading: string; items: string[] };
  solution: {
    heading: string;
    bullets: { title: string; description: string }[];
  };
  recommendedProgram: {
    name: string;
    price: string;
    frequency: string;
    reason: string;
    href: string;
  };
  socialProof: string;
  cta: {
    primary: string;
    primaryHref: string;
    secondary: string;
    secondaryHref: string;
  };
  color: "blue" | "orange" | "emerald" | "red" | "purple" | "indigo";
}

export const PERSONA_LANDING: Record<string, PersonaLandingContent> = {
  homeschool: {
    slug: "homeschool",
    personaKey: "homeschool_family",
    title: "MathPivot for Homeschool Families — Expert Math Coaching",
    metaDescription:
      "You can teach reading. We handle math. MathPivot provides expert math coaching, mastery tracking, and compliance-ready records for homeschool families.",
    hero: {
      eyebrow: "For Homeschool Families",
      headline: "You can teach reading.",
      headlineAccent: "We handle math.",
      subheadline:
        "MathPivot provides expert math coaching for the one subject most homeschool parents don't feel confident teaching past pre-algebra. Small cohorts, dedicated coach, and mastery records that double as compliance documentation.",
    },
    painPoints: {
      heading: "The math cliff is real",
      items: [
        "Pre-algebra hits around grade 6–7, and even STEM-trained parents struggle to teach it well.",
        "Math is sequential — a gap in fractions today becomes an algebra crisis tomorrow.",
        "Homeschool math curriculum ($200–$800/year) is workbooks, not coaching.",
        "You need attendance logs, mastery portfolios, and progress reports for your state.",
      ],
    },
    solution: {
      heading: "Why homeschool families choose MathPivot",
      bullets: [
        {
          title: "Expert math coaching for the subject you can't teach",
          description:
            "Certified math coaches who specialize in grades 5–12 mathematics — from pre-algebra to pre-calculus.",
        },
        {
          title: "Mastery portfolio is your compliance document",
          description:
            "Every concept your child masters is timestamped and exportable. Attendance logs, mastery portfolios, and progress reports are built in.",
        },
        {
          title: "Small cohort with peer interaction",
          description:
            "5–6 students per cohort. Your child learns math alongside peers — something worksheets can't provide.",
        },
        {
          title: "Aligned to your state standards",
          description:
            "Diagnostic and progression map to NC, TX, FL, VA, and other state standards. Portable and defensible.",
        },
      ],
    },
    recommendedProgram: {
      name: "Foundation Coaching",
      price: "$349/mo",
      frequency: "2 coaching meetings/week",
      reason:
        "Foundation is the standard fit for grades 5–10 homeschool families. Includes named coach, mastery tracking, and compliance exports.",
      href: "/pricing",
    },
    socialProof:
      "Homeschool students are the fastest-growing segment in K-12 (4.9%/year), and math is the #1 outsourced subject.",
    cta: {
      primary: "Take the Free Diagnostic",
      primaryHref: "/diagnostic",
      secondary: "View Coaching Programs",
      secondaryHref: "/pricing",
    },
    color: "emerald",
  },
  competition: {
    slug: "competition",
    personaKey: "competition_math",
    title: "MathPivot for Competition Math — AMC, MATHCOUNTS, and Beyond",
    metaDescription:
      "Advanced math coaching for AMC, MATHCOUNTS, and AIME. Small cohorts (5-6 students), dedicated coach, and Mathathlon competition prep — not AoPS self-study or 20-student RSM classes.",
    hero: {
      eyebrow: "For Competition Math Families",
      headline: "Your child doesn't need help.",
      headlineAccent: "They need a challenge.",
      subheadline:
        "MathPivot Advanced prepares students for AMC 8/10/12, MATHCOUNTS, and AIME with a dedicated coach in cohorts of 5–6. Not self-paced AoPS. Not 20-student RSM classes. Real coaching.",
    },
    painPoints: {
      heading: "What competition families tell us",
      items: [
        "AoPS is powerful but self-paced — no coach, no accountability.",
        "RSM classes have 20+ students — advanced kids get lost or bored.",
        "Kumon and Mathnasium are for remediation, not extension.",
        "AMC/MATHCOUNTS prep requires expert guidance, not just problem sets.",
      ],
    },
    solution: {
      heading: "Why competition families choose MathPivot",
      bullets: [
        {
          title: "Advanced program built for AMC, MATHCOUNTS, AIME",
          description:
            "Dedicated Mathathlon competition prep, problem-solving strategies, and past-competition analysis.",
        },
        {
          title: "5–6 student cohorts, not 20+",
          description:
            "Small groups let advanced students think out loud, debate approaches, and learn from peers at their level.",
        },
        {
          title: "Named coach who knows your child's ceiling",
          description:
            "Same coach throughout — tracks growth, adjusts difficulty, and connects math to future STEM pathways.",
        },
        {
          title: "Career exposure to real STEM professions",
          description:
            "Advanced students explore actuarial science, engineering, ML, and quantitative finance — math with a destination.",
        },
      ],
    },
    recommendedProgram: {
      name: "MathPivot Advanced",
      price: "$799/mo",
      frequency: "2–3 coaching meetings/week + additional opportunities",
      reason:
        "Advanced is the primary fit for competition-focused families. Includes advanced projects, competition prep, career exploration, and parent strategy reviews.",
      href: "/pricing",
    },
    socialProof:
      "300,000+ students register for AMC each year. The path to USAMO/MOP starts with structured coaching, not self-study.",
    cta: {
      primary: "Take the Free Diagnostic",
      primaryHref: "/diagnostic",
      secondary: "Learn About Advanced",
      secondaryHref: "/pricing",
    },
    color: "purple",
  },
  "travel-ball": {
    slug: "travel-ball",
    personaKey: "travel_ball_family",
    title: "MathPivot for Travel Ball Families — The Travel Ball of Math",
    metaDescription:
      "Same development model, better ROI. Named coach, structured seasons, competition, and measurable growth — for math, not sports. From $349/mo.",
    hero: {
      eyebrow: "For Travel Ball Families",
      headline: "The travel ball model",
      headlineAccent: "applied to math.",
      subheadline:
        "You already invest $10,000–$20,000/year in athletic development. MathPivot brings the same structure — named coach, structured seasons, competition, measurable growth — to the subject that opens more scholarship doors: math.",
    },
    painPoints: {
      heading: "Where sport ROI meets academic ROI",
      items: [
        "70% of youth athletes drop out by age 13 — the exact age math confidence peaks or crashes.",
        "Academic scholarships outnumber athletic scholarships 30:1.",
        "Your child gets coached in sports. Then does homework alone.",
        "Math confidence at grades 5–8 predicts STEM career choice more than any other factor.",
      ],
    },
    solution: {
      heading: "The MathPivot method — familiar and proven",
      bullets: [
        {
          title: "Named math coach for the season",
          description:
            "One coach throughout — just like your travel ball coach. Builds relationship, knows the athlete, adjusts training.",
        },
        {
          title: "Structured programs, not hourly tutoring",
          description:
            "Foundation, Acceleration, Advanced — clear pathways with measurable outcomes, not scattered hours.",
        },
        {
          title: "Competition calendar",
          description:
            "MATHCOUNTS, AMC 8/10, and Mathathlon — training toward real events with real stakes.",
        },
        {
          title: "5–6 student cohorts",
          description:
            "Small squad, focused development. Team spirit meets individual coaching.",
        },
      ],
    },
    recommendedProgram: {
      name: "Acceleration Coaching",
      price: "$549/mo",
      frequency: "3 coaching meetings/week",
      reason:
        "Acceleration is the primary fit for competitive families. Includes competition readiness, advanced problem-solving, and school curriculum anticipation.",
      href: "/pricing",
    },
    socialProof:
      "MathPivot Acceleration at $549/mo is 30–50% of what most travel ball families spend monthly on sports — for higher lifetime ROI.",
    cta: {
      primary: "Take the Free Diagnostic",
      primaryHref: "/diagnostic",
      secondary: "See All Programs",
      secondaryHref: "/pricing",
    },
    color: "orange",
  },
  schools: {
    slug: "schools",
    personaKey: "school_partner",
    title: "MathPivot for Schools & Districts — Structured Math Support",
    metaDescription:
      "Certified math coaches, diagnostic-driven placement, and mastery data for administrators. Small groups, structured programs, state-aligned assessments.",
    hero: {
      eyebrow: "For Schools & Districts",
      headline: "Structured math support.",
      headlineAccent: "Measurable outcomes.",
      subheadline:
        "MathPivot provides certified math coaches, diagnostic-driven placement, and mastery tracking for schools and districts. Not generic tutoring — a coaching system designed for equity and data.",
    },
    painPoints: {
      heading: "The tutoring gap",
      items: [
        "ESSER funding ended and tutoring participation dropped 49% → 43%.",
        "73% of 8th graders are below proficient in math (NAEP 2024).",
        "Less than 2% of students receive high-quality tutoring.",
        "Generic programs show no measurable improvement.",
      ],
    },
    solution: {
      heading: "What we bring to your school",
      bullets: [
        {
          title: "Certified math coaches — not substitutes",
          description:
            "All coaches complete MathPivot certification: pedagogy, curriculum, calibration, and monthly quality review.",
        },
        {
          title: "Diagnostic-driven placement",
          description:
            "Every student starts with a 15-minute diagnostic that identifies gaps by domain and standard.",
        },
        {
          title: "Mastery data for administrators",
          description:
            "Real-time dashboards show cohort mastery progression, attendance, and coach performance metrics.",
        },
        {
          title: "State-aligned assessments",
          description:
            "Questions and progressions map to your state standards. Defensible for Title I and ESSER reporting.",
        },
      ],
    },
    recommendedProgram: {
      name: "Partnership Program",
      price: "Custom pricing",
      frequency: "Bulk cohorts with dedicated program manager",
      reason:
        "School partnerships include diagnostic assessment, cohort placement, weekly progress reports, and end-of-program outcome analysis.",
      href: "/get-started",
    },
    socialProof:
      "Small-group coaching in the research-optimal 5–6 student range produces the strongest measurable outcomes vs. 1:1 tutoring or large-group classes.",
    cta: {
      primary: "Request Partnership Consultation",
      primaryHref: "/get-started",
      secondary: "Learn About the Diagnostic",
      secondaryHref: "/diagnostic",
    },
    color: "indigo",
  },
  "falling-behind": {
    slug: "falling-behind",
    personaKey: "falling_behind",
    title: "MathPivot for Students Falling Behind in Math",
    metaDescription:
      "Grades dropping? Homework a struggle? Take our free 15-minute diagnostic to identify exactly where the gap is — then rebuild confidence with a named math coach.",
    hero: {
      eyebrow: "When your child needs help now",
      headline: "Their grades dropped.",
      headlineAccent: "Let's find the gap.",
      subheadline:
        "Our free 15-minute diagnostic identifies exactly where your child's math foundation broke down — then a named MathPivot coach rebuilds it. Summer clinic entry at $249.",
    },
    painPoints: {
      heading: "What we hear from parents",
      items: [
        '"Their report card shocked me — I didn\'t see it coming."',
        "\"They say they 'hate math' now — they didn't a year ago.\"",
        '"We tried YouTube. We tried the teacher\'s office hours. Nothing stuck."',
        '"I don\'t know where the gap is or how to help."',
      ],
    },
    solution: {
      heading: "How MathPivot helps students catch up",
      bullets: [
        {
          title: "Free diagnostic identifies the exact gap",
          description:
            "15 minutes. 5 math domains. You'll know where the foundation broke — and where to start rebuilding.",
        },
        {
          title: "Summer clinic — low-risk entry",
          description:
            "$249 8-day clinic (Propel Math 7) gets your child immediate support and momentum before the school year starts.",
        },
        {
          title: "Named coach who knows your child",
          description:
            "Same coach every session. Builds trust, tracks progress, rebuilds confidence — not a rotating stranger.",
        },
        {
          title: "Weekly progress reports",
          description:
            "You'll see mastery gains week by week. Visible progress restores parent confidence too.",
        },
      ],
    },
    recommendedProgram: {
      name: "Foundation Coaching",
      price: "$349/mo",
      frequency: "2 coaching meetings/week",
      reason:
        "Foundation rebuilds confidence and closes learning gaps. Perfect for students transitioning back to grade-level performance.",
      href: "/pricing",
    },
    socialProof:
      "24% of US families used tutoring in 2025. But less than 2% receive high-quality, structured coaching — the kind that actually produces results.",
    cta: {
      primary: "Take the Free Diagnostic Now",
      primaryHref: "/diagnostic",
      secondary: "See Summer Clinics",
      secondaryHref: "/summer",
    },
    color: "red",
  },
  proactive: {
    slug: "proactive",
    personaKey: "proactive_suburban",
    title: "MathPivot for Proactive Parents — Beyond Grade Level",
    metaDescription:
      "Your child isn't failing — but they're not excelling either. MathPivot's structured coaching helps students go beyond grade level with a named coach and mastery tracking.",
    hero: {
      eyebrow: "For Parents Investing in the Long Game",
      headline: "At grade level isn't enough.",
      headlineAccent: "Build the edge.",
      subheadline:
        "Your child isn't failing. They're just not excelling. MathPivot gives motivated families a structured coaching pathway — named coach, mastery tracking, and measurable growth toward advanced coursework.",
    },
    painPoints: {
      heading: "What proactive parents notice",
      items: [
        "\"Their teacher says 'meeting standards' — but is that enough?\"",
        '"Peers are in RSM, Kumon, Mathnasium — what are we missing?"',
        '"Homework help doesn\'t build long-term mathematical thinking."',
        '"We want a real system, not just extra practice."',
      ],
    },
    solution: {
      heading: "The MathPivot advantage",
      bullets: [
        {
          title: "Named coach, not rotating tutors",
          description:
            "One coach throughout the program. Knows your child's pattern, adjusts pacing, and builds a real relationship.",
        },
        {
          title: "Mastery dashboard shows real progress",
          description:
            "Every concept mapped and tracked. See exactly what your child has mastered — not just hours logged.",
        },
        {
          title: "Structured programs with clear outcomes",
          description:
            "Foundation → Acceleration → Advanced. Each level has defined outcomes, not open-ended hours.",
        },
        {
          title: "Career exposure makes math relevant",
          description:
            "Kids stay engaged when they see how math connects to engineering, data science, finance, and design.",
        },
      ],
    },
    recommendedProgram: {
      name: "Foundation Coaching",
      price: "$349/mo",
      frequency: "2 coaching meetings/week",
      reason:
        "Foundation is our most popular program for proactive families. Upgrade to Acceleration ($549/mo) when your child is ready to push ahead.",
      href: "/pricing",
    },
    socialProof:
      "Suburban families investing $1,300–$3,000/year on supplementary education — MathPivot Foundation at $349/mo delivers structured coaching that generic tutoring can't.",
    cta: {
      primary: "Take the Free Diagnostic",
      primaryHref: "/diagnostic",
      secondary: "View All Programs",
      secondaryHref: "/pricing",
    },
    color: "blue",
  },
};

export const PERSONA_SLUGS = Object.keys(PERSONA_LANDING);
