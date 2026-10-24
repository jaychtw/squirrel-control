const icons: Record<string, string> = {
  pause: '<path d="M8 5v14M16 5v14"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5M8 11h6M11 8v6"/>',
  sound: '<path d="M11 4 6 8H3v8h3l5 4V4ZM15 8q4 4 0 8M18 5q7 7 0 14"/>',
  muted: '<path d="M11 4 6 8H3v8h3l5 4V4ZM16 9l6 6M22 9l-6 6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17h.01"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 3v7h7"/>',
  leaf: '<path d="M5 21C2 8 9 3 21 3c0 11-5 17-14 15M5 21 16 9"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  arrow: '<path d="M4 12h16m-5-5 5 5-5 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  book: '<path d="M12 5v15M12 5Q6 1 2 5v14q5-3 10 1 5-4 10-1V5q-5-4-10 0Z"/>',
  settings: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="currentColor"/><circle cx="16" cy="12" r="2" fill="currentColor"/><circle cx="9" cy="18" r="2" fill="currentColor"/>',
  acorn: '<path d="M5 11q-1 8 7 11 8-3 7-11M3 11q0-8 9-8t9 8H3ZM12 3q0-3 3-3"/>',
};
export const icon = (name: string, cls = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icon ${cls}">${icons[name] || icons.leaf}</svg>`;
