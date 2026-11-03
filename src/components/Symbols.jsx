// The SVG drawings used across the app, drawn once and reused with <Icon> and <Hanger>.
export default function Symbols() {
  return (
    <svg width="0" height="0" className="sr-only" aria-hidden="true">
      <defs>
        <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d4a46c" />
          <stop offset=".55" stopColor="#b47e46" />
          <stop offset="1" stopColor="#8d5d2e" />
        </linearGradient>
        <symbol id="hanger" viewBox="0 0 200 90">
          <path d="M100 62 V33 a7 7 0 0 1 14 0 v7" fill="none" stroke="#7d827e" strokeWidth="4" strokeLinecap="round" />
          <path d="M12 77 Q100 44 188 77 Q193 84 184 87 Q100 57 16 87 Q7 84 12 77 Z" fill="url(#wood)" />
          <path d="M30 76 Q100 50 170 76" fill="none" stroke="#e6c391" strokeWidth="1.2" opacity=".7" />
          <rect fill="#2b2f2d" x="34" y="78" width="9" height="13" rx="1.5" />
          <rect fill="#2b2f2d" x="157" y="78" width="9" height="13" rx="1.5" />
        </symbol>
        <symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></symbol>
        <symbol id="i-left" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6" /></symbol>
        <symbol id="i-right" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></symbol>
        <symbol id="i-upload" viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" /></symbol>
        <symbol id="i-list" viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></symbol>
        <symbol id="i-cards" viewBox="0 0 24 24"><rect x="7" y="4" width="12" height="16" rx="2" /><path d="M4 7.5v10A2.5 2.5 0 0 0 6.5 20" /></symbol>
        <symbol id="i-file" viewBox="0 0 24 24"><path d="M14 3H6v18h12V7zM14 3v4h4M9 12h6M9 16h6" /></symbol>
        <symbol id="i-hang" viewBox="0 0 24 24"><path d="M12 9V7.5a2 2 0 1 1 2 2M3 18l9-6 9 6z" /></symbol>
        <symbol id="i-sliders" viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4" /></symbol>
      </defs>
    </svg>
  );
}
