"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface LocationSelection {
  text: string;
  lat: number;
  lng: number;
}

interface MapboxFeature {
  place_name?: string;
  center?: [number, number];
}

const GEOCODING_ENDPOINT = "https://api.mapbox.com/geocoding/v5/mapbox.places";
const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

type LocationSearchInputProps = {
  value: string;
  onChange: (text: string) => void;
  onSelect: (selection: LocationSelection) => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
};

export function LocationSearchInput({
  value,
  onChange,
  onSelect,
  placeholder = "Search for an address…",
  className,
  "data-testid": testId,
}: LocationSearchInputProps) {
  const [suggestions, setSuggestions] = useState<LocationSelection[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const suppressFetchRef = useRef(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!token || query.trim().length < MIN_QUERY_LENGTH) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      const url = `${GEOCODING_ENDPOINT}/${encodeURIComponent(query.trim())}.json?access_token=${token}&limit=5&types=address,poi,place,locality,neighborhood`;

      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (!res.ok) return;
        const data = (await res.json()) as { features?: MapboxFeature[] };
        const features = data.features ?? [];

        const results: LocationSelection[] = [];
        for (const f of features) {
          if (f.place_name && Array.isArray(f.center) && f.center.length === 2) {
            results.push({
              text: f.place_name,
              lng: f.center[0],
              lat: f.center[1],
            });
          }
        }
        setSuggestions(results);
        setOpen(results.length > 0);
        setActiveIndex(-1);
      } catch {
        /* network or timeout — silently ignore */
      }
    },
    [token],
  );

  const handleChange = useCallback(
    (text: string) => {
      onChange(text);
      suppressFetchRef.current = false;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (!suppressFetchRef.current) {
          void fetchSuggestions(text);
        }
      }, DEBOUNCE_MS);
    },
    [onChange, fetchSuggestions],
  );

  const handleSelect = useCallback(
    (item: LocationSelection) => {
      suppressFetchRef.current = true;
      onChange(item.text);
      onSelect(item);
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
    },
    [onChange, onSelect],
  );

  const handleKeyDown = useCallback(
    (ev: React.KeyboardEvent) => {
      if (!open || suggestions.length === 0) return;

      if (ev.key === "ArrowDown") {
        ev.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestions.length);
      } else if (ev.key === "ArrowUp") {
        ev.preventDefault();
        setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
      } else if (ev.key === "Enter" && activeIndex >= 0) {
        ev.preventDefault();
        handleSelect(suggestions[activeIndex]);
      } else if (ev.key === "Escape") {
        setOpen(false);
      }
    },
    [open, suggestions, activeIndex, handleSelect],
  );

  useEffect(() => {
    function handleClickOutside(ev: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(ev.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(ev) => handleChange(ev.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        className={className}
        data-testid={testId}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={open ? "location-search-listbox" : undefined}
        aria-activedescendant={activeIndex >= 0 ? `location-option-${activeIndex}` : undefined}
        autoComplete="off"
      />

      {open && suggestions.length > 0 && (
        <ul
          id="location-search-listbox"
          role="listbox"
          data-testid="location-suggestions"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg"
        >
          {suggestions.map((item, i) => (
            <li
              key={`${item.lat}-${item.lng}`}
              id={`location-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              data-testid={`location-option-${i}`}
              className={`cursor-pointer px-4 py-2.5 text-body text-text transition ${
                i === activeIndex ? "bg-accent/15 text-accent" : "hover:bg-surface-hover"
              }`}
              onMouseDown={(ev) => {
                ev.preventDefault();
                handleSelect(item);
              }}
            >
              {item.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
