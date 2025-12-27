'use client';

import { useSession } from 'next-auth/react';
import PaywallOverlay from './PaywallOverlay';

interface PremiumSectionProps {
  children: React.ReactNode;
  className?: string;
}

export default function PremiumSection({ children, className = '' }: PremiumSectionProps) {
  const { data: session, status } = useSession();

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className={`animate-pulse ${className}`}>
        {children}
      </div>
    );
  }

  // Check if user has premium access
  const hasPremium =
    session?.user?.subscriptionTier === 'trial' ||
    session?.user?.subscriptionTier === 'premium';

  if (hasPremium) {
    return <div className={className}>{children}</div>;
  }

  return (
    <PaywallOverlay className={className}>
      {children}
    </PaywallOverlay>
  );
}
