"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);

    // Implement debouncing for better performance
    const delayDebounceFn = setTimeout(() => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      if (newSearchTerm) {
        current.set('q', newSearchTerm);
      } else {
        current.delete('q');
      }
      // Reset page to 1 when search term changes
      current.delete('page');
      router.push(`/?${current.toString()}`);
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">🔍</span>
      <Input
        placeholder="Buscar noticias..."
        className="pl-10 w-64 bg-input border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
        value={searchTerm}
        onChange={handleSearch}
      />
    </div>
  );
}
