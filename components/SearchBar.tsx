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
        className={`flex items-center gap-3 px-4 py-3 bg-white rounded-xl border-2 transition-all ${
          isFocused
            ? 'border-[var(--primary)] shadow-lg shadow-blue-100'
            : 'border-[var(--border)] hover:border-gray-300'
        }`}
      >
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search stocks (e.g., AAPL, MSFT)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder-gray-400 outline-none"
        />
        {query && (
          <button
            type="submit"
            className="px-4 py-1.5 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            Search
          </button>
        )}
      </div>
    </form>
  );
}
