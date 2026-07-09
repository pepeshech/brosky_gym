import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export const User: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle cx="12" cy="7" r="4" fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" cx="12" cy="7" r="4"/>
  </svg>
);

export const Activity: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="12" r="8"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

export const TrendingUp: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <polygon fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" points="23 6 13.5 15.5 8.5 10.5 1 18 1 22 8.5 14.5 13.5 19.5 23 10"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="17 6 23 6 23 12"/>
  </svg>
);

export const TrendingDown: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <polygon fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" points="23 18 13.5 8.5 8.5 13.5 1 6 1 10 8.5 17.5 13.5 12.5 23 22"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="17 18 23 18 23 12"/>
  </svg>
);

export const Dumbbell: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M3 6h2v12H3z M19 6h2v12h-2z"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M6 5h2v14H6z M16 5h2v14h-2z M8 12h8 M2 6h2v12H2z M20 6h2v12h-2z"/>
  </svg>
);

export const Settings: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="12" r="3"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/><circle fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" cx="12" cy="12" r="3"/>
  </svg>
);

export const Calendar: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <rect fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" x="3" y="4" width="18" height="6" rx="2" ry="2"/><rect fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x="3" y="4" width="18" height="18" rx="2" ry="2"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="16" y1="2" x2="16" y2="6"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="8" y1="2" x2="8" y2="6"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

export const ChevronLeft: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="12" r="8"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="15 18 9 12 15 6"/>
  </svg>
);

export const ChevronRight: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="12" r="8"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="9 18 15 12 9 6"/>
  </svg>
);

export const ChevronDown: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="12" r="8"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="6 9 12 15 18 9"/>
  </svg>
);

export const ChevronUp: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="12" r="8"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="18 15 12 9 6 15"/>
  </svg>
);

export const AlertTriangle: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="12" y1="9" x2="12" y2="13"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export const HelpCircle: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="12" r="10"/><circle fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" cx="12" cy="12" r="10"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export const Info: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="12" r="10"/><circle fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" cx="12" cy="12" r="10"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="12" y1="16" x2="12" y2="12"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

export const Droplet: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/>
  </svg>
);

export const Trash2: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M5 6h14v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6z"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="3 6 5 6 21 6"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="10" y1="11" x2="10" y2="17"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

export const Plus: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="12" r="8"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="12" y1="5" x2="12" y2="19"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export const BookOpen: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

export const Sparkles: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.3-6.3l-.7.7M6.7 17.3l-.7.7m12.6 0l-.7-.7M6.7 6.7l-.7-.7"/>
  </svg>
);

export const RefreshCw: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="12" r="6"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="23 4 23 10 17 10"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="1 20 1 14 7 14"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

export const Search: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="11" cy="11" r="8"/><circle fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" cx="11" cy="11" r="8"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

export const LoaderPulse: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke anim-spin" cx="12" cy="12" r="10" strokeDasharray="45" strokeDashoffset="0"/><circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill anim-pulse" cx="12" cy="12" r="4"/>
  </svg>
);

export const Footprints: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M4 16v-2.38C4 11.5 5.88 9.85 6 7.07l.04-1.01C6.08 4.97 7 4 8.05 4H9.1c.98 0 1.77.77 1.8 1.75L11 7.23C11 9.77 9 11.5 9 13.5V16c0 1.1-.9 2-2 2H6a2 2 0 0 1-2-2z"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M4 16v-2.38C4 11.5 5.88 9.85 6 7.07l.04-1.01C6.08 4.97 7 4 8.05 4H9.1c.98 0 1.77.77 1.8 1.75L11 7.23C11 9.77 9 11.5 9 13.5V16c0 1.1-.9 2-2 2H6a2 2 0 0 1-2-2zM13 16v-2.38c0-2.12 1.88-3.77 2-6.55l.04-1.01C15.08 4.97 16 4 17.05 4h1.05c.98 0 1.77.77 1.8 1.75L20 7.23c0 2.54-2 4.27-2 6.27V16c0 1.1-.9 2-2 2h-1a2 2 0 0 1-2-2z"/>
  </svg>
);

export const Shield: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

export const Flame: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);

export const Coffee: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4zM6 1v3M10 1v3M14 1v3"/>
  </svg>
);

export const FileText: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="14 2 14 8 20 8"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="16" y1="13" x2="8" y2="13"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="16" y1="17" x2="8" y2="17"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="10 9 9 9 8 9"/>
  </svg>
);

export const Layers: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <polygon fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" points="12 2 2 7 12 12 22 7 12 2"/><polygon fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="12 2 2 7 12 12 22 7 12 2"/><polygon fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="2 17 12 22 22 17"/><polygon fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="2 12 12 17 22 12"/>
  </svg>
);

export const Download: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
  </svg>
);

export const Upload: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
  </svg>
);

export const Pencil: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
);

export const Check: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="12" r="8"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="20 6 9 17 4 12"/>
  </svg>
);

export const X: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="12" r="8"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="18" y1="6" x2="6" y2="18"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export const CheckCircle: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="12" r="10"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="22 4 12 14.01 9 11.01"/>
  </svg>
);

export const ClipboardList: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x="8" y="2" width="8" height="4" rx="1" ry="1"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="9" y1="12" x2="15" y2="12"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="9" y1="16" x2="15" y2="16"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="21 8 21 8 21 8"/>
  </svg>
);

export const Library: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M12 6v14h4l-4-14z"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M16 6l4 14M12 6v14M8 8v12M4 4v16"/>
  </svg>
);

export const Trophy: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M6 9h12v2.66c0 2.2-1.8 4-4 4h-4c-2.2 0-4-1.8-4-4V9z"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34M12 2a6 6 0 0 1 6 6c0 3.6-3 6-6 6S6 11.6 6 8a6 6 0 0 1 6-6z"/>
  </svg>
);

export const ArrowRight: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="12" r="8"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="5" y1="12" x2="19" y2="12"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="12 5 19 12 12 19"/>
  </svg>
);

export const History: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="12" r="7"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="3 3 3 8 8 8"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="12" y1="7" x2="12" y2="12"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="12" y1="12" x2="16" y2="14"/>
  </svg>
);

export const Clock: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="12" r="10"/><circle fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" cx="12" cy="12" r="10"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="12 6 12 12 16 14"/>
  </svg>
);

export const Target: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="12" r="10"/><circle fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" cx="12" cy="12" r="10"/><circle fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" cx="12" cy="12" r="6"/><circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="12" r="2"/><circle fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" cx="12" cy="12" r="2"/>
  </svg>
);

export const Medal: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="16" r="5"/><circle fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" cx="12" cy="16" r="5"/><path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M8 12.8L5 3h14l-3 9.8"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M8 12.8L5 3h14l-3 9.8"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="12 3 12 11"/>
  </svg>
);

export const Zap: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <polygon fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/><polygon fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

export const Muscle: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M14 6a4 4 0 0 0-7 4 4 4 0 0 1-5 1 4 4 0 0 0 6 6h2c3.5 0 7-3.5 7-7 0-3-1.5-4-3-4z"/><path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M14 6a4 4 0 0 0-7 4 4 4 0 0 1-5 1 4 4 0 0 0 6 6h2c3.5 0 7-3.5 7-7 0-3-1.5-4-3-4z"/>
  </svg>
);

export const Star: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ ...style }}
    {...props}
  >
    <polygon fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/><polygon fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

export const ArrowLeft: React.FC<IconProps> = ({ size = 24, className = '', style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`brosky-icon ${className}`}
    style={{ transform: 'scaleX(-1)', transformOrigin: 'center', ...style }}
    {...props}
  >
    <circle fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" cx="12" cy="12" r="8"/><line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="5" y1="12" x2="19" y2="12"/><polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="12 5 19 12 12 19"/>
  </svg>
);
