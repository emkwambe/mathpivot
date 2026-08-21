export function BrandDisclosure({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-slate-500 ${className}`}>
      MathPivot is a Mpingo Systems, LLC brand. Payments appear on statements as{" "}
      <span className="font-mono">MPINGO*MATHPIVOT</span>.
    </p>
  );
}
