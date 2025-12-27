'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 38, text: 'text-lg', gap: 'gap-2.5' },
    md: { icon: 46, text: 'text-xl', gap: 'gap-3' },
    lg: { icon: 56, text: 'text-2xl', gap: 'gap-4' },
  };

  const { icon, text, gap } = sizes[size];

  return (
    <div className={`flex items-center ${gap}`}>
      {/* Logo Icon */}
      <div className="relative group">
        {/* Outer glow - gold */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"
          style={{ width: icon + 8, height: icon + 8, left: -4, top: -4 }}
        />

        {/* Main logo SVG - mirrored */}
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-lg"
          style={{ transform: 'scaleX(-1)' }}
        >
          <defs>
            {/* Main gradient - gold/amber */}
            <linearGradient id="logoMainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            {/* Inner shadow gradient */}
            <linearGradient id="logoInnerShadow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
            </linearGradient>

            {/* Shine gradient */}
            <linearGradient id="logoShine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Bar gradients - green to red pattern */}
            <linearGradient id="barGreen" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="barLightGreen" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#65a30d" />
              <stop offset="100%" stopColor="#84cc16" />
            </linearGradient>
            <linearGradient id="barYellow" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <linearGradient id="barRed" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>

            {/* Ring gradient - gold */}
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>

            {/* Drop shadow filter */}
            <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.3"/>
            </filter>
          </defs>

          {/* Background circle with gradient */}
          <circle
            cx="32"
            cy="32"
            r="30"
            fill="url(#logoMainGradient)"
          />

          {/* Inner circle for depth */}
          <circle
            cx="32"
            cy="32"
            r="30"
            fill="url(#logoInnerShadow)"
          />

          {/* Outer ring */}
          <circle
            cx="32"
            cy="32"
            r="29"
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth="1.5"
            opacity="0.6"
          />

          {/* Shine overlay */}
          <ellipse
            cx="24"
            cy="20"
            rx="16"
            ry="12"
            fill="url(#logoShine)"
          />

          {/* Chart bars - green to red pattern, positioned lower */}
          <g filter="url(#dropShadow)">
            {/* Bar 1 - Green (best) */}
            <rect
              x="14"
              y="30"
              width="8"
              height="18"
              rx="2"
              fill="url(#barGreen)"
            />
            {/* Bar 2 - Light green */}
            <rect
              x="24"
              y="34"
              width="8"
              height="14"
              rx="2"
              fill="url(#barLightGreen)"
            />
            {/* Bar 3 - Yellow/Orange */}
            <rect
              x="34"
              y="38"
              width="8"
              height="10"
              rx="2"
              fill="url(#barYellow)"
            />
            {/* Bar 4 - Red (worst) */}
            <rect
              x="44"
              y="42"
              width="8"
              height="6"
              rx="2"
              fill="url(#barRed)"
            />
          </g>

          {/* Upward trend line - positioned above bars */}
          <path
            d="M16 24 Q22 20, 28 17 T42 12 L48 10"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.95"
            filter="url(#dropShadow)"
          />

          {/* Arrow head */}
          <path
            d="M44 12 L48.5 9.5 L49 14"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.95"
          />

          {/* Subtle inner border highlight */}
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            opacity="0.2"
          />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-heading font-bold ${text} tracking-tight text-[var(--foreground)]`}>
            Quality
          </span>
          <span className={`font-heading font-bold ${text} tracking-tight bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent`}>
            Metrics
          </span>
        </div>
      )}
    </div>
  );
}
