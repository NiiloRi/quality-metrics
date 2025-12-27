interface GlowCardProps {
  children: React.ReactNode;
  glowColor?: 'primary' | 'success' | 'purple' | 'gold';
  className?: string;
}

export default function GlowCard({
  children,
  glowColor = 'primary',
  className = '',
}: GlowCardProps) {
  const glowColors = {
    primary: 'from-cyan-500 to-blue-500',
    success: 'from-emerald-500 to-teal-500',
    purple: 'from-purple-500 to-indigo-500',
    gold: 'from-amber-500 to-yellow-500',
  };

  return (
    <div className="relative group h-full">
      <div
        className={`absolute inset-0 bg-gradient-to-r ${glowColors[glowColor]} rounded-xl blur-sm opacity-0 group-hover:opacity-20 transition duration-300`}
      />
      <div className={`relative card-professional h-full ${className}`}>
        {children}
      </div>
    </div>
  );
}
