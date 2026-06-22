"use client";

export default function Math1DiagnosticPrint() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="w-[8.5in] bg-white shadow-2xl print:shadow-none relative">
        {/* Page 1 */}
        <div className="p-10 min-h-[11in] flex flex-col">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="font-bold text-slate-900 text-xl">
                MathPivot
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">
                Math 1 Diagnostic Assessment
              </p>
              <p className="text-xs text-slate-500">
                Ignite Math 1 Placement · NC Math 1 / Algebra 1
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-xs text-slate-500">Student Name</p>
              <div className="border-b border-slate-300 h-6 mt-1" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Date</p>
              <div className="border-b border-slate-300 h-6 mt-1" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Grade</p>
              <div className="border-b border-slate-300 h-6 mt-1" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Administered By</p>
              <div className="border-b border-slate-300 h-6 mt-1" />
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-6 italic">
            Instructions: Circle the best answer for each question. This
            assessment covers 6 math domains and takes approximately 20 minutes.
            Results will determine program placement.
          </p>

          <div className="space-y-5 flex-1">
            <div className="mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-3">
                Section 1: Number Sense & Operations
              </p>
            </div>

            <Question
              n={1}
              text="Simplify: 2³ × 2⁴"
              choices={["2⁷", "2¹²", "4⁷", "8"]}
              standard="NC.8.EE.1"
            />
            <Question
              n={2}
              text="Between which two integers does √50 lie?"
              choices={["6 and 7", "7 and 8", "8 and 9", "24 and 26"]}
              standard="NC.8.NS.2"
            />

            <div className="mb-2 mt-6">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-3">
                Section 2: Expressions & Equations
              </p>
            </div>

            <Question
              n={3}
              text="Solve for x: 2(x - 3) = 4x + 2"
              choices={["x = -4", "x = -2", "x = 2", "x = 4"]}
              standard="NC.8.EE.7"
            />
            <Question
              n={4}
              text="What is the slope of the line passing through the points (2, 5) and (4, 11)?"
              choices={["2", "3", "6", "8"]}
              standard="NC.M1.F-IF.6"
            />
            <Question
              n={5}
              text="Solve the system of equations: x + y = 10 and 2x - y = 5"
              choices={["x=5, y=5", "x=3, y=7", "x=7, y=3", "x=15, y=-5"]}
              standard="NC.M1.A-REI.6"
            />
            <Question
              n={6}
              text="Factor the expression: x² - 5x + 6"
              choices={["(x-2)(x-3)", "(x+2)(x+3)", "(x-1)(x-6)", "(x+1)(x-6)"]}
              standard="NC.M1.A-SSE.3"
            />

            <div className="mb-2 mt-6">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-3">
                Section 3: Functions
              </p>
            </div>

            <Question
              n={7}
              text="Is the relation {(1,3), (2,5), (3,7), (1,9)} a function?"
              choices={["Yes", "No", "Only if graphed", "Cannot determine"]}
              standard="NC.8.F.1"
            />
            <Question
              n={8}
              text="For f(x) = 2x + 1, what is f(4)?"
              choices={["7", "8", "9", "10"]}
              standard="NC.M1.F-IF.2"
            />
            <Question
              n={9}
              text="Which table represents a linear function?"
              choices={[
                "x:1,2,3,4 y:2,4,8,16",
                "x:1,2,3,4 y:3,5,7,9",
                "x:1,2,3,4 y:1,4,9,16",
                "x:1,2,3,4 y:2,4,6,10",
              ]}
              standard="NC.8.F.3"
            />
          </div>

          <p className="text-xs text-slate-400 text-center mt-4">
            Page 1 of 2 — MathPivot Diagnostic Assessment
          </p>
        </div>

        {/* Page 2 */}
        <div className="p-10 min-h-[11in] flex flex-col print:break-before-page">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
            <span className="font-bold text-slate-900">
              MathPivot Math 1 Diagnostic
            </span>
            <span className="text-xs text-slate-500">Page 2 of 2</span>
          </div>

          <div className="space-y-5 flex-1">
            <Question
              n={10}
              text="A ball is thrown upward. Its height in feet after t seconds is h(t) = -16t² + 48t + 4. At what time does it reach its maximum height?"
              choices={["t = 1", "t = 1.5", "t = 2", "t = 3"]}
              standard="NC.M1.F-IF.4"
            />
            <Question
              n={11}
              text="Which of the following represents exponential growth?"
              choices={["y = 3x + 2", "y = x²", "y = 2(1.5)ˣ", "y = 2(0.5)ˣ"]}
              standard="NC.M1.F-LE.1"
            />

            <div className="mb-2 mt-6">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-3">
                Section 4: Geometry
              </p>
            </div>

            <Question
              n={12}
              text="A right triangle has legs of length 3 and 4. What is the length of the hypotenuse?"
              choices={["5", "6", "7", "12"]}
              standard="NC.8.G.7"
            />
            <Question
              n={13}
              text="What is the volume of a cylinder with radius 3 and height 10?"
              choices={["30π", "60π", "90π", "900π"]}
              standard="NC.8.G.9"
            />
            <Question
              n={14}
              text="Point A is located at (1, 2) and Point B is located at (4, 6). What is the distance between them?"
              choices={["3", "4", "5", "7"]}
              standard="NC.8.G.8"
            />

            <div className="mb-2 mt-6">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-3">
                Section 5: Statistics & Probability
              </p>
            </div>

            <Question
              n={15}
              text="A bag has 3 red, 5 blue, and 2 green marbles. If you pick one without looking, what is the probability of picking a blue marble?"
              choices={["1/2", "3/10", "1/5", "5/10"]}
              standard="NC.7.SP.7"
            />
            <Question
              n={16}
              text="A scatter plot shows a negative correlation. Which equation is most likely the line of best fit?"
              choices={["y = 2x + 5", "y = -3x + 10", "y = x²", "y = 5"]}
              standard="NC.M1.S-ID.6"
            />
          </div>

          <div className="mt-8 p-5 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm font-bold text-slate-900 mb-3">
              Scoring (Coach Use Only)
            </p>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {[
                { domain: "Number Sense", qs: "1-2", total: "/2" },
                { domain: "Expr & Eq", qs: "3-6", total: "/4" },
                { domain: "Functions", qs: "7-11", total: "/5" },
                { domain: "Geometry", qs: "12-14", total: "/3" },
                { domain: "Statistics", qs: "15-16", total: "/2" },
                { domain: "TOTAL", qs: "", total: "/16" },
              ].map((d) => (
                <div
                  key={d.domain}
                  className="text-center border border-slate-200 rounded p-2"
                >
                  <p className="text-[10px] text-slate-500">{d.domain}</p>
                  <p className="text-xs text-slate-400">{d.qs}</p>
                  <div className="border-b border-slate-300 h-5 mt-1 mx-2" />
                  <p className="text-[10px] text-slate-400 mt-0.5">{d.total}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Recommended Program</p>
                <div className="border-b border-slate-300 h-6 mt-1" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Weakest Domain</p>
                <div className="border-b border-slate-300 h-6 mt-1" />
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center mt-4">
            Generated by MathPivot — mathpivot.com/diagnostic
          </p>
        </div>
      </div>

      <div className="fixed top-4 right-4 print:hidden flex gap-3">
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors shadow-lg"
        >
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}

function Question({
  n,
  text,
  choices,
  standard,
}: {
  n: number;
  text: string;
  choices: string[];
  standard: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="text-sm font-bold text-slate-400 w-6 flex-shrink-0 pt-0.5">
        {n}.
      </span>
      <div className="flex-1">
        <p className="text-sm text-slate-900 font-medium">{text}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1.5">
          {choices.map((c, i) => (
            <span key={i} className="text-sm text-slate-600">
              <span className="font-medium text-slate-400 mr-1">
                {String.fromCharCode(65 + i)}.
              </span>
              {c}
            </span>
          ))}
        </div>
        <p className="text-[9px] text-slate-300 mt-1">{standard}</p>
      </div>
    </div>
  );
}
