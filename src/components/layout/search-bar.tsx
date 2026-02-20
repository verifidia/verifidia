"use client";

import { type FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/routing";

type SearchBarProps = {
  onSearch?: (query: string) => void;
  locale?: string;
};

export function SearchBar({ onSearch, locale }: SearchBarProps) {
  const t = useTranslations("search");
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    
    if (onSearch) {
      onSearch(trimmedQuery);
    } else if (locale && trimmedQuery) {
      // Default behavior: navigate to search page with query
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
      <div className="relative">
        <Search
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("placeholder")}
          className="h-14 rounded-full border-border/80 bg-background px-12 text-base shadow-sm md:text-base"
        />
      </div>
    </form>
  );
}
