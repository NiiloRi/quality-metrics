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
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-[var(--foreground-muted)] flex-shrink-0" />
        <input
          type="text"
          placeholder="Search stocks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 text-sm min-w-0"
        />
        {query && (
          <button
            type="submit"
            className="px-3 py-1 text-xs font-medium bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-dark)] transition-colors flex-shrink-0"
          >
            Go
          </button>
        )}
      </div>
    </form>
  );
}
