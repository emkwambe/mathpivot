import {
  SUMMER_CLINICS,
  clinicDateLabel,
  isUpcoming,
  waveStartLabel,
} from "@/lib/summer-season";

const propel = SUMMER_CLINICS.find((c) => c.slug === "propel-7")!;

describe("summer-season date guard", () => {
  it("treats the end day itself as upcoming", () => {
    expect(isUpcoming("2026-07-15", new Date("2026-07-15T23:00:00Z"))).toBe(
      true,
    );
    expect(isUpcoming("2026-07-15", new Date("2026-07-16T00:00:00Z"))).toBe(
      false,
    );
  });

  it("renders clinic dates before the season", () => {
    expect(clinicDateLabel(propel, new Date("2026-05-01T12:00:00Z"))).toBe(
      "July 6 – July 15",
    );
    expect(waveStartLabel(2, new Date("2026-05-01T12:00:00Z"))).toBe(
      "Starts July 20",
    );
  });

  it("renders nothing once the season has passed", () => {
    const after = new Date("2026-11-24T12:00:00Z");
    for (const clinic of SUMMER_CLINICS) {
      expect(clinicDateLabel(clinic, after)).toBeNull();
    }
    expect(waveStartLabel(1, after)).toBeNull();
    expect(waveStartLabel(2, after)).toBeNull();
  });
});
