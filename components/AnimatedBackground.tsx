'use client';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient - deep dark blue */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e17] via-[#0f1520] to-[#0a0e17] transition-colors duration-500" />

      {/* Animated gradient orbs - gold/amber tones */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-r from-amber-500/15 to-yellow-400/10 rounded-full blur-3xl animate-blob" />
      <div className="absolute top-0 -right-40 w-96 h-96 bg-gradient-to-r from-orange-500/12 to-amber-400/8 rounded-full blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-40 left-1/2 w-96 h-96 bg-gradient-to-r from-yellow-500/10 to-amber-300/8 rounded-full blur-3xl animate-blob animation-delay-4000" />

      {/* Central pulsing glow - gold accent */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-amber-500/8 via-orange-500/4 to-transparent rounded-full blur-3xl animate-pulse-slow" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(245, 158, 11, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(245, 158, 11, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,#0a0e17_70%)]" />

      {/* Mesh gradient effect */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-yellow-500/5 rounded-full blur-[80px]" />
      </div>

      {/* Noise texture for subtle grain */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
