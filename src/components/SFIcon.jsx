/**
 * SFIcon — sistema icone in stile SF Symbols / Apple Design
 * Stroke thin (1.5), monoline, arrotondato, minimalista.
 * Drop-in replacement per lucide-react.
 */

const SF = ({ children, size = 20, color = 'currentColor', style, className, strokeWidth = 1.5 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}
    className={className}
  >
    {children}
  </svg>
)

// ── Navigation ──────────────────────────────────────────────────────
export const ChevronDown  = p => <SF {...p}><path d="M6 9l6 6 6-6"/></SF>
export const ChevronUp    = p => <SF {...p}><path d="M18 15l-6-6-6 6"/></SF>
export const ChevronRight = p => <SF {...p}><path d="M9 18l6-6-6-6"/></SF>
export const ChevronLeft  = p => <SF {...p}><path d="M15 18l-6-6 6-6"/></SF>
export const ArrowLeft    = p => <SF {...p}><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></SF>
export const ArrowRight   = p => <SF {...p}><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></SF>
export const ArrowUp      = p => <SF {...p}><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></SF>

// ── Actions ─────────────────────────────────────────────────────────
export const X            = p => <SF {...p}><path d="M18 6L6 18"/><path d="M6 6l12 12"/></SF>
export const Plus         = p => <SF {...p}><path d="M12 5v14"/><path d="M5 12h14"/></SF>
export const Check        = p => <SF {...p}><path d="M20 6L9 17l-5-5"/></SF>
export const Search       = p => <SF {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></SF>
export const Copy         = p => <SF {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></SF>
export const Download     = p => <SF {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></SF>
export const Upload       = p => <SF {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></SF>
export const Save         = p => <SF {...p}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></SF>
export const Trash2       = p => <SF {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></SF>
export const Pencil       = p => <SF {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></SF>
export const RefreshCw    = p => <SF {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></SF>
export const RotateCcw    = p => <SF {...p}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></SF>
export const ExternalLink = p => <SF {...p}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></SF>
export const Share2       = p => <SF {...p}><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><line x1="8.45" y1="13.32" x2="15.55" y2="17.68"/><line x1="15.55" y1="6.32" x2="8.45" y2="10.68"/></SF>
export const Link2        = p => <SF {...p}><path d="M15 7h3a5 5 0 010 10h-3"/><path d="M9 17H6A5 5 0 016 7h3"/><line x1="8" y1="12" x2="16" y2="12"/></SF>
export const Move         = p => <SF {...p}><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></SF>
export const GripVertical = p => <SF {...p}><circle cx="9" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="19" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="19" r="1" fill="currentColor" stroke="none"/></SF>

// ── Status & Feedback ────────────────────────────────────────────────
export const CheckCircle2  = p => <SF {...p}><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></SF>
export const XCircle       = p => <SF {...p}><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/></SF>
export const AlertCircle   = p => <SF {...p}><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16.5" r="0.5" fill="currentColor" stroke="none"/></SF>
export const AlertTriangle = p => <SF {...p}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none"/></SF>
export const Loader2       = p => <SF {...p} style={{ ...p?.style, animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></SF>
export const WifiOff       = p => <SF {...p}><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/><path d="M5 12.55a10.94 10.94 0 015.17-2.39"/><path d="M10.71 5.05A16 16 0 0122.56 9"/><path d="M1.42 9a15.91 15.91 0 014.7-2.88"/><path d="M8.53 16.11a6 6 0 016.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor" stroke="none"/></SF>
export const ImageOff      = p => <SF {...p}><line x1="2" y1="2" x2="22" y2="22"/><path d="M10.41 10.41a2 2 0 11-2.83-2.83"/><line x1="13.5" y1="6.5" x2="16" y2="6.5"/><path d="M18 12l-4-4-6 6"/><path d="M3 3h1a2 2 0 012 2v0a2 2 0 002 2h0"/><path d="M21 15V5a2 2 0 00-2-2H9"/><path d="M3 15v4a2 2 0 002 2h14"/></SF>

// ── People ───────────────────────────────────────────────────────────
export const User      = p => <SF {...p}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"/></SF>
export const Users     = p => <SF {...p}><circle cx="9" cy="7" r="4"/><path d="M3 20c0-3.5 2.686-6 6-6s6 2.5 6 6"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 20c0-3.5-2.686-6-6-6"/></SF>
export const UserPlus  = p => <SF {...p}><circle cx="9" cy="7" r="4"/><path d="M3 20c0-3.5 2.686-6 6-6s6 2.5 6 6"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></SF>
export const UserCheck = p => <SF {...p}><circle cx="9" cy="7" r="4"/><path d="M3 20c0-3.5 2.686-6 6-6s6 2.5 6 6"/><polyline points="16 11 18 13 22 9"/></SF>
export const UserX     = p => <SF {...p}><circle cx="9" cy="7" r="4"/><path d="M3 20c0-3.5 2.686-6 6-6s6 2.5 6 6"/><line x1="17" y1="9" x2="23" y2="15"/><line x1="23" y1="9" x2="17" y2="15"/></SF>
export const ShieldCheck = p => <SF {...p}><path d="M12 2l7 4v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4z"/><polyline points="9 12 11 14 15 10"/></SF>

// ── Communication ────────────────────────────────────────────────────
export const Mail         = p => <SF {...p}><rect x="2" y="4" width="20" height="16" rx="2.5"/><polyline points="2 4 12 13 22 4"/></SF>
export const MessageSquare = p => <SF {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></SF>
export const Bell         = p => <SF {...p}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></SF>
export const BellOff      = p => <SF {...p}><path d="M13.73 21a2 2 0 01-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0118 8"/><path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 00-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></SF>
export const Phone        = p => <SF {...p}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .89h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></SF>
export const QrCode       = p => <SF {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="4.5" y="4.5" width="4" height="4"/><rect x="15.5" y="4.5" width="4" height="4"/><rect x="4.5" y="15.5" width="4" height="4"/><path d="M14 14h3v3"/><path d="M17 17h4"/><path d="M17 21v-1"/><path d="M21 14v3"/></SF>

// ── Data & Analytics ─────────────────────────────────────────────────
export const BarChart2   = p => <SF {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></SF>
export const TrendingUp  = p => <SF {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></SF>
export const Activity    = p => <SF {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></SF>
export const Star        = p => <SF {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></SF>
export const Award       = p => <SF {...p}><circle cx="12" cy="9" r="6"/><path d="M8.56 17.19L7 22l5-3 5 3-1.56-4.81"/></SF>

// ── Time & Calendar ──────────────────────────────────────────────────
export const Calendar    = p => <SF {...p}><rect x="3" y="4" width="18" height="18" rx="2.5"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></SF>
export const CalendarDays = p => <SF {...p}><rect x="3" y="4" width="18" height="18" rx="2.5"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="8" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="15" r="1" fill="currentColor" stroke="none"/></SF>
export const Clock       = p => <SF {...p}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></SF>

// ── UI & Settings ────────────────────────────────────────────────────
export const Settings    = p => <SF {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></SF>
export const Eye         = p => <SF {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></SF>
export const EyeOff      = p => <SF {...p}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></SF>
export const Lock        = p => <SF {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></SF>
export const Camera      = p => <SF {...p}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></SF>
export const CameraOff   = p => <SF {...p}><line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 01-2-2V8a2 2 0 012-2h3m3-3h6l2 3h2a2 2 0 012 2v9.34"/><circle cx="12" cy="13" r="4"/></SF>
export const MapPin      = p => <SF {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></SF>
export const Ticket      = p => <SF {...p}><path d="M15 5H2a1 1 0 00-1 1v4a1 1 0 001 1 2 2 0 010 4 1 1 0 00-1 1v4a1 1 0 001 1h13"/><path d="M9 5h13a1 1 0 011 1v4a1 1 0 01-1 1 2 2 0 000 4 1 1 0 011 1v4a1 1 0 01-1 1H9"/></SF>
export const ToggleLeft  = p => <SF {...p}><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="8" cy="12" r="4" fill="currentColor" stroke="none"/></SF>
export const ToggleRight = p => <SF {...p}><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="4" fill="white" stroke="none"/></SF>
export const Square      = p => <SF {...p}><rect x="3" y="3" width="18" height="18" rx="3"/></SF>
export const CheckSquare = p => <SF {...p}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></SF>

// ── Text formatting ──────────────────────────────────────────────────
export const Bold        = p => <SF {...p}><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></SF>
export const Italic      = p => <SF {...p}><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></SF>
export const Underline   = p => <SF {...p}><path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></SF>
export const AlignLeft   = p => <SF {...p}><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></SF>
export const AlignCenter = p => <SF {...p}><line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="12" x2="7" y2="12"/><line x1="19" y1="18" x2="5" y2="18"/></SF>
export const AlignRight  = p => <SF {...p}><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/></SF>
export const Type        = p => <SF {...p}><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></SF>

// ── UI Elements ──────────────────────────────────────────────────────
export const Minus        = p => <SF {...p}><line x1="5" y1="12" x2="19" y2="12"/></SF>
export const Send         = p => <SF {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></SF>
export const Code         = p => <SF {...p}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></SF>
export const Code2        = p => <SF {...p}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></SF>
export const Monitor      = p => <SF {...p}><rect x="2" y="3" width="20" height="14" rx="2.5"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></SF>
export const Smartphone   = p => <SF {...p}><rect x="5" y="2" width="14" height="20" rx="3"/><line x1="12" y1="18" x2="12.01" y2="18"/></SF>
export const Globe        = p => <SF {...p}><circle cx="12" cy="12" r="9"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></SF>
export const Columns      = p => <SF {...p}><path d="M12 3h7a2 2 0 012 2v14a2 2 0 01-2 2h-7m0-18H5a2 2 0 00-2 2v14a2 2 0 002 2h7m0-18v18"/></SF>
export const Layers       = p => <SF {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></SF>
export const Layout       = p => <SF {...p}><rect x="3" y="3" width="18" height="18" rx="2.5"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></SF>
export const LayoutTemplate = p => <SF {...p}><rect x="3" y="3" width="18" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></SF>
export const Grid3x3      = p => <SF {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></SF>
export const Hash         = p => <SF {...p}><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></SF>
export const Image        = p => <SF {...p}><rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></SF>
export const BookOpen     = p => <SF {...p}><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></SF>
export const Circle       = p => <SF {...p}><circle cx="12" cy="12" r="9"/></SF>
export const CheckCircle  = CheckCircle2
export const ClipboardCheck = p => <SF {...p}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></SF>
export const PanelRightClose = p => <SF {...p}><rect x="3" y="3" width="18" height="18" rx="2.5"/><line x1="15" y1="3" x2="15" y2="21"/><path d="M18 9l-3 3 3 3"/></SF>
export const PanelRightOpen  = p => <SF {...p}><rect x="3" y="3" width="18" height="18" rx="2.5"/><line x1="15" y1="3" x2="15" y2="21"/><path d="M12 9l3 3-3 3"/></SF>
export const Settings2    = Settings
export const SlidersHorizontal = p => <SF {...p}><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="3" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/></SF>
export const Palette      = p => <SF {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="15.6" cy="10" r="1.5" fill="currentColor" stroke="none"/><circle cx="15.6" cy="14" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/><circle cx="8.4" cy="14" r="1.5" fill="currentColor" stroke="none"/><circle cx="8.4" cy="10" r="1.5" fill="currentColor" stroke="none"/></SF>
export const MousePointerClick = p => <SF {...p}><path d="M9 9l1.5 10L13 14l5 2.5-5-12.5z"/><path d="M6 6l-1-1"/><path d="M4 11H3"/><path d="M6 16l-1 1"/><path d="M11 4V3"/></SF>
export const Wand2        = p => <SF {...p}><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8L19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2L19 5"/><path d="M3 21l9-9"/><path d="M12.2 6.2L11 5"/></SF>
export const Zap          = p => <SF {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></SF>

// ── Alias per compatibilità ──────────────────────────────────────────
export const Loader = Loader2
export const ChevronLeftIcon = ChevronLeft
