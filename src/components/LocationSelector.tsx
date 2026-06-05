"use client";

import { useState, useEffect, useTransition } from "react";
import { getUSStates, updateUserLocation } from "@/app/actions/locations";
import type { USState } from "@/app/actions/locations";

interface LocationSelectorProps {
  initialCountry?: string;
  initialState?: string;
  initialCity?: string;
  initialCounty?: string;
  onLocationChange?: (location: {
    country: string;
    stateCode: string;
    city: string;
    county: string;
  }) => void;
  showSaveButton?: boolean;
  compact?: boolean;
}

export default function LocationSelector({
  initialCountry = "US",
  initialState = "",
  initialCity = "",
  initialCounty = "",
  onLocationChange,
  showSaveButton = true,
  compact = false,
}: LocationSelectorProps) {
  const [country, setCountry] = useState(initialCountry);
  const [stateCode, setStateCode] = useState(initialState);
  const [city, setCity] = useState(initialCity);
  const [county, setCounty] = useState(initialCounty);
  const [states, setStates] = useState<USState[]>([]);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (country === "US") {
      startTransition(async () => {
        const data = await getUSStates();
        setStates(data);
      });
    }
  }, [country]);

  useEffect(() => {
    onLocationChange?.({ country, stateCode, city, county });
  }, [country, stateCode, city, county, onLocationChange]);

  function handleSave() {
    startTransition(async () => {
      const result = await updateUserLocation({
        country,
        stateCode: stateCode || undefined,
        city: city || undefined,
        county: county || undefined,
      });
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  const inputClass = compact
    ? "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10"
    : "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 focus:bg-white transition-all";

  const labelClass = compact
    ? "block text-xs font-medium text-slate-600 mb-1"
    : "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="space-y-4">
      <div
        className={
          compact
            ? "grid grid-cols-2 gap-3"
            : "grid grid-cols-1 sm:grid-cols-2 gap-4"
        }
      >
        <div>
          <label className={labelClass}>Country</label>
          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setStateCode("");
              setCity("");
              setCounty("");
            }}
            className={inputClass}
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {country === "US" && (
          <div>
            <label className={labelClass}>State</label>
            <select
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              className={inputClass}
            >
              <option value="">Select state</option>
              {states.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                  {s.has_eoc_exam ? " ★" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {country !== "US" && (
          <div>
            <label className={labelClass}>Province / Region</label>
            <input
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              placeholder="Province or region"
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div
        className={
          compact
            ? "grid grid-cols-2 gap-3"
            : "grid grid-cols-1 sm:grid-cols-2 gap-4"
        }
      >
        <div>
          <label className={labelClass}>City</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>County</label>
          <input
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            placeholder="County"
            className={inputClass}
          />
        </div>
      </div>

      {stateCode && country === "US" && (
        <div className="flex items-center gap-2">
          {states.find((s) => s.code === stateCode)?.has_eoc_exam && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
              EOC exam state — state-specific diagnostics available
            </span>
          )}
          <span className="text-xs text-slate-400">
            {states.find((s) => s.code === stateCode)?.standards_framework}
          </span>
        </div>
      )}

      {showSaveButton && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Saving..." : "Save Location"}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600">Location saved</span>
          )}
        </div>
      )}
    </div>
  );
}
