"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/routing";

type Suggestion = { topic: string; title: string; slug: string };

interface SearchInputProps {
  defaultValue?: string;
  onSearch?: (query: string) => void;
}

export function SearchInput({
  defaultValue = "",
  onSearch,
}: SearchInputProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/autocomplete?q=${encodeURIComponent(query)}&locale=${locale}`
        );
        const data = (await res.json()) as { suggestions: Suggestion[] };
        setSuggestions(data.suggestions ?? []);
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, locale]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    }

    if (e.key === "Enter") {
      e.preventDefault();

      if (activeIndex >= 0 && suggestions[activeIndex]) {
        router.push(`/article/${suggestions[activeIndex].slug}`);
      } else if (query.trim()) {
        onSearch?.(query);
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }

      setShowDropdown(false);
    }

    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder="Search any topic..."
          className="h-12 pl-10 text-base"
          aria-label="Search topics"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
      </div>

      {showDropdown && suggestions.length > 0 && (
        <ul
          className="bg-background absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border shadow-lg"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.slug}
              role="option"
              aria-selected={index === activeIndex}
              className={`hover:bg-accent cursor-pointer px-4 py-2 ${
                index === activeIndex ? "bg-accent" : ""
              }`}
              onMouseDown={() => {
                router.push(`/article/${suggestion.slug}`);
                setShowDropdown(false);
              }}
            >
              {suggestion.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
