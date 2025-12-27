'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/stock/${query.trim().toUpperCase()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg">
      <div
        className={`flex items-center gap-3 px-4 py-3 bg-[var(--card)] rounded-xl border-2 transition-all ${
          isFocused
            ? 'border-[var(--primary)] shadow-lg shadow-[var(--glow-primary)]'
            : 'border-[var(--border)] hover:border-[var(--border-hover)]'
        }`}
      >
        <Search className="w-5 h-5 text-[var(--foreground-muted)]" />
        <input
          type="text"
          placeholder="Search stocks (e.g., AAPL, MSFT)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 bg-transparent text-[15px] text-[var(--foreground)] placeholder-[var(--foreground-muted)] outline-none border-none p-0"
        />
        {query && (
          <button
            type="submit"
            className="btn-primary px-4 py-1.5 text-sm"
          >
            Search
          </button>
        )}
      </div>
    </form>
  );
}
