/**
 * Rwandan cultural SVG patterns inspired by Imigongo art
 * (traditional geometric cow-dung paintings from eastern Rwanda)
 */

// Imigongo-style geometric border band
export const ImigongoBorder = ({ className = '' }) => (
  <div className={`w-full overflow-hidden ${className}`}>
    <svg viewBox="0 0 1200 24" className="w-full h-6" preserveAspectRatio="none">
      {/* Repeating diamond/chevron pattern in Rwandan earth tones */}
      {Array.from({ length: 20 }).map((_, i) => (
        <g key={i} transform={`translate(${i * 60}, 0)`}>
          <polygon points="30,0 60,12 30,24 0,12" fill={i % 2 === 0 ? '#92400e' : '#d97706'} />
          <polygon points="30,4 52,12 30,20 8,12" fill={i % 2 === 0 ? '#fbbf24' : '#92400e'} />
          <circle cx="30" cy="12" r="2" fill="#fff" opacity="0.6" />
        </g>
      ))}
    </svg>
  </div>
);

// Small Imigongo tile for decorative use
export const ImigongoTile = ({ size = 40, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
    <rect width="40" height="40" rx="4" fill="#1e293b" />
    <polygon points="20,2 38,20 20,38 2,20" fill="#92400e" />
    <polygon points="20,8 32,20 20,32 8,20" fill="#d97706" />
    <polygon points="20,14 26,20 20,26 14,20" fill="#fbbf24" />
    <circle cx="20" cy="20" r="2" fill="#fff" />
  </svg>
);

// Intore dance silhouette icon (traditional Rwandan warrior dance)
export const IntoreIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* Stylized dancer with headdress */}
    <circle cx="12" cy="4" r="2.5" />
    {/* Headdress feathers */}
    <path d="M10 2 L8 0 M12 1.5 L12 0 M14 2 L16 0" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
    {/* Body */}
    <path d="M12 6.5 L12 14" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" />
    {/* Arms raised holding shield/spear */}
    <path d="M12 9 L7 6 M12 9 L17 6" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" />
    {/* Skirt */}
    <path d="M8 14 L12 14 L16 14 L14 20 L10 20 Z" opacity="0.7" />
    {/* Legs */}
    <path d="M10 20 L8 24 M14 20 L16 24" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" />
  </svg>
);

// Agaseke basket icon (traditional woven peace basket)
export const AgasekeIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    {/* Basket lid/top */}
    <ellipse cx="12" cy="6" rx="9" ry="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 3 L12 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="1" r="1" fill="currentColor" />
    {/* Basket body */}
    <path d="M3 6 C3 6 4 18 12 18 C20 18 21 6 21 6" stroke="currentColor" strokeWidth="1.5" />
    {/* Weave pattern */}
    <path d="M6 9 L18 9 M5 12 L19 12 M7 15 L17 15" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
    {/* Zigzag weave */}
    <path d="M6 9 L8 12 L10 9 L12 12 L14 9 L16 12 L18 9" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
    {/* Base */}
    <ellipse cx="12" cy="18" rx="5" ry="1.5" stroke="currentColor" strokeWidth="1" />
  </svg>
);

// Drum icon (Ingoma - traditional Rwandan drum)
export const IngomaIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    {/* Drum top */}
    <ellipse cx="12" cy="5" rx="8" ry="3" stroke="currentColor" strokeWidth="1.5" />
    {/* Drum body */}
    <path d="M4 5 C4 5 3 19 12 19 C21 19 20 5 20 5" stroke="currentColor" strokeWidth="1.5" />
    {/* Decorative bands */}
    <path d="M5 9 L19 9" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    <path d="M4 13 L20 13" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    {/* Cross-lacing */}
    <path d="M6 9 L8 13 M10 9 L12 13 M14 9 L16 13 M18 9 L20 13" stroke="currentColor" strokeWidth="0.75" opacity="0.3" />
    {/* Base */}
    <ellipse cx="12" cy="19" rx="4" ry="1.5" stroke="currentColor" strokeWidth="1" />
    {/* Drumsticks */}
    <path d="M2 3 L7 7 M22 3 L17 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Decorative Imigongo-inspired section divider
export const ImigongoDivider = ({ className = '' }) => (
  <div className={`flex items-center justify-center gap-3 ${className}`}>
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-600/40 to-amber-600/40" />
    <svg width="32" height="32" viewBox="0 0 32 32">
      <polygon points="16,0 32,16 16,32 0,16" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <polygon points="16,6 26,16 16,26 6,16" fill="currentColor" opacity="0.15" />
      <polygon points="16,11 21,16 16,21 11,16" fill="currentColor" opacity="0.3" />
    </svg>
    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-600/40 to-amber-600/40" />
  </div>
);
