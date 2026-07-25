import React from 'react';

export type IconColorScheme = 'default' | 'persian' | 'orange' | 'yellow' | 'cyan' | 'emerald' | 'rose' | 'purple';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  colorScheme?: IconColorScheme;
}

const getColorClass = (scheme?: IconColorScheme) => {
  switch (scheme) {
    case 'persian': return 'text-gym-accent';
    case 'orange': return 'text-orange-500';
    case 'yellow': return 'text-yellow-500';
    case 'cyan': return 'text-cyan-500';
    case 'emerald': return 'text-emerald-500';
    case 'rose': return 'text-rose-500';
    case 'purple': return 'text-purple-500';
    default: return '';
  }
};

// 1. User Profile Avatar
export const User: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="8" r="4" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="currentColor" fillOpacity={0.15} d="M12 14c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" className="dt-fill" />
    <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4 20v-1c0-2.76 3.58-5 8-5s8 2.24 8 5v1" className="dt-stroke" />
  </svg>
);

// 2. Camera
export const Camera: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path fill="currentColor" fillOpacity={0.15} d="M4 8h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4 8h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" className="dt-stroke" />
    <circle cx="12" cy="14" r="3.5" fill="none" stroke="currentColor" strokeWidth={2} className="dt-stroke" />
  </svg>
);

// 3. Activity (Pulse & Metabolism)
export const Activity: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points="22 12 17 12 14 20 10 4 7 12 2 12" className="dt-stroke" />
  </svg>
);

// 4. Trending Up
export const TrendingUp: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <polygon points="23 6 13.5 15.5 8.5 10.5 1 18 1 22 23 22 23 6" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points="23 6 13.5 15.5 8.5 10.5 1 18" className="dt-stroke" />
    <polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points="17 6 23 6 23 12" className="dt-stroke" />
  </svg>
);

// 5. Trending Down
export const TrendingDown: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <polygon points="23 18 13.5 8.5 8.5 13.5 1 6 1 2 23 2 23 18" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points="23 18 13.5 8.5 8.5 13.5 1 6" className="dt-stroke" />
    <polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points="17 18 23 18 23 12" className="dt-stroke" />
  </svg>
);

// 6. Dumbbell (Olympic Barbell with Collars)
export const Dumbbell: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <rect x="5" y="6" width="3" height="12" rx="1" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <rect x="16" y="6" width="3" height="12" rx="1" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <rect x="2" y="8" width="2" height="8" rx="0.5" fill="none" stroke="currentColor" strokeWidth={2} className="dt-stroke" />
    <rect x="5" y="6" width="3" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth={2} className="dt-stroke" />
    <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth={3} strokeLinecap="round" className="dt-stroke" />
    <rect x="16" y="6" width="3" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth={2} className="dt-stroke" />
    <rect x="20" y="8" width="2" height="8" rx="0.5" fill="none" stroke="currentColor" strokeWidth={2} className="dt-stroke" />
  </svg>
);

// 7. Settings (Gear Wheel)
export const Settings: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" className="dt-stroke" />
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth={2} className="dt-stroke" />
  </svg>
);

// 8. Calendar
export const Calendar: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <rect x="3" y="4" width="18" height="6" rx="2" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <rect x="3" y="4" width="18" height="17" rx="2" fill="none" stroke="currentColor" strokeWidth={2} className="dt-stroke" />
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth={2} className="dt-stroke" />
  </svg>
);

// 9. Chevron Left
export const ChevronLeft: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <polyline points="15 18 9 12 15 6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
  </svg>
);

// 10. Chevron Right
export const ChevronRight: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <polyline points="9 18 15 12 9 6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
  </svg>
);

// 11. Chevron Down
export const ChevronDown: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
  </svg>
);

// 12. Chevron Up
export const ChevronUp: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <polyline points="18 15 12 9 6 15" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
  </svg>
);

// 13. Alert Triangle
export const AlertTriangle: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <polygon points="10.29 3.86 1.82 18 3.53 21 20.47 21 22.18 18 13.71 3.86 10.29 3.86" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" className="dt-stroke" />
    <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
    <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
  </svg>
);

// 14. Help Circle
export const HelpCircle: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth={2} className="dt-stroke" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" className="dt-stroke" />
    <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
  </svg>
);

// 15. Info
export const Info: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth={2} className="dt-stroke" />
    <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
    <circle cx="12" cy="8" r="1" fill="currentColor" className="dt-stroke" />
  </svg>
);

// 16. Droplet (Hydration & Fats Balance)
export const Droplet: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" className="dt-stroke" />
  </svg>
);

// 17. Trash2
export const Trash2: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path d="M5 6h14v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6z" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <polyline points="3 6 5 6 21 6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" className="dt-stroke" />
    <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
    <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
  </svg>
);

// 18. Plus
export const Plus: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <line x1="12" y1="6" x2="12" y2="18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
    <line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
  </svg>
);

// 19. Book Open (Training Guide)
export const BookOpen: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" className="dt-stroke" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" className="dt-stroke" />
  </svg>
);

// 20. Sparkles (Chrome AI Neural Star)
export const Sparkles: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" className="dt-stroke" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" className="dt-stroke" />
  </svg>
);

// 21. Refresh Cw (Sync Arrows with .anim-spin)
export const RefreshCw: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="12" r="7" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <polyline points="23 4 23 10 17 10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
    <polyline points="1 20 1 14 7 14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" className="dt-stroke" />
  </svg>
);

// 22. Search
export const Search: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="11" cy="11" r="7" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth={2} className="dt-stroke" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
  </svg>
);

// 23. Loader Pulse
export const LoaderPulse: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity={0.15} className="dt-fill anim-pulse" />
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth={2} strokeDasharray="30 15" strokeLinecap="round" className="dt-stroke anim-spin" />
  </svg>
);

// 24. Footprints (NEAT Walking Step Soles)
export const Footprints: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path d="M4 16v-2.38C4 11.5 5.88 9.85 6 7.07l.04-1.01C6.08 4.97 7 4 8.05 4H9.1c.98 0 1.77.77 1.8 1.75L11 7.23C11 9.77 9 11.5 9 13.5V16c0 1.1-.9 2-2 2H6a2 2 0 0 1-2-2z" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4 16v-2.38C4 11.5 5.88 9.85 6 7.07l.04-1.01C6.08 4.97 7 4 8.05 4H9.1c.98 0 1.77.77 1.8 1.75L11 7.23C11 9.77 9 11.5 9 13.5V16c0 1.1-.9 2-2 2H6a2 2 0 0 1-2-2zM13 16v-2.38c0-2.12 1.88-3.77 2-6.55l.04-1.01C15.08 4.97 16 4 17.05 4h1.05c.98 0 1.77.77 1.8 1.75L20 7.23c0 2.54-2 4.27-2 6.27V16c0 1.1-.9 2-2 2h-1a2 2 0 0 1-2-2z" className="dt-stroke" />
  </svg>
);

// 25. Shield (Fascia Protection Badge)
export const Shield: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" className="dt-stroke" />
  </svg>
);

// 26. Flame (Progressive Overload Spark)
export const Flame: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" className="dt-stroke" />
  </svg>
);

// 27. Coffee (Energy Espresso Cup)
export const Coffee: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4zM6 1v3M10 1v3M14 1v3" className="dt-stroke" />
  </svg>
);

// 28. File Text (Report Sheet)
export const FileText: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" className="dt-stroke" />
    <polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
    <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
    <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
  </svg>
);

// 29. Layers (LLM Detail Depth)
export const Layers: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <polygon points="12 2 2 7 12 12 22 7 12 2" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <polygon points="12 2 2 7 12 12 22 7 12 2" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
    <polyline points="2 17 12 22 22 17" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
    <polyline points="2 12 12 17 22 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
  </svg>
);

// 30. Download
export const Download: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" className="dt-stroke" />
  </svg>
);

// 31. Upload
export const Upload: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" className="dt-stroke" />
  </svg>
);

// 32. Pencil
export const Pencil: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" className="dt-stroke" />
  </svg>
);

// 33. Check
export const Check: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
  </svg>
);

// 34. X
export const X: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="dt-stroke" />
    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="dt-stroke" />
  </svg>
);

// 35. Check Circle
export const CheckCircle: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M22 11.08V12a10 10 0 1 1-5.93-9.14" className="dt-stroke" />
    <polyline points="22 4 12 14.01 9 11.01" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
  </svg>
);

// 36. Clipboard List
export const ClipboardList: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" className="dt-stroke" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" fill="none" stroke="currentColor" strokeWidth={2} className="dt-stroke" />
    <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
    <line x1="9" y1="16" x2="15" y2="16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
  </svg>
);

// 37. Library (Exercise Database)
export const Library: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path d="M12 6v14h4l-4-14z" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M16 6l4 14M12 6v14M8 8v12M4 4v16" className="dt-stroke" />
  </svg>
);

// 38. Trophy (Powerlifting Championship Trophy)
export const Trophy: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path d="M6 9h12v2.66c0 2.2-1.8 4-4 4h-4c-2.2 0-4-1.8-4-4V9z" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34M12 2a6 6 0 0 1 6 6c0 3.6-3 6-6 6S6 11.6 6 8a6 6 0 0 1 6-6z" className="dt-stroke" />
  </svg>
);

// 39. Arrow Right
export const ArrowRight: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="12" r="8" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
    <polyline points="12 5 19 12 12 19" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
  </svg>
);

// 40. History
export const History: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="12" r="7" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" className="dt-stroke" />
    <polyline points="3 3 3 8 8 8" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
    <line x1="12" y1="7" x2="12" y2="12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
    <line x1="12" y1="12" x2="16" y2="14" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
  </svg>
);

// 41. Clock
export const Clock: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth={2} className="dt-stroke" />
    <polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
  </svg>
);

// 42. Target (RIR / RPE Precision Target)
export const Target: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth={2} className="dt-stroke" />
    <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth={2} className="dt-stroke" />
    <circle cx="12" cy="12" r="2" fill="currentColor" className="dt-stroke" />
  </svg>
);

// 43. Medal
export const Medal: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="16" r="5" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <circle cx="12" cy="16" r="5" fill="none" stroke="currentColor" strokeWidth={2} className="dt-stroke" />
    <path fill="currentColor" fillOpacity={0.15} d="M8 12.8L5 3h14l-3 9.8" className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M8 12.8L5 3h14l-3 9.8" className="dt-stroke" />
    <polyline points="12 3 12 11" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
  </svg>
);

// 44. Zap (Energy & Overload Bolt)
export const Zap: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
  </svg>
);

// 45. Muscle (Flexed Bicep Belly with Tension Line)
export const Muscle: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path d="M14 6a4 4 0 0 0-7 4 4 4 0 0 1-5 1 4 4 0 0 0 6 6h2c3.5 0 7-3.5 7-7 0-3-1.5-4-3-4z" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M14 6a4 4 0 0 0-7 4 4 4 0 0 1-5 1 4 4 0 0 0 6 6h2c3.5 0 7-3.5 7-7 0-3-1.5-4-3-4z" className="dt-stroke" />
  </svg>
);

// 46. Star
export const Star: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
  </svg>
);

// 47. Arrow Left
export const ArrowLeft: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ transform: 'scaleX(-1)', transformOrigin: 'center', ...style }}
    {...props}
  >
    <circle cx="12" cy="12" r="8" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
    <polyline points="12 5 19 12 12 19" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
  </svg>
);

// 48. Barcode Scanner
export const Barcode: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <rect x="3" y="4" width="18" height="16" rx="2" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth={2} className="dt-stroke" />
    <line x1="6" y1="7" x2="6" y2="17" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
    <line x1="9" y1="7" x2="9" y2="17" stroke="currentColor" strokeWidth={1} strokeLinecap="round" className="dt-stroke" />
    <line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth={3} strokeLinecap="round" className="dt-stroke" />
    <line x1="15" y1="7" x2="15" y2="17" stroke="currentColor" strokeWidth={1} strokeLinecap="round" className="dt-stroke" />
    <line x1="18" y1="7" x2="18" y2="17" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
  </svg>
);

// 49. LogOut
export const LogOut: React.FC<IconProps> = ({ size = 18, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
    <polyline points="16 17 21 12 16 7" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
  </svg>
);

// 50. Printer
export const Printer: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <polyline points="6 9 6 2 18 2 18 9" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" className="dt-stroke" />
    <rect x="6" y="14" width="12" height="8" fill="none" stroke="currentColor" strokeWidth={2} className="dt-stroke" />
  </svg>
);

// 51. Scale (Digital Kitchen & Body Scale)
export const Scale: React.FC<IconProps> = ({ size = 24, className = '', colorScheme, style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${getColorClass(colorScheme)} ${className}`}
    style={{ ...style }}
    {...props}
  >
    <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" fillOpacity={0.15} className="dt-fill" />
    <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth={2} className="dt-stroke" />
    <rect x="7" y="6" width="10" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth={1.5} className="dt-stroke" />
    <line x1="12" y1="14" x2="12" y2="18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
    <line x1="9" y1="16" x2="15" y2="16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="dt-stroke" />
  </svg>
);
