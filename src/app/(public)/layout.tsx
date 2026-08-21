import { MarketingFooter } from "@/components/MarketingFooter";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">{children}</div>
      <MarketingFooter />
    </div>
  );
}
