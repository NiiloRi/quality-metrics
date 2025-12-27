'use client';

import { useState } from 'react';

interface CompanyLogoProps {
  symbol: string;
  name: string;
  size?: number;
}

export default function CompanyLogo({ symbol, name, size = 32 }: CompanyLogoProps) {
  const [error, setError] = useState(false);

  if (error) {
    // Fallback: show first letter of company name
    return (
      <div
        className="w-full h-full flex items-center justify-center text-[var(--foreground-muted)] font-bold text-lg"
      >
        {name.charAt(0)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://financialmodelingprep.com/image-stock/${symbol}.png`}
      alt={name}
      width={size}
      height={size}
      className="object-contain"
      onError={() => setError(true)}
    />
  );
}
