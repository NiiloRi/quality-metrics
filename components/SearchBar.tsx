'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput } from '@tremor/react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/stock/${query.trim().toUpperCase()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <TextInput
        placeholder="Hae osaketta (esim. AAPL, MSFT, GOOGL)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="text-lg"
      />
    </form>
  );
}
