'use client';

/**
 * Demo Mode Banner
 *
 * Shows a banner when the app is running in demo mode
 * with fictional data for API enterprise application
 */

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default function DemoBanner() {
  if (!DEMO_MODE) return null;

  return (
    <div className="bg-amber-500 text-amber-950 text-center py-2 px-4 text-sm font-medium">
      <span className="inline-flex items-center gap-2">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Demo Mode - All company names and data are fictional for demonstration purposes
      </span>
    </div>
  );
}
